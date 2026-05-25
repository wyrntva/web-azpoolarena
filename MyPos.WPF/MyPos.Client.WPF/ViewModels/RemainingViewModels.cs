using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MyPos.Core.Business.Interfaces;
using MyPos.SyncService.Clients;
using System.Text.Json;

namespace MyPos.Client.WPF.ViewModels;

/// <summary>
/// ViewModel màn hình đăng nhập PIN.
/// Tương đương LockScreen.tsx
/// </summary>
public partial class LockViewModel : BaseViewModel
{
    private readonly CloudApiClient _cloudApi;
    private readonly ISecureConfigService _config;
    private readonly INavigationService _navigation;

    private string _pin = string.Empty;

    [ObservableProperty] private string _pinDisplay = "_ _ _ _";
    [ObservableProperty] private bool _canLogin;

    public LockViewModel(CloudApiClient cloudApi, ISecureConfigService config, INavigationService navigation)
    {
        _cloudApi = cloudApi;
        _config = config;
        _navigation = navigation;
    }

    [RelayCommand]
    private void AppendDigit(string digit)
    {
        if (_pin.Length >= 6) return;
        _pin += digit;
        UpdatePinDisplay();
    }

    [RelayCommand]
    private void DeleteDigit()
    {
        if (_pin.Length > 0)
        {
            _pin = _pin[..^1];
            UpdatePinDisplay();
        }
    }

    [RelayCommand(CanExecute = nameof(CanLogin))]
    private async Task LoginAsync()
    {
        await RunSafeAsync(async () =>
        {
            var response = await _cloudApi.PosLoginAsync(_pin);
            _config.SaveAuthToken(response.AccessToken);

            if (response.User is not null)
                _config.SaveUserInfo(JsonSerializer.Serialize(response.User));

            _pin = string.Empty;
            UpdatePinDisplay();
            _navigation.NavigateTo<HomeViewModel>();
        }, "Đăng nhập thất bại");
    }

    private void UpdatePinDisplay()
    {
        PinDisplay = _pin.Length == 0
            ? "_ _ _ _"
            : new string('●', _pin.Length);
        CanLogin = _pin.Length >= 4;
    }
}

/// <summary>
/// ViewModel màn hình kích hoạt thiết bị.
/// Tương đương ActivationScreen.tsx
/// </summary>
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
        {
            SetError("Vui lòng nhập mã kích hoạt thiết bị");
            return;
        }

        await RunSafeAsync(async () =>
        {
            var response = await _cloudApi.ActivateDeviceAsync(DeviceCode.Trim());
            if (!response.Success)
                throw new Exception(response.Message ?? "Kích hoạt thất bại");

            _config.SaveDeviceCode(DeviceCode.Trim());
            _config.SaveDeviceName(response.DeviceName ?? "POS");
            _config.SetDeviceActivated(true);

            _navigation.NavigateTo<LockViewModel>();
        }, "Lỗi kích hoạt");
    }
}

/// <summary>
/// Stub ViewModels for views not yet fully implemented
/// </summary>
public partial class HomeViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;
    private readonly ISecureConfigService _config;
    private readonly CloudApiClient _cloudApi;

    [ObservableProperty]
    private System.Collections.ObjectModel.ObservableCollection<MyPos.Core.Business.Models.Order> _orders = new();

    public HomeViewModel(INavigationService navigation, ISecureConfigService config, CloudApiClient cloudApi)
    {
        _navigation = navigation;
        _config = config;
        _cloudApi = cloudApi;
    }

    public override async Task OnActivatedAsync(object? parameter = null)
    {
        await LoadOrdersAsync();
    }

    [RelayCommand]
    private async Task LoadOrdersAsync()
    {
        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? "";
            var data = await _cloudApi.FetchOrdersAsync(token);
            Orders.Clear();
            foreach (var o in data) Orders.Add(o);
        });
    }

    [RelayCommand]
    private void OpenCashier(MyPos.Core.Business.Models.Order? order = null)
    {
        _navigation.NavigateTo<CashierViewModel>(order!);
    }
}

public partial class TableLayoutViewModel : BaseViewModel { }
public partial class DashboardViewModel : BaseViewModel { }
public partial class AttendanceViewModel : BaseViewModel { }
