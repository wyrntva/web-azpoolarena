using Microsoft.EntityFrameworkCore;
using MyPos.Data.Repository.Entities;

namespace MyPos.Data.Repository;

/// <summary>
/// EF Core DbContext cho SQLite local database.
/// Thay thế hoàn toàn localStorage + localforage trong Electron app.
/// 
/// Database file: %APPDATA%\PoolArenaPOS\pos_local.db
/// </summary>
public class PosDbContext : DbContext
{
    public PosDbContext(DbContextOptions<PosDbContext> options) : base(options) { }

    public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    public DbSet<OrderItemEntity> OrderItems => Set<OrderItemEntity>();
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<PendingQueueEntity> PendingQueue => Set<PendingQueueEntity>();
    public DbSet<DeviceConfigEntity> DeviceConfig => Set<DeviceConfigEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Orders
        modelBuilder.Entity<OrderEntity>(e =>
        {
            e.HasIndex(o => o.LocalId).IsUnique(false);
            e.HasIndex(o => o.ServerId).IsUnique(false);
            e.HasIndex(o => o.Status);
            e.HasIndex(o => o.CreatedAt);
            e.HasIndex(o => o.IsSynced);
        });

        // OrderItems
        modelBuilder.Entity<OrderItemEntity>(e =>
        {
            e.HasOne(i => i.Order)
             .WithMany(o => o.Items)
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Products — cache từ cloud
        modelBuilder.Entity<ProductEntity>(e =>
        {
            e.HasIndex(p => p.Barcode);
            e.HasIndex(p => p.CategoryId);
        });

        // PendingQueue
        modelBuilder.Entity<PendingQueueEntity>(e =>
        {
            e.HasIndex(p => p.Status);
            e.HasIndex(p => p.CreatedAt);
        });

        // DeviceConfig — key-value store
        modelBuilder.Entity<DeviceConfigEntity>(e =>
        {
            e.HasKey(c => c.Key);
        });
    }

    /// <summary>
    /// Helper: Đảm bảo database được tạo và migrate khi khởi động app
    /// </summary>
    public static void EnsureCreated(PosDbContext context)
    {
        context.Database.EnsureCreated();
    }
}
