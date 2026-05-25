using MyPos.Core.Business.Interfaces;
using MyPos.Data.Repository;
using MyPos.Data.Repository.Entities;
using Serilog;

namespace MyPos.Client.Avalonia.Services;

/// <summary>
/// Lưu config vào SQLite (thay thế localStorage trong Electron).
/// Tương tự WPF SecureConfigService nhưng dùng path Linux (~/.poolarena-pos/).
/// </summary>
public class SecureConfigService : ISecureConfigService
{
    private readonly PosDbContext _db;
    private readonly Dictionary<string, string?> _cache = new();

    private const string KEY_AUTH_TOKEN       = "auth_token";
    private const string KEY_DEVICE_CODE      = "device_code";
    private const string KEY_DEVICE_NAME      = "device_name";
    private const string KEY_DEVICE_ACTIVATED = "device_activated";
    private const string KEY_USER_JSON        = "user_json";

    public SecureConfigService(PosDbContext db)
    {
        _db = db;
        try
        {
            foreach (var e in _db.DeviceConfig.ToList())
                _cache[e.Key] = e.Value;
        }
        catch (Exception ex) { Log.Warning(ex, "[Config] Pre-load failed"); }
    }

    public bool IsDeviceActivated => Get(KEY_DEVICE_ACTIVATED) == "true";
    public void SetDeviceActivated(bool v) => Set(KEY_DEVICE_ACTIVATED, v ? "true" : "false");

    public void SaveAuthToken(string t)    => Set(KEY_AUTH_TOKEN, t);
    public string? GetAuthToken()          => Get(KEY_AUTH_TOKEN);
    public void ClearAuthToken()           => Set(KEY_AUTH_TOKEN, null);

    public void SaveDeviceCode(string c)   => Set(KEY_DEVICE_CODE, c);
    public string? GetDeviceCode()         => Get(KEY_DEVICE_CODE);

    public void SaveDeviceName(string n)   => Set(KEY_DEVICE_NAME, n);
    public string? GetDeviceName()         => Get(KEY_DEVICE_NAME);

    public void SaveUserInfo(string j)     => Set(KEY_USER_JSON, j);
    public string? GetUserJson()           => Get(KEY_USER_JSON);

    public void ClearAll()
    {
        _cache.Clear();
        _db.DeviceConfig.RemoveRange(_db.DeviceConfig);
        _db.SaveChanges();
    }

    private string? Get(string key) { _cache.TryGetValue(key, out var v); return v; }

    private void Set(string key, string? value)
    {
        _cache[key] = value;
        var e = _db.DeviceConfig.Find(key);
        if (e is not null) { e.Value = value; e.UpdatedAt = DateTime.Now; }
        else _db.DeviceConfig.Add(new DeviceConfigEntity { Key = key, Value = value, UpdatedAt = DateTime.Now });
        _db.SaveChanges();
    }
}

// ============================================
// TTS Services (Linux & fallback)
// ============================================

/// <summary>
/// TTS trên Linux bằng espeak-ng (sudo apt install espeak-ng).
/// Thay thế edge-tts + mpv trong Electron.
/// </summary>
public class EspeakTtsService : MyPos.Core.Business.Interfaces.ITtsService
{
    public bool IsEnabled { get; set; } = true;

    public async Task SpeakAsync(string text, int repeat = 1, CancellationToken ct = default)
    {
        if (!IsEnabled || string.IsNullOrWhiteSpace(text)) return;

        for (int i = 0; i < Math.Min(repeat, 3); i++)
        {
            try
            {
                // espeak-ng: tiếng Việt cần voice "vi"
                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "espeak-ng",
                    Arguments = $"-v vi -s 130 \"{text.Replace("\"", "'")}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                };

                using var proc = System.Diagnostics.Process.Start(psi);
                if (proc is not null)
                {
                    await proc.WaitForExitAsync(ct);
                    if (i < repeat - 1) await Task.Delay(300, ct);
                }
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "[TTS] espeak-ng failed. Install: sudo apt install espeak-ng");
                break;
            }
        }
    }
}

/// <summary>
/// Fallback khi không có TTS engine — chỉ log
/// </summary>
public class SilentTtsService : MyPos.Core.Business.Interfaces.ITtsService
{
    public bool IsEnabled { get; set; } = false;
    public Task SpeakAsync(string text, int repeat = 1, CancellationToken ct = default)
    {
        Log.Information("[TTS] (silent) \"{Text}\"", text);
        return Task.CompletedTask;
    }
}
