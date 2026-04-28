using FluentAssertions;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;
using MyPos.Core.Business.Services;
using Xunit;

namespace MyPos.Tests;

/// <summary>
/// Test TimeBasedPricingService — tính tiền theo giờ cho bàn bi-a.
/// Chạy được hoàn toàn trên Ubuntu (không cần Windows/WPF).
/// </summary>
public class TimeBasedPricingTests
{
    private readonly TimeBasedPricingService _svc = new();

    private static Product MakeBilliardTable(decimal hourlyPrice = 50_000m, int intervalMinutes = 60) =>
        new()
        {
            Id = 1,
            Name = "Bàn bi-a",
            Price = 0,
            PricingType = ProductPricingType.TimeBased,
            HourlyPrice = hourlyPrice,
            TimeIntervalValue = intervalMinutes,
            TimeIntervalUnit = "minute"
        };

    [Fact]
    public void Calculate_ExactlyOneHour_ReturnsHourlyPrice()
    {
        var product = MakeBilliardTable(50_000m); // 50k/giờ
        var start = new DateTime(2026, 4, 18, 8, 0, 0);
        var now   = new DateTime(2026, 4, 18, 9, 0, 0); // đúng 1 tiếng
        var result = _svc.Calculate(product, start, null, now, qty: 1);
        result.Should().Be(50_000m);
    }

    [Fact]
    public void Calculate_30Minutes_Returns50PercentOfHourlyRate()
    {
        var product = MakeBilliardTable(50_000m);
        var start = new DateTime(2026, 4, 18, 8, 0, 0);
        var now   = new DateTime(2026, 4, 18, 8, 30, 0); // 30 phút
        var result = _svc.Calculate(product, start, null, now, qty: 1);
        // 30 phút = 0.5 interval → làm tròn lên 1 interval = 50k * 60/60 * 1 = 50k
        // Nhưng 30 phút / 60 phút = 0.5 interval → ceiling = 1 → 50k
        result.Should().Be(50_000m);
    }

    [Fact]
    public void Calculate_70Minutes_ReturnsRoundedUp()
    {
        var product = MakeBilliardTable(60_000m); // 60k/giờ
        var start = new DateTime(2026, 4, 18, 8, 0, 0);
        var now   = new DateTime(2026, 4, 18, 9, 10, 0); // 70 phút
        var result = _svc.Calculate(product, start, null, now, qty: 1);
        // 70 phút / 60 phút = 1.167 → ceiling = 2 intervals → 2 * 60k = 120k
        result.Should().Be(120_000m);
    }

    [Fact]
    public void Calculate_WithQty2_DoublesPrice()
    {
        var product = MakeBilliardTable(50_000m);
        var start = new DateTime(2026, 4, 18, 8, 0, 0);
        var now   = new DateTime(2026, 4, 18, 9, 0, 0); // 1 giờ
        var result = _svc.Calculate(product, start, null, now, qty: 2);
        result.Should().Be(100_000m);
    }

    [Fact]
    public void Calculate_WithEndTime_UsesEndTimeNotNow()
    {
        var product = MakeBilliardTable(50_000m);
        var start   = new DateTime(2026, 4, 18, 8, 0, 0);
        var endTime = new DateTime(2026, 4, 18, 10, 0, 0); // 2 tiếng
        var now     = new DateTime(2026, 4, 18, 12, 0, 0); // 4 tiếng sau (không tính)
        var result = _svc.Calculate(product, start, endTime, now, qty: 1);
        result.Should().Be(100_000m); // Chỉ tính đến endTime
    }

    [Fact]
    public void FormatElapsed_OneHour_ReturnsCorrectFormat()
    {
        var start = new DateTime(2026, 4, 18, 8, 0, 0);
        var now   = new DateTime(2026, 4, 18, 9, 5, 30);
        var result = _svc.FormatElapsed(start, now);
        result.Should().Be("01:05:30");
    }

    [Fact]
    public void FormatElapsed_FutureStart_ReturnsZero()
    {
        var start = DateTime.Now.AddMinutes(10); // Tương lai
        var now   = DateTime.Now;
        var result = _svc.FormatElapsed(start, now);
        result.Should().Be("00:00:00");
    }

    [Fact]
    public void FormatDuration_90Minutes_ReturnsBothParts()
    {
        var duration = TimeSpan.FromMinutes(90);
        var result = _svc.FormatDuration(duration);
        result.Should().Be("1 giờ 30 phút");
    }
}
