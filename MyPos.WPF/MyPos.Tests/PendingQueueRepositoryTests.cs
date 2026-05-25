using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;
using MyPos.Data.Repository;
using MyPos.Data.Repository.Repositories;
using System.Text.Json;
using Xunit;

namespace MyPos.Tests;

/// <summary>
/// Test PendingQueueRepository với SQLite in-memory.
/// Tương đương test cho usePendingSync hook trong Electron.
/// Chạy được trên Ubuntu — SQLite in-memory không cần file.
/// </summary>
public class PendingQueueRepositoryTests : IDisposable
{
    private readonly PosDbContext _db;
    private readonly PendingQueueRepository _repo;

    public PendingQueueRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<PosDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;

        _db = new PosDbContext(options);
        _db.Database.EnsureCreated();
        _repo = new PendingQueueRepository(_db);
    }

    private static PendingOrder MakePendingOrder(string? localId = null) => new()
    {
        OrderIdLocal = localId ?? Guid.NewGuid().ToString(),
        Payload = new CreateOrderPayload
        {
            TableName = "Bàn 5",
            TableNumber = 5,
            OrderType = "dine-in",
            Items = new List<CreateOrderItemPayload>
            {
                new() { ProductId = 1, Qty = 2, Price = 50_000m }
            }
        },
        Status = PendingStatus.Pending,
        CreatedAt = DateTime.Now
    };

    [Fact]
    public async Task Enqueue_AddsOrderToDatabase()
    {
        var order = MakePendingOrder();
        await _repo.EnqueueAsync(order);

        var count = await _db.PendingQueue.CountAsync();
        count.Should().Be(1);
    }

    [Fact]
    public async Task GetAllPending_ReturnsOnlyPendingStatus()
    {
        await _repo.EnqueueAsync(MakePendingOrder("order-1"));
        await _repo.EnqueueAsync(MakePendingOrder("order-2"));
        await _repo.MarkAsSentAsync("order-1");

        var pending = await _repo.GetAllPendingAsync();

        pending.Should().HaveCount(1);
        pending[0].OrderIdLocal.Should().Be("order-2");
    }

    [Fact]
    public async Task MarkAsSent_UpdatesStatus()
    {
        await _repo.EnqueueAsync(MakePendingOrder("order-abc"));
        await _repo.MarkAsSentAsync("order-abc");

        var entity = await _db.PendingQueue.FindAsync("order-abc");
        entity!.Status.Should().Be("sent");
    }

    [Fact]
    public async Task MarkAsError_IncrementsRetryCount()
    {
        await _repo.EnqueueAsync(MakePendingOrder("order-fail"));
        await _repo.MarkAsErrorAsync("order-fail", "Connection refused");
        await _repo.MarkAsErrorAsync("order-fail", "Timeout");

        var entity = await _db.PendingQueue.FindAsync("order-fail");
        entity!.RetryCount.Should().Be(2);
        entity.Status.Should().Be("error");
        entity.ErrorMessage.Should().Be("Timeout");
    }

    [Fact]
    public async Task Remove_DeletesFromDatabase()
    {
        await _repo.EnqueueAsync(MakePendingOrder("order-del"));
        await _repo.RemoveAsync("order-del");

        var entity = await _db.PendingQueue.FindAsync("order-del");
        entity.Should().BeNull();
    }

    [Fact]
    public async Task CountPending_ReturnsCorrectCount()
    {
        await _repo.EnqueueAsync(MakePendingOrder());
        await _repo.EnqueueAsync(MakePendingOrder());
        await _repo.EnqueueAsync(MakePendingOrder("sent-order"));
        await _repo.MarkAsSentAsync("sent-order");

        var count = await _repo.CountPendingAsync();
        count.Should().Be(2);
    }

    [Fact]
    public async Task Enqueue_PayloadSerializesDeserializesCorrectly()
    {
        var order = MakePendingOrder("order-json");
        await _repo.EnqueueAsync(order);

        var pending = await _repo.GetAllPendingAsync();
        var first = pending[0];

        first.Payload.TableName.Should().Be("Bàn 5");
        first.Payload.Items.Should().HaveCount(1);
        first.Payload.Items[0].Qty.Should().Be(2);
        first.Payload.Items[0].Price.Should().Be(50_000m);
    }

    public void Dispose()
    {
        _db.Dispose();
    }
}
