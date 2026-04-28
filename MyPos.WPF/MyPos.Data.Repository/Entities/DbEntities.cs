using MyPos.Core.Business.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyPos.Data.Repository.Entities;

/// <summary>
/// DB Entity cho Order — map sang bảng "Orders" trong SQLite
/// </summary>
[Table("Orders")]
public class OrderEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// ID tạm thời từ frontend (Guid). Dùng để link với PendingQueue
    /// </summary>
    public string? LocalId { get; set; }

    /// <summary>
    /// ID trả về từ Cloud backend sau khi sync thành công
    /// </summary>
    public int? ServerId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;
    public int? TableId { get; set; }
    public string? TableName { get; set; }
    public int? TableNumber { get; set; }
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public string OrderType { get; set; } = "dine-in";
    public string Status { get; set; } = "dine-in";
    public int CustomerCount { get; set; } = 1;
    public string? PaymentInfoDisplay { get; set; }
    public string? Note { get; set; }
    public decimal? Discount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Đã sync lên cloud chưa
    /// </summary>
    public bool IsSynced { get; set; } = false;

    [InverseProperty("Order")]
    public List<OrderItemEntity> Items { get; set; } = new();
}

/// <summary>
/// DB Entity cho OrderItem
/// </summary>
[Table("OrderItems")]
public class OrderItemEntity
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Order")]
    public int OrderId { get; set; }
    public OrderEntity? Order { get; set; }

    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Qty { get; set; }
    public decimal Price { get; set; }
    public bool IsTimeBased { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// DB Entity cho Product cache (sync từ cloud)
/// </summary>
[Table("Products")]
public class ProductEntity
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Barcode { get; set; }
    public string? Code { get; set; }
    public string? Category { get; set; }
    public int? CategoryId { get; set; }
    public string? Image { get; set; }
    public string? Unit { get; set; }
    public bool InStock { get; set; } = true;
    public string PricingType { get; set; } = "Fixed";
    public decimal? HourlyPrice { get; set; }
    public int? TimeIntervalValue { get; set; }
    public string? TimeIntervalUnit { get; set; }
    public DateTime LastSyncAt { get; set; } = DateTime.Now;
}

/// <summary>
/// Offline queue — tương đương pendingQueue trong LocalStorage Electron
/// Lưu các đơn hàng chưa sync được lên cloud
/// </summary>
[Table("PendingQueue")]
public class PendingQueueEntity
{
    [Key]
    public string OrderIdLocal { get; set; } = Guid.NewGuid().ToString();
    public string PayloadJson { get; set; } = string.Empty;  // JSON serialize của CreateOrderPayload
    public string Status { get; set; } = "pending";          // pending | sent | error
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? LastAttemptAt { get; set; }
    public int RetryCount { get; set; } = 0;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Config thiết bị POS (thay thế localStorage)
/// </summary>
[Table("DeviceConfig")]
public class DeviceConfigEntity
{
    [Key]
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
