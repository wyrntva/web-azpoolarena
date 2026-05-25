using FluentAssertions;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;
using MyPos.Core.Business.Services;
using System.Collections.ObjectModel;
using Xunit;

namespace MyPos.Tests;

/// <summary>
/// Test CartService — logic thêm/sửa/xóa sản phẩm trong giỏ hàng.
/// Tương đương test cho addToCart(), incrementQuantity() trong CashierScreen.tsx
/// </summary>
public class CartServiceTests
{
    private readonly CartService _cartService;
    private readonly TimeBasedPricingService _pricing = new();

    public CartServiceTests()
    {
        _cartService = new CartService(_pricing);
    }

    private static Product MakeProduct(int id, string name = "Test", decimal price = 10_000m,
        ProductPricingType type = ProductPricingType.Fixed) =>
        new() { Id = id, Name = name, Price = price, PricingType = type };

    // ============================================
    // AddOrMerge Tests
    // ============================================

    [Fact]
    public void AddOrMerge_NewProduct_AddsNewLine()
    {
        var cart = new ObservableCollection<CartLine>();
        var product = MakeProduct(1, "Pepsi");

        _cartService.AddOrMerge(cart, product);

        cart.Should().HaveCount(1);
        cart[0].Product.Id.Should().Be(1);
        cart[0].Qty.Should().Be(1);
    }

    [Fact]
    public void AddOrMerge_SameProductTwice_MergesQty()
    {
        var cart = new ObservableCollection<CartLine>();
        var product = MakeProduct(1, "Pepsi");

        _cartService.AddOrMerge(cart, product);
        _cartService.AddOrMerge(cart, product);

        cart.Should().HaveCount(1);
        cart[0].Qty.Should().Be(2);
    }

    [Fact]
    public void AddOrMerge_DifferentProducts_AddsSeparateLines()
    {
        var cart = new ObservableCollection<CartLine>();
        _cartService.AddOrMerge(cart, MakeProduct(1, "Pepsi"));
        _cartService.AddOrMerge(cart, MakeProduct(2, "Coca Cola"));

        cart.Should().HaveCount(2);
    }

    [Fact]
    public void AddOrMerge_TimeBased_AlwaysNewLine()
    {
        var cart = new ObservableCollection<CartLine>();
        var table = MakeProduct(10, "Bàn bi-a", type: ProductPricingType.TimeBased);

        _cartService.AddOrMerge(cart, table);
        _cartService.AddOrMerge(cart, table); // Bàn thứ 2

        // Time-based không merge, mỗi lần là 1 phiên riêng
        cart.Should().HaveCount(2);
        cart.All(l => l.IsTimeBased).Should().BeTrue();
    }

    // ============================================
    // IncrementQty / DecrementQty Tests
    // ============================================

    [Fact]
    public void IncrementQty_ExistingLine_IncreasesQty()
    {
        var cart = new ObservableCollection<CartLine>();
        var line = _cartService.AddOrMerge(cart, MakeProduct(1));

        _cartService.IncrementQty(cart, line.Id);

        cart[0].Qty.Should().Be(2);
    }

    [Fact]
    public void DecrementQty_QtyIs2_DecreasesTo1()
    {
        var cart = new ObservableCollection<CartLine>();
        var line = _cartService.AddOrMerge(cart, MakeProduct(1));
        _cartService.IncrementQty(cart, line.Id); // qty = 2

        _cartService.DecrementQty(cart, line.Id); // qty = 1

        cart[0].Qty.Should().Be(1);
    }

    [Fact]
    public void DecrementQty_QtyIs1_StaysAt1_NotZero()
    {
        var cart = new ObservableCollection<CartLine>();
        var line = _cartService.AddOrMerge(cart, MakeProduct(1));
        // qty starts at 1

        _cartService.DecrementQty(cart, line.Id);

        cart[0].Qty.Should().Be(1); // Cannot go below 1
    }

    // ============================================
    // RemoveLine Tests
    // ============================================

    [Fact]
    public void RemoveLine_RemovesCorrectItem()
    {
        var cart = new ObservableCollection<CartLine>();
        var line1 = _cartService.AddOrMerge(cart, MakeProduct(1, "Pepsi"));
        var line2 = _cartService.AddOrMerge(cart, MakeProduct(2, "Coca"));

        _cartService.RemoveLine(cart, line1.Id);

        cart.Should().HaveCount(1);
        cart[0].Product.Id.Should().Be(2);
    }

    // ============================================
    // CalculateTotal Tests
    // ============================================

    [Fact]
    public void CalculateTotal_MultipleItems_SumsCorrectly()
    {
        var cart = new ObservableCollection<CartLine>();
        _cartService.AddOrMerge(cart, MakeProduct(1, price: 20_000m)); // 1 * 20k = 20k
        _cartService.AddOrMerge(cart, MakeProduct(2, price: 30_000m)); // 1 * 30k = 30k

        var total = _cartService.CalculateTotal(cart, DateTime.Now);

        total.Should().Be(50_000m);
    }

    [Fact]
    public void CalculateTotal_EmptyCart_ReturnsZero()
    {
        var cart = new ObservableCollection<CartLine>();
        var total = _cartService.CalculateTotal(cart, DateTime.Now);
        total.Should().Be(0m);
    }

    [Fact]
    public void Reset_ClearsCart()
    {
        var cart = new ObservableCollection<CartLine>();
        _cartService.AddOrMerge(cart, MakeProduct(1));
        _cartService.AddOrMerge(cart, MakeProduct(2));

        _cartService.Reset(cart);

        cart.Should().BeEmpty();
    }
}
