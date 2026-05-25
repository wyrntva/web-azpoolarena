namespace MyPos.Core.Business.Models.Enums;

/// <summary>
/// Tương đương PaymentMethod type trong types/index.ts
/// </summary>
public enum PaymentMethod
{
    Cash,       // 'cash'
    Bank,       // 'bank'
    Card,       // 'card'
    EWallet     // 'e-wallet'
}

/// <summary>
/// Tương đương OrderStatus type trong types/index.ts
/// </summary>
public enum OrderStatus
{
    PendingPayment,  // 'pending-payment'
    PendingConfirm,  // 'pending-confirm' (từ Scoreboard)
    Confirmed,       // 'confirmed'
    Preparing,       // 'preparing'
    Ready,           // 'ready'
    Completed,       // 'completed'
    Cancelled,       // 'cancelled'
    DineIn,          // 'dine-in' (đang ăn tại bàn)
    Takeaway,        // 'takeaway'
    Delivery         // 'delivery'
}

/// <summary>
/// Loại đơn hàng
/// </summary>
public enum OrderType
{
    DineIn,      // Tại bàn
    Takeaway,    // Mang về
    Scoreboard,  // Từ bàn bi-a (Scoreboard tablet)
    Delivery
}

/// <summary>
/// Tương đương TableStatus trong types/index.ts
/// </summary>
public enum TableStatus
{
    Empty,      // 'empty'
    Occupied,   // 'occupied'
    Reserved,   // 'reserved'
    Cleaning    // 'cleaning'
}

/// <summary>
/// Loại tính giá sản phẩm
/// </summary>
public enum ProductPricingType
{
    Fixed,      // Giá cố định
    TimeBased   // Tính theo giờ (bàn bi-a)
}

/// <summary>
/// Trạng thái PendingQueue (offline sync)
/// </summary>
public enum PendingStatus
{
    Pending,  // Chờ gửi
    Sent,     // Đã gửi thành công
    Error     // Gửi lỗi
}

/// <summary>
/// Vai trò người dùng
/// </summary>
public enum UserRole
{
    Admin,
    Manager,
    Cashier,
    Staff
}
