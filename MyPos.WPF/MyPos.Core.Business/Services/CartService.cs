using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;

namespace MyPos.Core.Business.Services;

/// <summary>
/// Triển khai ICartService
/// Tương đương addToCart(), incrementQuantity(), decrementQuantity(),
/// removeCartLine() trong CashierScreen.tsx
/// </summary>
public class CartService : ICartService
{
    private readonly ITimeBasedPricingService _pricing;

    public CartService(ITimeBasedPricingService pricing)
    {
        _pricing = pricing;
    }

    public CartLine AddOrMerge(IList<CartLine> cart, Product product)
    {
        // Time-based products: always add new line (như bàn bi-a mới bắt đầu)
        if (product.IsTimeBased)
        {
            var newLine = new CartLine
            {
                Product = product,
                Qty = 1,
                IsTimeBased = true,
                StartTime = DateTime.Now
            };
            cart.Add(newLine);
            return newLine;
        }

        // Regular products: find existing line and merge
        var existing = cart.FirstOrDefault(l => l.Product.Id == product.Id && !l.IsTimeBased);
        if (existing is not null)
        {
            existing.Qty++;
            return existing;
        }

        // New line
        var line = new CartLine
        {
            Product = product,
            Qty = 1,
            IsTimeBased = false
        };
        cart.Add(line);
        return line;
    }

    public void IncrementQty(IList<CartLine> cart, string lineId)
    {
        var line = cart.FirstOrDefault(l => l.Id == lineId);
        if (line is not null) line.Qty++;
    }

    public void DecrementQty(IList<CartLine> cart, string lineId)
    {
        var line = cart.FirstOrDefault(l => l.Id == lineId);
        if (line is not null)
        {
            line.Qty = Math.Max(1, line.Qty - 1);
        }
    }

    public void RemoveLine(IList<CartLine> cart, string lineId)
    {
        var line = cart.FirstOrDefault(l => l.Id == lineId);
        if (line is not null) cart.Remove(line);
    }

    public void Reset(IList<CartLine> cart)
    {
        cart.Clear();
    }

    public decimal CalculateTotal(IList<CartLine> cart, DateTime now)
    {
        return cart.Sum(line =>
        {
            if (line.IsTimeBased)
            {
                return _pricing.Calculate(
                    line.Product,
                    line.StartTime ?? now,
                    line.EndTime,
                    now,
                    line.Qty
                );
            }
            return line.Product.Price * line.Qty;
        });
    }
}
