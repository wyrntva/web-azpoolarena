using Avalonia;
using MyPos.Client.Avalonia;

/// <summary>
/// Entry point cho ứng dụng Avalonia.
/// Thay thế electron/main/index.ts + createWindow()
/// </summary>
class Program
{
    // [STAThread] không cần trên Linux (xử lý tự động bởi Avalonia)
    [STAThread]
    public static void Main(string[] args)
    {
        BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()        // Tự phát hiện Linux/Windows/macOS
            .WithInterFont()            // Font Inter hiện đại
            .LogToTrace();
}
