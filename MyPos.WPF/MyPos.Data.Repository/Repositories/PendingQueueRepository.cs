using Dapper;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;
using MyPos.Data.Repository.Entities;
using Serilog;
using System.Text.Json;

namespace MyPos.Data.Repository.Repositories;

/// <summary>
/// Repository xử lý PendingQueue (đơn hàng offline chưa sync).
/// Tương đương toàn bộ lib/pendingQueue.ts trong Electron.
/// Sử dụng Dapper cho raw SQL queries hiệu năng cao, EF Core cho CRUD chuẩn.
/// </summary>
public class PendingQueueRepository
{
    private readonly PosDbContext _db;
    private readonly string _connectionString;

    public PendingQueueRepository(PosDbContext db)
    {
        _db = db;
        _connectionString = db.Database.GetConnectionString()!;
    }

    /// <summary>
    /// Thêm đơn hàng vào queue khi mất mạng.
    /// Tương đương addPending() trong pendingQueue.ts
    /// </summary>
    public async Task EnqueueAsync(PendingOrder order)
    {
        var entity = new PendingQueueEntity
        {
            OrderIdLocal = order.OrderIdLocal,
            PayloadJson = JsonSerializer.Serialize(order.Payload),
            Status = "pending",
            CreatedAt = order.CreatedAt
        };

        _db.PendingQueue.Add(entity);
        await _db.SaveChangesAsync();
        Log.Information("[PendingQueue] Enqueued order {LocalId}", order.OrderIdLocal);
    }

    /// <summary>
    /// Lấy tất cả đơn pending.
    /// Tương đương getPendingOrders() trong pendingQueue.ts
    /// </summary>
    public async Task<List<PendingOrder>> GetAllPendingAsync()
    {
        // Dapper raw query for read performance
        using var conn = new SqliteConnection(_connectionString);

        var rows = await conn.QueryAsync<PendingQueueEntity>(
            "SELECT * FROM PendingQueue WHERE Status = 'pending' ORDER BY CreatedAt ASC"
        );

        return rows.Select(r => new PendingOrder
        {
            OrderIdLocal = r.OrderIdLocal,
            Payload = JsonSerializer.Deserialize<CreateOrderPayload>(r.PayloadJson)!,
            Status = PendingStatus.Pending,
            CreatedAt = r.CreatedAt,
            RetryCount = r.RetryCount,
            Error = r.ErrorMessage
        }).ToList();
    }

    /// <summary>
    /// Đánh dấu đơn đã gửi thành công.
    /// Tương đương updatePendingStatus(id, 'sent')
    /// </summary>
    public async Task MarkAsSentAsync(string orderIdLocal)
    {
        var entity = await _db.PendingQueue.FindAsync(orderIdLocal);
        if (entity is not null)
        {
            entity.Status = "sent";
            entity.LastAttemptAt = DateTime.Now;
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Đánh dấu lỗi, tăng retry count.
    /// Tương đương updatePendingStatus(id, 'error', msg)
    /// </summary>
    public async Task MarkAsErrorAsync(string orderIdLocal, string errorMessage)
    {
        var entity = await _db.PendingQueue.FindAsync(orderIdLocal);
        if (entity is not null)
        {
            entity.Status = "error";
            entity.ErrorMessage = errorMessage;
            entity.RetryCount++;
            entity.LastAttemptAt = DateTime.Now;
            await _db.SaveChangesAsync();
            Log.Warning("[PendingQueue] Order {LocalId} failed (attempt {Retry}): {Error}",
                orderIdLocal, entity.RetryCount, errorMessage);
        }
    }

    /// <summary>
    /// Reset lỗi về pending để retry.
    /// </summary>
    public async Task ResetErrorsForRetryAsync()
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.ExecuteAsync(
            "UPDATE PendingQueue SET Status = 'pending' WHERE Status = 'error' AND RetryCount < 5"
        );
    }

    /// <summary>
    /// Xóa đơn đã sync thành công.
    /// Tương đương removePending() trong pendingQueue.ts
    /// </summary>
    public async Task RemoveAsync(string orderIdLocal)
    {
        var entity = await _db.PendingQueue.FindAsync(orderIdLocal);
        if (entity is not null)
        {
            _db.PendingQueue.Remove(entity);
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Đếm số đơn chưa sync (hiển thị badge trên UI)
    /// </summary>
    public async Task<int> CountPendingAsync()
    {
        using var conn = new SqliteConnection(_connectionString);
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM PendingQueue WHERE Status = 'pending'"
        );
    }
}
