using Microsoft.Extensions.Hosting;
using MyPos.Core.Business.Interfaces;
using MyPos.Data.Repository.Repositories;
using MyPos.SyncService.Clients;
using Serilog;
using System.Net.NetworkInformation;

namespace MyPos.SyncService.Workers;

/// <summary>
/// Background service chạy ngầm, sync pending orders lên cloud.
/// Tương đương hook usePendingSync() trong Electron (src/hooks/usePendingSync.ts).
/// 
/// Khác biệt: BackgroundService của .NET chạy độc lập, không phụ thuộc vào UI React.
/// Interval 5 giây giống Electron setInterval 5000ms.
/// </summary>
public class OrderSyncBackgroundService : BackgroundService
{
    private readonly PendingQueueRepository _queue;
    private readonly CloudApiClient _cloudApi;
    private readonly ISecureConfigService _config;
    private static readonly TimeSpan SyncInterval = TimeSpan.FromSeconds(5);

    public OrderSyncBackgroundService(
        PendingQueueRepository queue,
        CloudApiClient cloudApi,
        ISecureConfigService config)
    {
        _queue = queue;
        _cloudApi = cloudApi;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Log.Information("[SyncService] ▶ OrderSyncBackgroundService started (interval: 5s)");

        // Reset previous error orders for retry on startup
        await _queue.ResetErrorsForRetryAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(SyncInterval, stoppingToken);
                await SyncPendingOrdersAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Normal shutdown — không log lỗi
                break;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SyncService] Unexpected error in sync loop");
            }
        }

        Log.Information("[SyncService] ⏹ OrderSyncBackgroundService stopped");
    }

    private async Task SyncPendingOrdersAsync(CancellationToken ct)
    {
        // Kiểm tra mạng (tương đương navigator.onLine trong Electron)
        if (!IsNetworkAvailable())
        {
            Log.Debug("[SyncService] No network — skipping sync");
            return;
        }

        var token = _config.GetAuthToken();
        if (string.IsNullOrEmpty(token))
        {
            Log.Debug("[SyncService] No auth token — skipping sync");
            return;
        }

        var pendingList = await _queue.GetAllPendingAsync();
        if (pendingList.Count == 0) return;

        Log.Information("[SyncService] 🔄 Syncing {Count} pending orders...", pendingList.Count);

        foreach (var order in pendingList)
        {
            if (ct.IsCancellationRequested) break;
            try
            {
                await _cloudApi.CreateOrderAsync(order.Payload, token, ct);
                await _queue.MarkAsSentAsync(order.OrderIdLocal);
                await _queue.RemoveAsync(order.OrderIdLocal);
                Log.Information("[SyncService] ✅ Order {LocalId} synced successfully", order.OrderIdLocal);
            }
            catch (Exception ex)
            {
                var msg = ex.Message;
                await _queue.MarkAsErrorAsync(order.OrderIdLocal, msg);
                Log.Warning("[SyncService] ❌ Order {LocalId} sync failed: {Error}", order.OrderIdLocal, msg);
            }
        }
    }

    private static bool IsNetworkAvailable()
    {
        try
        {
            return NetworkInterface.GetIsNetworkAvailable();
        }
        catch
        {
            return false;
        }
    }
}
