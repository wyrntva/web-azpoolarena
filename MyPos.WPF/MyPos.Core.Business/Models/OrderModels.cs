using MyPos.Core.Business.Models.Enums;

namespace MyPos.Core.Business.Models;

/// <summary>
/// Item trong đơn hàng — tương đương OrderItem / PosOrderItem trong api.ts
/// </summary>
public class OrderItem
{
    public int? Id { get; set; }
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Qty { get; set; }
    public decimal Price { get; set; }
    public bool IsTimeBased { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Note { get; set; }
    public Product? Product { get; set; }
}

/// <summary>
/// Thông tin thanh toán — tương đương PaymentPayload trong types/index.ts
/// </summary>
public class PaymentInfo
{
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public decimal Paid { get; set; }
    public decimal Change => Math.Max(0, Paid - Total);
    public decimal Total { get; set; }
}

/// <summary>
/// Đơn hàng chính — tương đương PosOrder trong services/api.ts
/// </summary>
public class Order
{
    public int Id { get; set; }
    public string? LocalId { get; set; }           // Frontend temp ID: "order-{timestamp}"
    public string OrderNumber { get; set; } = string.Empty;
    public int? TableId { get; set; }
    public string? TableName { get; set; }
    public int? TableNumber { get; set; }
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public OrderType OrderType { get; set; } = OrderType.DineIn;
    public OrderStatus Status { get; set; } = OrderStatus.DineIn;
    public int CustomerCount { get; set; } = 1;
    public string? PaymentInfoDisplay { get; set; }  // "T.tiền theo giờ" or amount string
    public string? Note { get; set; }
    public decimal? Discount { get; set; }
    public decimal TotalAmount { get; set; }

    public List<OrderItem> Items { get; set; } = new();
    public PaymentInfo? Payment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
    public DateTime? CompletedAt { get; set; }

    // Helper properties
    public bool IsScoreboard => OrderType == OrderType.Scoreboard;
    public bool IsPendingConfirm => Status == OrderStatus.PendingConfirm;
    public bool HasTimeBasedItems => Items.Any(i => i.IsTimeBased);

    /// <summary>
    /// Thời gian đã trôi qua kể từ khi tạo đơn (dùng cho OrderCard countdown)
    /// </summary>
    public TimeSpan ElapsedTime => DateTime.Now - CreatedAt;
}

/// <summary>
/// Payload tạo đơn gửi lên backend — tương đương PosOrderCreatePayload
/// </summary>
public class CreateOrderPayload
{
    public string? FrontendId { get; set; }
    public int? TableId { get; set; }
    public int? AreaId { get; set; }
    public string? TableName { get; set; }
    public int? TableNumber { get; set; }
    public string? OrderType { get; set; }        // "dine-in" | "takeaway" | "scoreboard"
    public string? PaymentInfo { get; set; }
    public int CustomerCount { get; set; } = 1;
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public List<CreateOrderItemPayload> Items { get; set; } = new();
}

public class CreateOrderItemPayload
{
    public int ProductId { get; set; }
    public int Qty { get; set; }
    public decimal Price { get; set; }
    public bool IsTimeBased { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// Pending order dùng cho offline queue — tương đương PendingOrder trong types/index.ts
/// </summary>
public class PendingOrder
{
    public string OrderIdLocal { get; set; } = Guid.NewGuid().ToString();
    public CreateOrderPayload Payload { get; set; } = null!;
    public PendingStatus Status { get; set; } = PendingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public string? Error { get; set; }
    public int RetryCount { get; set; } = 0;
}
