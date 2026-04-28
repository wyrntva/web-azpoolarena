using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MyPos.Client.Avalonia.Services;
using MyPos.Client.Avalonia.ViewModels;
using MyPos.Client.Avalonia.Views;
using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Services;
using MyPos.Data.Repository;
using MyPos.Data.Repository.Repositories;
using MyPos.SyncService.Clients;
using MyPos.SyncService.Workers;
using Serilog;

namespace MyPos.Client.Avalonia;

public class App : Application
{
    private IHost? _host;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        // ============================================
        // SERILOG — ghi log ra console + file (Linux)
        // ============================================
        var logDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".poolarena-pos", "logs"
        );
        Directory.CreateDirectory(logDir);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.File(
                path: Path.Combine(logDir, "pos_.log"),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 14
            )
            .CreateLogger();

        Log.Information("=== PoolArena POS (Avalonia) Starting on {OS} ===",
            Environment.OSVersion.Platform);

        // ============================================
        // .NET GENERIC HOST + DI
        // ============================================
        _host = Host.CreateDefaultBuilder()
            .UseSerilog()
            .ConfigureServices(ConfigureServices)
            .Build();

        // Khởi tạo SQLite DB
        using (var scope = _host.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();
            PosDbContext.EnsureCreated(db);
            Log.Information("[DB] SQLite ready at {Path}", db.Database.GetConnectionString());
        }

        // Start background services
        _host.StartAsync();

        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var shellVm = _host.Services.GetRequiredService<ShellViewModel>();
            desktop.MainWindow = new ShellView { DataContext = shellVm };
            desktop.Exit += async (_, _) => await OnExit();
        }

        base.OnFrameworkInitializationCompleted();
    }

    private void ConfigureServices(IServiceCollection services)
    {
        // ---- Database (Linux path: ~/.poolarena-pos/) ----
        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".poolarena-pos", "pos_local.db"
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

        // TTS: Linux dùng espeak-ng, Windows dùng SAPI
        services.AddSingleton<ITtsService>(_ =>
            OperatingSystem.IsLinux()
                ? new EspeakTtsService()
                : new SilentTtsService()); // Fallback nếu không có TTS

        services.AddSingleton<NavigationService>();
        services.AddSingleton<INavigationService>(sp => sp.GetRequiredService<NavigationService>());

        // ---- HTTP + Cloud API ----
        services.AddHttpClient("CloudApi");
        services.AddSingleton<CloudApiClient>(sp =>
        {
            var factory = sp.GetRequiredService<IHttpClientFactory>();
            var config = sp.GetRequiredService<ISecureConfigService>();
            // TODO: đọc từ config file thực tế
            return new CloudApiClient(factory, "http://localhost:8000");
        });

        // ---- Background Services ----
        services.AddHostedService<OrderSyncBackgroundService>();

        // ---- ViewModels (Transient = mỗi lần navigate tạo mới) ----
        services.AddTransient<ActivationViewModel>();
        services.AddTransient<LockViewModel>();
        services.AddTransient<HomeViewModel>();
        services.AddTransient<CashierViewModel>();
        services.AddTransient<TableLayoutViewModel>();
        services.AddTransient<DashboardViewModel>();
        services.AddTransient<AttendanceViewModel>();

        // ShellViewModel là Singleton vì nó sống suốt app
        services.AddSingleton<ShellViewModel>();
    }

    private async Task OnExit()
    {
        Log.Information("=== PoolArena POS Shutting Down ===");
        if (_host is not null)
        {
            await _host.StopAsync(TimeSpan.FromSeconds(3));
            _host.Dispose();
        }
        await Log.CloseAndFlushAsync();
    }

    /// <summary>
    /// Global accessor (tương đương App.Current trong WPF)
    /// </summary>
    public static IServiceProvider Services =>
        (Current as App)?._host?.Services
        ?? throw new InvalidOperationException("App not initialized");
}
