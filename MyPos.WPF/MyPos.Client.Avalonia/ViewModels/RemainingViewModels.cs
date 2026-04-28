using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Models;
using MyPos.SyncService.Clients;
using System.Collections.ObjectModel;
using System.Text.Json;

namespace MyPos.Client.Avalonia.ViewModels;

// ============================================
// LOCK SCREEN (PIN login)
// ============================================
public partial class LockViewModel : BaseViewModel
{
    private readonly CloudApiClient _cloudApi;
    private readonly ISecureConfigService _config;
    private readonly INavigationService _navigation;
    private readonly DispatcherTimer _clock;

    private string _pin = string.Empty;

    [ObservableProperty] private string _pinDisplay = "";
    [ObservableProperty] private bool _canLogin;
    [ObservableProperty] private string _timeText = "";
    [ObservableProperty] private string _dateText = "";

    public LockViewModel(CloudApiClient cloudApi, ISecureConfigService config, INavigationService navigation)
    {
        _cloudApi = cloudApi;
        _config = config;
        _navigation = navigation;

        _clock = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _clock.Tick += (_, _) => UpdateClock();
        _clock.Start();
        UpdateClock();
    }

    private void UpdateClock()
    {
        var now = DateTime.Now;
        var hh = now.Hour.ToString("D2");
        var mm = now.Minute.ToString("D2");
        TimeText = $"{hh}:{mm}";
        DateText = now.ToString("dddd, dd MMMM yyyy", new System.Globalization.CultureInfo("vi-VN"));
    }

    [RelayCommand]
    private void AppendDigit(string digit)
    {
        if (_pin.Length >= 6) return;
        _pin += digit;
        RefreshDisplay();
    }

    [RelayCommand]
    private void DeleteDigit()
    {
        if (_pin.Length > 0) { _pin = _pin[..^1]; RefreshDisplay(); }
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        await RunSafeAsync(async () =>
        {
            var response = await _cloudApi.PosLoginAsync(_pin);
            _config.SaveAuthToken(response.AccessToken);
            if (response.User is not null)
                _config.SaveUserInfo(JsonSerializer.Serialize(response.User));
            _pin = string.Empty;
            RefreshDisplay();
            _navigation.NavigateTo<HomeViewModel>();
        }, "Đăng nhập thất bại");
    }

    private void RefreshDisplay()
    {
        PinDisplay = new string('●', _pin.Length);
        CanLogin = _pin.Length >= 4;
    }
}

// ============================================
// ACTIVATION SCREEN (device code)
// ============================================
public partial class ActivationViewModel : BaseViewModel
{
    private readonly CloudApiClient _cloudApi;
    private readonly ISecureConfigService _config;
    private readonly INavigationService _navigation;

    [ObservableProperty] private string _deviceCode = string.Empty;

    public ActivationViewModel(CloudApiClient cloudApi, ISecureConfigService config, INavigationService navigation)
    {
        _cloudApi = cloudApi;
        _config = config;
        _navigation = navigation;
    }

    [RelayCommand]
    private async Task ActivateAsync()
    {
        if (string.IsNullOrWhiteSpace(DeviceCode))
        { SetError("Vui lòng nhập mã kích hoạt"); return; }

        await RunSafeAsync(async () =>
        {
            var resp = await _cloudApi.ActivateDeviceAsync(DeviceCode.Trim());
            if (!resp.Success) throw new Exception(resp.Message ?? "Kích hoạt thất bại");
            _config.SaveDeviceCode(DeviceCode.Trim());
            _config.SaveDeviceName(resp.DeviceName ?? "POS");
            _config.SetDeviceActivated(true);
            _navigation.NavigateTo<LockViewModel>();
        }, "Lỗi kích hoạt");
    }
}

// ============================================
// HOME SCREEN
// ============================================
public partial class HomeViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;
    private readonly ISecureConfigService _config;
    private readonly CloudApiClient _cloudApi;

    [ObservableProperty] private ObservableCollection<Order> _orders = new();
    [ObservableProperty] private string _filterStatus = "all";

    public IEnumerable<Order> FilteredOrders => FilterStatus == "all"
        ? Orders
        : Orders.Where(o => o.Status.ToString().ToLower() == FilterStatus.ToLower());

    public bool HasOrders => Orders.Count > 0;
    public bool HasNoOrders => Orders.Count == 0;

    public HomeViewModel(INavigationService navigation, ISecureConfigService config, CloudApiClient cloudApi)
    {
        _navigation = navigation;
        _config = config;
        _cloudApi = cloudApi;

        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName == nameof(FilterStatus))
                OnPropertyChanged(nameof(FilteredOrders));
        };

        Orders.CollectionChanged += (_, _) =>
        {
            OnPropertyChanged(nameof(FilteredOrders));
            OnPropertyChanged(nameof(HasOrders));
            OnPropertyChanged(nameof(HasNoOrders));
        };
    }

    public override async Task OnActivatedAsync(object? parameter = null)
    {
        await RefreshAsync();
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? "";
            var data = await _cloudApi.FetchOrdersAsync(token);
            await InvokeOnUiThread(() =>
            {
                Orders.Clear();
                foreach (var o in data) Orders.Add(o);
            });
        });
    }

    [RelayCommand]
    private void OpenCashier(Order? order = null)
    {
        _navigation.NavigateTo<CashierViewModel>(order!);
    }

    [RelayCommand]
    private void NewOrder()
    {
        _navigation.NavigateTo<CashierViewModel>();
    }

    [RelayCommand]
    private void SetFilter(string status) => FilterStatus = status;
}

// ============================================
// STUB ViewModels
// ============================================
public partial class TableLayoutViewModel : BaseViewModel { }
public partial class DashboardViewModel : BaseViewModel { }
public partial class AttendanceViewModel : BaseViewModel { }
