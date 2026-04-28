using MyPos.Core.Business.Models.Enums;

namespace MyPos.Core.Business.Models;

/// <summary>
/// Tương đương interface Product trong types/index.ts
/// </summary>
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? PriceUnit { get; set; }
    public string? Barcode { get; set; }
    public string? Code { get; set; }
    public string? Category { get; set; }
    public int? CategoryId { get; set; }
    public string? Image { get; set; }
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public bool InStock { get; set; } = true;
    public string? Color { get; set; }

    // ---- Time-based pricing (bàn bi-a) ----
    public ProductPricingType PricingType { get; set; } = ProductPricingType.Fixed;
    public decimal? HourlyPrice { get; set; }        // hourlyPrice
    public int? TimeIntervalValue { get; set; }      // timeIntervalValue
    public string? TimeIntervalUnit { get; set; }    // timeIntervalUnit ("hour","minute")

    public bool IsTimeBased => PricingType == ProductPricingType.TimeBased;
}

/// <summary>
/// Một dòng trong giỏ hàng — tương đương CartLine trong components/cashier/types.ts
/// </summary>
public class CartLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public Product Product { get; set; } = null!;
    public int Qty { get; set; } = 1;
    public bool IsTimeBased { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// Danh mục menu — tương đương interface Menu trong services/api.ts
/// </summary>
public class Menu
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string? Image { get; set; }
    public List<int> ProductIds { get; set; } = new();
    public DateTime? CreatedAt { get; set; }
}

/// <summary>
/// Khu vực (Area) — danh sách bàn theo khu
/// </summary>
public class Area
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TableCount { get; set; }
    public List<AreaTable> Tables { get; set; } = new();
}

public class AreaTable
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}

/// <summary>
/// Thông tin người dùng đăng nhập
/// </summary>
public class AppUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Cashier;
    public string? Pin { get; set; }
    public string? Email { get; set; }
}
