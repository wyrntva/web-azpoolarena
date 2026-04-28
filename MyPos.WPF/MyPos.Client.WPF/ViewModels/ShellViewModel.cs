using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MyPos.Client.WPF.ViewModels;
using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Models;
using MyPos.SyncService.Clients;
using System.Collections.ObjectModel;
using System.Windows.Threading;

namespace MyPos.Client.WPF.ViewModels;

/// <summary>
/// ViewModel cho màn hình Shell (container chính).
/// Tương đương App.tsx — quản lý screen state, orders polling, TTS.
/// 
/// Trong WPF, ShellView là Window chứa ContentControl.
/// ContentControl.Content bind với CurrentViewModel để switch views.
/// </summary>
public partial class ShellViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;
    private readonly ISecureConfigService _config;
    private readonly CloudApiClient _cloudApi;
    private readonly ITtsService _tts;

    // ============================================
    // OBSERVABLE STATE
    // Tương đương useState<Order[]>([]) trong App.tsx
    // ============================================

    [ObservableProperty]
    private BaseViewModel? _currentViewModel;

    [ObservableProperty]
    private ObservableCollection<Order> _orders = new();

    [ObservableProperty]
    private Order? _currentPendingScoreboardOrder;

    [ObservableProperty]
    private int _pendingScoreboardCount;

    // ---- Polling Timer (thay setInterval 5000ms) ----
    private readonly DispatcherTimer _ordersPollingTimer;
    private readonly DispatcherTimer _healthCheckTimer;
    private readonly HashSet<string> _announcedOrderIds = new(); // Tương đương _announcedIds Set

    public ShellViewModel(
        INavigationService navigation,
        ISecureConfigService config,
        CloudApiClient cloudApi,
        ITtsService tts,
        ActivationViewModel activationVm,
        LockViewModel lockVm)
    {
        _navigation = navigation;
        _config = config;
        _cloudApi = cloudApi;
        _tts = tts;

        // Khởi động ở màn hình phù hợp
        if (_config.IsDeviceActivated)
            CurrentViewModel = lockVm;
        else
            CurrentViewModel = activationVm;

        // Polling orders mỗi 5 giây
        _ordersPollingTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(5)
        };
        _ordersPollingTimer.Tick += async (_, _) => await RefreshOrdersAsync();
        _ordersPollingTimer.Start();

        // Health check mỗi 15 giây (nếu đã activate)
        _healthCheckTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(15)
        };
        _healthCheckTimer.Tick += async (_, _) => await HealthCheckAsync();

        if (_config.IsDeviceActivated)
            _healthCheckTimer.Start();

        // Load orders ngay khi khởi động
        _ = RefreshOrdersAsync();
    }

    // ============================================
    // COMMANDS
    // Tương đương các handler trong App.tsx
    // ============================================

    [RelayCommand]
    private async Task ConfirmScoreboardOrderAsync()
    {
        if (CurrentPendingScoreboardOrder is null) return;

        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            await _cloudApi.ConfirmScoreboardOrderAsync(CurrentPendingScoreboardOrder.Id, token);
            await RefreshOrdersAsync();
        }, "Lỗi xác nhận order");
    }

    [RelayCommand]
    private async Task RejectScoreboardOrderAsync()
    {
        if (CurrentPendingScoreboardOrder is null) return;

        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            await _cloudApi.DeleteOrderAsync(CurrentPendingScoreboardOrder.Id, token);
            await RefreshOrdersAsync();
        }, "Lỗi từ chối order");
    }

    // ============================================
    // BUSINESS LOGIC
    // ============================================

    /// <summary>
    /// Refresh danh sách đơn hàng từ backend.
    /// Tương đương refreshOrders() trong App.tsx với xử lý TTS.
    /// </summary>
    public async Task RefreshOrdersAsync()
    {
        try
        {
            var token = _config.GetAuthToken();
            if (string.IsNullOrEmpty(token)) return;

            var rawOrders = await _cloudApi.FetchOrdersAsync(token);

            // Update Orders collection on UI thread
            App.Current.Dispatcher.Invoke(() =>
            {
                Orders.Clear();
                foreach (var o in rawOrders)
                    Orders.Add(o);

                // Tìm Scoreboard pending orders
                var pendingScoreboard = Orders
                    .Where(o => o.OrderType == Core.Business.Models.Enums.OrderType.Scoreboard
                             && o.Status == Core.Business.Models.Enums.OrderStatus.PendingConfirm)
                    .ToList();

                CurrentPendingScoreboardOrder = pendingScoreboard.FirstOrDefault();
                PendingScoreboardCount = Math.Max(0, pendingScoreboard.Count - 1);
            });

            // TTS thông báo order mới từ Scoreboard
            await AnnouncePendingScoreboardOrdersAsync(rawOrders);
        }
        catch (Exception ex)
        {
            Serilog.Log.Warning(ex, "[Shell] Failed to refresh orders");
        }
    }

    private async Task AnnouncePendingScoreboardOrdersAsync(List<Order> orders)
    {
        var pending = orders.Where(o =>
            o.OrderType == Core.Business.Models.Enums.OrderType.Scoreboard &&
            o.Status == Core.Business.Models.Enums.OrderStatus.PendingConfirm
        );

        foreach (var order in pending)
        {
            var oid = order.LocalId ?? order.Id.ToString();
            if (_announcedOrderIds.Contains(oid)) continue;
            _announcedOrderIds.Add(oid);

            var tableName = order.TableName ?? $"Bàn {order.TableNumber}";
            var itemTexts = order.Items
                .Select(i => $"{i.Qty} {i.ProductName ?? "sản phẩm"}")
                .ToList();

            if (itemTexts.Count > 0)
            {
                var text = $"{string.Join(", ", itemTexts)} {tableName}";
                Serilog.Log.Information("[TTS] 🔊 \"{Text}\"", text);
                await _tts.SpeakAsync(text, repeat: 2);
            }
        }
    }

    private async Task HealthCheckAsync()
    {
        try
        {
            var deviceCode = _config.GetDeviceCode();
            if (!string.IsNullOrEmpty(deviceCode))
                await _cloudApi.CheckHealthAsync(deviceCode);
        }
        catch
        {
            // Nếu health check fail 401/403 → device bị deactivate
            // TODO: Navigate to ActivationView
        }
    }

    public void StopPolling()
    {
        _ordersPollingTimer.Stop();
        _healthCheckTimer.Stop();
    }
}
