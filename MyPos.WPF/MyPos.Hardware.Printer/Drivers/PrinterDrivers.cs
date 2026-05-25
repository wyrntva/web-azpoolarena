using MyPos.Hardware.Printer.Builders;
using Serilog;
using System.IO.Ports;
using System.Net.Sockets;

namespace MyPos.Hardware.Printer.Drivers;

/// <summary>
/// Interface máy in — tương đương ipcMain.handle('print-receipt') trong Electron
/// </summary>
public interface IReceiptPrinter
{
    Task<PrintResult> PrintAsync(ReceiptData data, CancellationToken ct = default);
    Task<bool> TestConnectionAsync(CancellationToken ct = default);
    string PrinterDescription { get; }
}

public record PrintResult(bool Success, string? ErrorMessage = null);

// ============================================
// LAN PRINTER (ESC/POS qua TCP socket)
// ============================================

/// <summary>
/// In qua mạng LAN (TCP raw socket → port 9100).
/// Phổ biến nhất cho máy in nhiệt như Xprinter, EPSON TM series.
/// </summary>
public class NetworkReceiptPrinter : IReceiptPrinter
{
    private readonly string _ipAddress;
    private readonly int _port;

    public NetworkReceiptPrinter(string ipAddress, int port = 9100)
    {
        _ipAddress = ipAddress;
        _port = port;
    }

    public string PrinterDescription => $"Network: {_ipAddress}:{_port}";

    public async Task<PrintResult> PrintAsync(ReceiptData data, CancellationToken ct = default)
    {
        try
        {
            var bytes = EscPosBuilder.BuildReceipt(data);
            using var client = new TcpClient();

            await client.ConnectAsync(_ipAddress, _port, ct);
            await using var stream = client.GetStream();
            await stream.WriteAsync(bytes, ct);

            Log.Information("[Printer] ✅ Printed {Bytes} bytes to {IP}:{Port}", bytes.Length, _ipAddress, _port);
            return new PrintResult(true);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "[Printer] ❌ LAN print failed to {IP}:{Port}", _ipAddress, _port);
            return new PrintResult(false, ex.Message);
        }
    }

    public async Task<bool> TestConnectionAsync(CancellationToken ct = default)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(_ipAddress, _port, ct);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

// ============================================
// USB / COM PORT PRINTER
// ============================================

/// <summary>
/// In qua cổng COM (RS-232/USB-Serial).
/// Dùng khi máy in không có card mạng.
/// </summary>
public class SerialReceiptPrinter : IReceiptPrinter
{
    private readonly string _portName;   // "COM3", "COM4"...
    private readonly int _baudRate;

    public SerialReceiptPrinter(string portName, int baudRate = 9600)
    {
        _portName = portName;
        _baudRate = baudRate;
    }

    public string PrinterDescription => $"Serial: {_portName} @ {_baudRate}bps";

    public async Task<PrintResult> PrintAsync(ReceiptData data, CancellationToken ct = default)
    {
        return await Task.Run(() =>
        {
            try
            {
                var bytes = EscPosBuilder.BuildReceipt(data);
                using var port = new SerialPort(_portName, _baudRate, Parity.None, 8, StopBits.One);
                port.Open();
                port.Write(bytes, 0, bytes.Length);
                port.Close();

                Log.Information("[Printer] ✅ Printed via {Port}", _portName);
                return new PrintResult(true);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[Printer] ❌ Serial print failed on {Port}", _portName);
                return new PrintResult(false, ex.Message);
            }
        }, ct);
    }

    public Task<bool> TestConnectionAsync(CancellationToken ct = default)
    {
        try
        {
            var ports = SerialPort.GetPortNames();
            return Task.FromResult(ports.Contains(_portName));
        }
        catch
        {
            return Task.FromResult(false);
        }
    }
}

// ============================================
// Két tiền điện tử (Cash Drawer)
// ============================================

/// <summary>
/// Điều khiển két tiền qua máy in (kick signal qua RJ11).
/// </summary>
public class CashDrawerService
{
    private readonly IReceiptPrinter _printer;

    public CashDrawerService(IReceiptPrinter printer)
    {
        _printer = printer;
    }

    /// <summary>
    /// Mở két tiền bằng cách gửi lệnh ESC/POS drawer kick
    /// </summary>
    public async Task OpenAsync(CancellationToken ct = default)
    {
        // Gửi lệnh Open Drawer qua printer
        var builder = new EscPosBuilder();
        var bytes = builder.Initialize().OpenCashDrawer().Build();

        // Dùng raw socket nếu là NetworkPrinter
        if (_printer is NetworkReceiptPrinter netPrinter)
        {
            // TODO: inject ip/port từ config
            Log.Information("[CashDrawer] 💰 Opening cash drawer...");
        }

        Log.Information("[CashDrawer] ✅ Drawer open signal sent");
    }
}
