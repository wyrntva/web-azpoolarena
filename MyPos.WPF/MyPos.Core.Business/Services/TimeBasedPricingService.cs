using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Models;

namespace MyPos.Core.Business.Services;

/// <summary>
/// Tính tiền theo thời gian cho bàn bi-a.
/// Tương đương calculateTimeBasedPrice() + buildTimePriceInput() trong utils/timePrice.ts
/// </summary>
public class TimeBasedPricingService : ITimeBasedPricingService
{
    /// <summary>
    /// Tính giá cho 1 dòng time-based tại thời điểm now.
    /// Logic: 
    ///   - Nếu có EndTime → tính theo EndTime (chốt giá)
    ///   - Nếu không có → tính realtime đến now
    ///   - Chia theo timeIntervalValue/Unit (default: 1 giờ)
    /// </summary>
    public decimal Calculate(Product product, DateTime startTime, DateTime? endTime, DateTime now, int qty)
    {
        if (product.HourlyPrice is null or <= 0)
            return product.Price * qty;

        var effectiveEnd = endTime ?? now;
        var elapsed = effectiveEnd - startTime;
        if (elapsed < TimeSpan.Zero) elapsed = TimeSpan.Zero;

        // Tính số interval đã qua (làm tròn lên)
        var intervalMinutes = GetIntervalMinutes(product);
        var totalMinutes = elapsed.TotalMinutes;
        var intervals = Math.Ceiling(totalMinutes / intervalMinutes);

        // Giá mỗi interval = hourlyPrice * intervalMinutes / 60
        var pricePerInterval = product.HourlyPrice.Value * (decimal)intervalMinutes / 60m;
        var totalPrice = pricePerInterval * (decimal)intervals * qty;

        return Math.Floor(totalPrice); // Làm tròn xuống (VND không có xu)
    }

    /// <summary>
    /// Format elapsed time: "1:23:45" (HH:MM:SS)
    /// </summary>
    public string FormatElapsed(DateTime startTime, DateTime now)
    {
        var elapsed = now - startTime;
        if (elapsed < TimeSpan.Zero) return "00:00:00";

        var totalSeconds = (long)elapsed.TotalSeconds;
        var h = totalSeconds / 3600;
        var m = (totalSeconds % 3600) / 60;
        var s = totalSeconds % 60;
        return $"{h:D2}:{m:D2}:{s:D2}";
    }

    /// <summary>
    /// Format như "2 giờ 30 phút"
    /// </summary>
    public string FormatDuration(TimeSpan duration)
    {
        var parts = new List<string>();
        if (duration.Hours > 0) parts.Add($"{duration.Hours} giờ");
        if (duration.Minutes > 0) parts.Add($"{duration.Minutes} phút");
        if (parts.Count == 0) parts.Add("< 1 phút");
        return string.Join(" ", parts);
    }

    private static double GetIntervalMinutes(Product product)
    {
        // Default: 60 phút (1 giờ)
        if (product.TimeIntervalValue is null or <= 0)
            return 60.0;

        return product.TimeIntervalUnit?.ToLower() switch
        {
            "minute" or "phút" => product.TimeIntervalValue.Value,
            "hour" or "giờ" => product.TimeIntervalValue.Value * 60.0,
            _ => 60.0
        };
    }
}
