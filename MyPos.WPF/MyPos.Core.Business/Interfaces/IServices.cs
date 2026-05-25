using MyPos.Core.Business.Models;

namespace MyPos.Core.Business.Interfaces;

/// <summary>
/// Quản lý giỏ hàng — tương đương các hàm addToCart, incrementQuantity,
/// decrementQuantity, removeCartLine trong CashierScreen.tsx
/// </summary>
public interface ICartService
{
    /// <summary>
    /// Thêm sản phẩm vào giỏ. Nếu là sản phẩm thông thường đã có → tăng qty.
    /// Nếu là time-based → luôn thêm dòng mới.
    /// </summary>
    CartLine AddOrMerge(IList<CartLine> cart, Product product);

    void IncrementQty(IList<CartLine> cart, string lineId);
    void DecrementQty(IList<CartLine> cart, string lineId); // min = 1
    void RemoveLine(IList<CartLine> cart, string lineId);
    void Reset(IList<CartLine> cart);

    /// <summary>
    /// Tính tổng tiền toàn bộ giỏ hàng (bao gồm time-based realtime)
    /// </summary>
    decimal CalculateTotal(IList<CartLine> cart, DateTime now);
}

/// <summary>
/// Tính tiền theo thời gian — tương đương utils/timePrice.ts
/// </summary>
public interface ITimeBasedPricingService
{
    /// <summary>
    /// Tính tiền cho 1 CartLine time-based tại thời điểm now
    /// </summary>
    decimal Calculate(Product product, DateTime startTime, DateTime? endTime, DateTime now, int qty);

    /// <summary>
    /// Format elapsed time: "HH:MM:SS"
    /// </summary>
    string FormatElapsed(DateTime startTime, DateTime now);

    /// <summary>
    /// Format elapsed time as duration string: "2 giờ 30 phút"
    /// </summary>
    string FormatDuration(TimeSpan duration);
}

/// <summary>
/// Xử lý navigation giữa các Views — thay cho useState<Screen> trong App.tsx
/// </summary>
public interface INavigationService
{
    void NavigateTo<TViewModel>() where TViewModel : class;
    void NavigateTo<TViewModel>(object parameter) where TViewModel : class;
    void GoBack();
    string CurrentView { get; }
}

/// <summary>
/// Lưu trữ config bảo mật — thay cho localStorage trong Electron
/// </summary>
public interface ISecureConfigService
{
    void SaveAuthToken(string token);
    string? GetAuthToken();
    void ClearAuthToken();

    void SaveDeviceCode(string code);
    string? GetDeviceCode();

    void SaveDeviceName(string name);
    string? GetDeviceName();

    bool IsDeviceActivated { get; }
    void SetDeviceActivated(bool activated);

    void SaveUserInfo(string userJson);
    string? GetUserJson();
    void ClearAll();
}

/// <summary>
/// Text-to-Speech service — tương đương ttsGenerateAndPlay() trong electron/main/index.ts
/// </summary>
public interface ITtsService
{
    Task SpeakAsync(string text, int repeat = 1, CancellationToken ct = default);
    bool IsEnabled { get; set; }
}

/// <summary>
/// Quản lý thiết bị POS (Activation, Health check)
/// Tương đương activateDevice(), checkDeviceHealth() trong services/api.ts
/// </summary>
public interface IDeviceService
{
    Task<bool> ActivateAsync(string deviceCode);
    Task<bool> CheckHealthAsync();
    string? DeviceId { get; }
    string? DeviceName { get; }
}
