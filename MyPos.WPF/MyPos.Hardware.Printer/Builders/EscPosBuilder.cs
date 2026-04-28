using System.Text;

namespace MyPos.Hardware.Printer.Builders;

/// <summary>
/// Builder tạo lệnh ESC/POS cho máy in nhiệt.
/// Tương đương hàm buildEscPos() trong electron/main/index.ts
/// 
/// Khác biệt: C# dùng byte[] thay vì string concat.
/// Fluent Builder pattern cho dễ đọc và mở rộng.
/// </summary>
public class EscPosBuilder
{
    // ESC/POS Control Codes
    private static readonly byte[] CMD_INIT        = { 0x1B, 0x40 };           // Initialize printer
    private static readonly byte[] CMD_ALIGN_LEFT   = { 0x1B, 0x61, 0x00 };    // Left align
    private static readonly byte[] CMD_ALIGN_CENTER = { 0x1B, 0x61, 0x01 };    // Center align
    private static readonly byte[] CMD_ALIGN_RIGHT  = { 0x1B, 0x61, 0x02 };    // Right align
    private static readonly byte[] CMD_BOLD_ON      = { 0x1B, 0x45, 0x01 };    // Bold on
    private static readonly byte[] CMD_BOLD_OFF     = { 0x1B, 0x45, 0x00 };    // Bold off
    private static readonly byte[] CMD_DOUBLE_SIZE  = { 0x1D, 0x21, 0x11 };    // Double height+width
    private static readonly byte[] CMD_NORMAL_SIZE  = { 0x1D, 0x21, 0x00 };    // Normal size
    private static readonly byte[] CMD_CUT_FULL     = { 0x1D, 0x56, 0x00 };    // Full cut
    private static readonly byte[] CMD_CUT_PARTIAL  = { 0x1D, 0x56, 0x01 };    // Partial cut
    private static readonly byte[] CMD_OPEN_DRAWER  = { 0x1B, 0x70, 0x00, 0x19, 0x19 }; // Cash drawer

    private readonly List<byte[]> _commands = new();
    private static readonly Encoding _encoding = Encoding.GetEncoding("UTF-8");

    // ============================================
    // FLUENT API
    // ============================================

    public EscPosBuilder Initialize()
    {
        _commands.Add(CMD_INIT);
        return this;
    }

    public EscPosBuilder AlignLeft()   { _commands.Add(CMD_ALIGN_LEFT); return this; }
    public EscPosBuilder AlignCenter() { _commands.Add(CMD_ALIGN_CENTER); return this; }
    public EscPosBuilder AlignRight()  { _commands.Add(CMD_ALIGN_RIGHT); return this; }

    public EscPosBuilder BoldOn()  { _commands.Add(CMD_BOLD_ON); return this; }
    public EscPosBuilder BoldOff() { _commands.Add(CMD_BOLD_OFF); return this; }

    public EscPosBuilder DoubleSizeOn()  { _commands.Add(CMD_DOUBLE_SIZE); return this; }
    public EscPosBuilder DoubleSizeOff() { _commands.Add(CMD_NORMAL_SIZE); return this; }

    /// <summary>
    /// In một dòng text + xuống dòng
    /// </summary>
    public EscPosBuilder Line(string text)
    {
        _commands.Add(_encoding.GetBytes(text + "\n"));
        return this;
    }

    /// <summary>
    /// In dòng kẻ ngang (separator)
    /// </summary>
    public EscPosBuilder Separator(char c = '-', int width = 32)
    {
        return Line(new string(c, width));
    }

    /// <summary>
    /// In 2 cột: trái + phải (dùng cho item list)
    /// </summary>
    public EscPosBuilder TwoColumns(string left, string right, int totalWidth = 32)
    {
        var spaces = totalWidth - left.Length - right.Length;
        if (spaces < 1) spaces = 1;
        return Line(left + new string(' ', spaces) + right);
    }

    /// <summary>
    /// In dòng trống
    /// </summary>
    public EscPosBuilder EmptyLine(int count = 1)
    {
        for (int i = 0; i < count; i++)
            _commands.Add(new byte[] { 0x0A }); // LF
        return this;
    }

    /// <summary>
    /// Cắt giấy (full cut)
    /// Tương đương ${GS}V\x00 trong Electron
    /// </summary>
    public EscPosBuilder Cut(bool partial = false)
    {
        _commands.Add(partial ? CMD_CUT_PARTIAL : CMD_CUT_FULL);
        return this;
    }

    /// <summary>
    /// Mở két tiền điện tử
    /// </summary>
    public EscPosBuilder OpenCashDrawer()
    {
        _commands.Add(CMD_OPEN_DRAWER);
        return this;
    }

    /// <summary>
    /// Build ra mảng byte[] hoàn chỉnh để gửi tới máy in
    /// </summary>
    public byte[] Build()
    {
        var totalLength = _commands.Sum(c => c.Length);
        var result = new byte[totalLength];
        int offset = 0;
        foreach (var cmd in _commands)
        {
            Buffer.BlockCopy(cmd, 0, result, offset, cmd.Length);
            offset += cmd.Length;
        }
        return result;
    }

    // ============================================
    // CONVENIENCE: Build receipt in one call
    // Tương đương buildEscPos() trong electron/main/index.ts
    // ============================================

    public static byte[] BuildReceipt(ReceiptData data)
    {
        var builder = new EscPosBuilder();
        builder
            .Initialize()
            .AlignCenter()
            .BoldOn()
            .DoubleSizeOn()
            .Line("AZ POOLARENA")
            .DoubleSizeOff()
            .BoldOff()
            .Line("Khu bida - Giải trí")
            .EmptyLine()
            .AlignLeft()
            .Line($"Don hang: {data.OrderId ?? data.OrderIdLocal ?? "LOCAL"}")
            .Line($"Thoi gian: {data.CreatedAt:dd/MM/yyyy HH:mm:ss}")
            .Separator()
            .BoldOn()
            .TwoColumns("TEN MON", "THANH TIEN")
            .BoldOff()
            .Separator();

        foreach (var item in data.Items)
        {
            builder.Line($"{item.Name}");
            builder.TwoColumns($"  x{item.Qty} x {item.Price:N0}", $"{item.Qty * item.Price:N0}d");
        }

        builder
            .Separator()
            .BoldOn()
            .TwoColumns("TONG CONG:", $"{data.Total:N0}d")
            .BoldOff()
            .Line($"Da thanh toan: {data.Paid:N0}d ({data.Method})")
            .Line($"Tien thua: {Math.Max(0, data.Paid - data.Total):N0}d")
            .EmptyLine()
            .AlignCenter()
            .Line("--- Cam on quy khach! ---")
            .Line("Hen gap lai lan sau")
            .EmptyLine(3)
            .Cut();

        return builder.Build();
    }
}

/// <summary>
/// Data model cho hóa đơn in.
/// Tương đương ReceiptPayload trong electron/main/index.ts
/// </summary>
public class ReceiptData
{
    public string? OrderId { get; set; }
    public string? OrderIdLocal { get; set; }
    public string? TableName { get; set; }
    public List<ReceiptItem> Items { get; set; } = new();
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public string Method { get; set; } = "Tiền mặt";
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}

public class ReceiptItem
{
    public string Name { get; set; } = string.Empty;
    public int Qty { get; set; }
    public decimal Price { get; set; }
}
