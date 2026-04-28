using Microsoft.AspNetCore.SignalR;
using MyPos.Core.Business.Models;
using MyPos.LocalHost.Api.Hubs;
using Serilog;

namespace MyPos.LocalHost.Api;

/// <summary>
/// Local Kestrel API host — tương đương SapoHost.exe.
/// Chạy ngầm trong app WPF, lắng nghe kết nối từ thiết bị vệ tinh trong LAN
/// (máy tính bảng bếp/bi-a, tablet, thiết bị khác).
/// 
/// Endpoint mặc định: http://0.0.0.0:5050 (LAN accessible)
/// </summary>
public static class LocalApiHost
{
    private static WebApplication? _app;

    public static async Task StartAsync(CancellationToken ct = default)
    {
        var builder = WebApplication.CreateBuilder();

        builder.WebHost.UseUrls("http://0.0.0.0:5050");

        builder.Services.AddSignalR();
        builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
            p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
        builder.Services.AddControllers();

        builder.Host.UseSerilog();

        _app = builder.Build();

        _app.UseCors();
        _app.MapControllers();
        _app.MapHub<PosHub>("/hubs/pos");

        Log.Information("[LocalHost] 🌐 Starting on http://0.0.0.0:5050");
        await _app.RunAsync(ct);
    }

    public static async Task StopAsync()
    {
        if (_app is not null)
        {
            await _app.StopAsync();
            Log.Information("[LocalHost] ⏹ Stopped");
        }
    }

    /// <summary>
    /// Push real-time event tới tất cả clients trong LAN.
    /// Thay thế polling 5s bằng push mechanism.
    /// </summary>
    public static IHubContext<PosHub>? HubContext => _app?.Services.GetService<IHubContext<PosHub>>();
}
