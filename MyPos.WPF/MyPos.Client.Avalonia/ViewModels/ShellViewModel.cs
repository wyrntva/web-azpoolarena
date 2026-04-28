using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MyPos.Client.Avalonia.Services;
using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;
using MyPos.SyncService.Clients;
using System.Collections.ObjectModel;

namespace MyPos.Client.Avalonia.ViewModels;

/// <summary>
/// ShellViewModel — quản lý navigation + orders polling + TTS.
/// Tương đương App.tsx.
///
/// Key thay đổi từ WPF:
///   App.Current.Dispatcher.Invoke() → Dispatcher.UIThread.InvokeAsync()
///   DispatcherTimer namespace: Avalonia.Threading
/// </summary>
public partial class ShellViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;
    private readonly ISecureConfigService _config;
    private readonly CloudApiClient _cloudApi;
    private readonly ITtsService _tts;
    private readonly IServiceProvider _services;

    // ---- Observable State ----
    [ObservableProperty] private BaseViewModel? _currentViewModel;
    [ObservableProperty] private ObservableCollection<Order> _orders = new();
    [ObservableProperty] private Order? _currentPendingScoreboardOrder;
    [ObservableProperty] private int _pendingScoreboardCount;
    [ObservableProperty] private bool _showScoreboardModal;

    // ---- Timers (Avalonia.Threading.DispatcherTimer — giống hệt WPF API) ----
    private readonly DispatcherTimer _ordersTimer;
    private readonly DispatcherTimer _healthTimer;
    private readonly HashSet<string> _announcedOrderIds = new();

    public ShellViewModel(
        INavigationService navigation,
        ISecureConfigService config,
        CloudApiClient cloudApi,
        ITtsService tts,
        IServiceProvider services)
    {
        _navigation = navigation;
        _config = config;
        _cloudApi = cloudApi;
        _tts = tts;
        _services = services;

        // Init navigation service với reference tới self
        if (navigation is NavigationService nav)
            nav.Initialize(this);

        // Màn hình khởi động
        NavigateToStartScreen();

        // Orders polling mỗi 5 giây (tương đương setInterval 5000ms trong Electron)
        _ordersTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(5) };
        _ordersTimer.Tick += async (_, _) => await RefreshOrdersAsync();
        _ordersTimer.Start();

        // Health check mỗi 15 giây
        _healthTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(15) };
        _healthTimer.Tick += async (_, _) => await HealthCheckAsync();
        if (_config.IsDeviceActivated) _healthTimer.Start();

        // Load orders ngay khi start
        _ = RefreshOrdersAsync();
    }

    private void NavigateToStartScreen()
    {
        if (_config.IsDeviceActivated)
            _navigation.NavigateTo<LockViewModel>();
        else
            _navigation.NavigateTo<ActivationViewModel>();
    }

    // ---- Commands ----

    [RelayCommand]
    private async Task ConfirmScoreboardOrderAsync()
    {
        if (CurrentPendingScoreboardOrder is null) return;
        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            await _cloudApi.ConfirmScoreboardOrderAsync(CurrentPendingScoreboardOrder.Id, token);
            ShowScoreboardModal = false;
            await RefreshOrdersAsync();
        });
    }

    [RelayCommand]
    private async Task RejectScoreboardOrderAsync()
    {
        if (CurrentPendingScoreboardOrder is null) return;
        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            await _cloudApi.DeleteOrderAsync(CurrentPendingScoreboardOrder.Id, token);
            ShowScoreboardModal = false;
            await RefreshOrdersAsync();
        });
    }

    // ---- Business Logic ----

    public async Task RefreshOrdersAsync()
    {
        try
        {
            var token = _config.GetAuthToken();
            if (string.IsNullOrEmpty(token)) return;

            var rawOrders = await _cloudApi.FetchOrdersAsync(token);

            // Cập nhật UI phải chạy trên UI Thread (Avalonia)
            await Dispatcher.UIThread.InvokeAsync(() =>
            {
                Orders.Clear();
                foreach (var o in rawOrders) Orders.Add(o);

                var pending = Orders
                    .Where(o => o.OrderType == OrderType.Scoreboard
                             && o.Status == OrderStatus.PendingConfirm)
                    .ToList();

                CurrentPendingScoreboardOrder = pending.FirstOrDefault();
                PendingScoreboardCount = Math.Max(0, pending.Count - 1);
                ShowScoreboardModal = CurrentPendingScoreboardOrder is not null;
            });

            await AnnouncePendingOrdersAsync(rawOrders);
        }
        catch (Exception ex)
        {
            Serilog.Log.Warning(ex, "[Shell] Failed to refresh orders");
        }
    }

    private async Task AnnouncePendingOrdersAsync(List<Order> orders)
    {
        var pending = orders.Where(o =>
            o.OrderType == OrderType.Scoreboard &&
            o.Status == OrderStatus.PendingConfirm);

        foreach (var order in pending)
        {
            var oid = order.LocalId ?? order.Id.ToString();
            if (!_announcedOrderIds.Add(oid)) continue;

            var tableName = order.TableName ?? $"Bàn {order.TableNumber}";
            var itemTexts = order.Items.Select(i => $"{i.Qty} {i.ProductName ?? "sản phẩm"}").ToList();

            if (itemTexts.Count > 0)
            {
                var text = $"{string.Join(", ", itemTexts)} {tableName}";
                Serilog.Log.Information("[TTS] 🔊 \"{Text}\"", text);
                _ = _tts.SpeakAsync(text, repeat: 2);
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
        catch { /* Device deactivated — TODO Navigate to Activation */ }
    }

    public void StopAll()
    {
        _ordersTimer.Stop();
        _healthTimer.Stop();
    }
}
