using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MyPos.Client.WPF.Services;
using MyPos.Client.WPF.ViewModels;
using MyPos.Client.WPF.Views;
using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Services;
using MyPos.Data.Repository;
using MyPos.Data.Repository.Repositories;
using MyPos.Hardware.Printer.Drivers;
using MyPos.SyncService.Clients;
using MyPos.SyncService.Workers;
using Serilog;
using System.IO;
using System.Windows;

namespace MyPos.Client.WPF;

/// <summary>
/// Điểm khởi động ứng dụng WPF.
/// Tương đương electron/main/index.ts — khởi tạo cửa sổ chính và các services.
/// 
/// Sử dụng .NET Generic Host để:
///   1. Quản lý DI Container (thay thế import/export giữa các file TypeScript)
///   2. Chạy BackgroundService (SyncService)
///   3. Cấu hình Serilog logging
/// </summary>
public partial class App : Application
{
    private IHost? _host;

    private void Application_Startup(object sender, StartupEventArgs e)
    {
        // ============================================
        // SERILOG SETUP
        // Tương đương console.log/console.error trong Electron
        // ============================================
        var logDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "PoolArenaPOS", "logs"
        );
        Directory.CreateDirectory(logDir);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.File(
                path: Path.Combine(logDir, "pos_.log"),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
            )
            .WriteTo.Debug()
            .CreateLogger();

        Log.Information("=== PoolArena POS Starting ===");

        // ============================================
        // .NET GENERIC HOST + DI CONTAINER
        // Tương đương các import/inject trong React components
        // ============================================
        _host = Host.CreateDefaultBuilder()
            .UseSerilog()
            .ConfigureServices(ConfigureServices)
            .Build();

        // Đảm bảo SQLite DB tồn tại
        using (var scope = _host.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();
            PosDbContext.EnsureCreated(db);
            Log.Information("[DB] SQLite database ready");
        }

        // Start background services (SyncService)
        _host.StartAsync();

        // Hiển thị cửa sổ chính
        var shellWindow = _host.Services.GetRequiredService<ShellView>();
        shellWindow.Show();
    }

    private void ConfigureServices(IServiceCollection services)
    {
        // ---- Database ----
        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "PoolArenaPOS", "pos_local.db"
        );
        Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

        services.AddDbContext<PosDbContext>(opt =>
            opt.UseSqlite($"Data Source={dbPath}"), ServiceLifetime.Scoped);

        // ---- Repositories ----
        services.AddScoped<PendingQueueRepository>();

        // ---- Business Services ----
        services.AddSingleton<ITimeBasedPricingService, TimeBasedPricingService>();
        services.AddSingleton<ICartService, CartService>();
        services.AddSingleton<ISecureConfigService, SecureConfigService>();
        services.AddSingleton<ITtsService, WindowsTtsService>();
        services.AddSingleton<INavigationService, NavigationService>();

        // ---- HTTP Client (Cloud API) ----
        services.AddHttpClient("CloudApi");
        services.AddSingleton<CloudApiClient>(sp =>
        {
            var factory = sp.GetRequiredService<IHttpClientFactory>();
            var config = sp.GetRequiredService<ISecureConfigService>();
            var baseUrl = "http://localhost:8000"; // TODO: từ config file
            return new CloudApiClient(factory, baseUrl);
        });

        // ---- Hardware ----
        services.AddSingleton<IReceiptPrinter>(sp =>
            new NetworkReceiptPrinter("192.168.1.100", 9100)); // TODO: từ config

        // ---- Background Services ----
        services.AddHostedService<OrderSyncBackgroundService>();

        // ---- ViewModels ----
        services.AddTransient<ActivationViewModel>();
        services.AddTransient<LockViewModel>();
        services.AddSingleton<ShellViewModel>();
        services.AddTransient<CashierViewModel>();
        services.AddTransient<HomeViewModel>();
        services.AddTransient<TableLayoutViewModel>();
        services.AddTransient<DashboardViewModel>();
        services.AddTransient<AttendanceViewModel>();

        // ---- Views ----
        services.AddSingleton<ShellView>();
    }

    private async void Application_Exit(object sender, ExitEventArgs e)
    {
        Log.Information("=== PoolArena POS Shutting Down ===");
        if (_host is not null)
        {
            await _host.StopAsync(TimeSpan.FromSeconds(5));
            _host.Dispose();
        }
        await Log.CloseAndFlushAsync();
    }
}
