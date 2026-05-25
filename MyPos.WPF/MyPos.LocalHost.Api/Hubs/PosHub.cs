using Microsoft.AspNetCore.SignalR;

namespace MyPos.LocalHost.Api.Hubs;

/// <summary>
/// SignalR Hub — real-time bridge giữa POS máy tính và thiết bị vệ tinh (tablet bếp/bi-a).
/// Thay thế polling setInterval 5000ms trong Electron.
/// 
/// Clients:
///   - Scoreboard tablets (bàn bi-a) — gửi order mới
///   - Kitchen display — nhận order cần chuẩn bị
///   - POS (WPF) — nhận notification order mới
/// </summary>
public class PosHub : Hub
{
    /// <summary>
    /// Thiết bị Scoreboard gửi order mới → broadcast tới POS
    /// Thay thế luồng: Scoreboard → MQTT → Backend → POS polling
    /// </summary>
    public async Task SendScoreboardOrder(object orderPayload)
    {
        await Clients.Others.SendAsync("ReceiveScoreboardOrder", orderPayload);
        Serilog.Log.Information("[Hub] 📋 Scoreboard order received from {ConnectionId}", Context.ConnectionId);
    }

    /// <summary>
    /// POS broadcast đơn đã xác nhận tới kitchen display
    /// </summary>
    public async Task ConfirmOrder(int orderId)
    {
        await Clients.All.SendAsync("OrderConfirmed", orderId);
    }

    /// <summary>
    /// POS ping để thiết bị biết server đang online
    /// </summary>
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.Now);
    }

    public override Task OnConnectedAsync()
    {
        Serilog.Log.Information("[Hub] + Client connected: {Id}", Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        Serilog.Log.Information("[Hub] - Client disconnected: {Id}", Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}
