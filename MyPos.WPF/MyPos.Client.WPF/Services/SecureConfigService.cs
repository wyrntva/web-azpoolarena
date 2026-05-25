using Microsoft.Data.Sqlite;
using MyPos.Core.Business.Interfaces;
using MyPos.Data.Repository;
using MyPos.Data.Repository.Entities;
using Serilog;

namespace MyPos.Client.WPF.Services;

/// <summary>
/// Lưu config thiết bị vào SQLite (bảng DeviceConfig).
/// Thay thế localStorage trong Electron:
///   localStorage.setItem('device_activated', 'true') 
///   localStorage.setItem('pos_auth_token', token)
///   localStorage.setItem('device_code', code)
/// </summary>
public class SecureConfigService : ISecureConfigService
{
    private readonly PosDbContext _db;

    // Cache in-memory để tránh query DB liên tục
    private readonly Dictionary<string, string?> _cache = new();

    private const string KEY_AUTH_TOKEN       = "auth_token";
    private const string KEY_DEVICE_CODE      = "device_code";
    private const string KEY_DEVICE_NAME      = "device_name";
    private const string KEY_DEVICE_ACTIVATED = "device_activated";
    private const string KEY_USER_JSON        = "user_json";

    public SecureConfigService(PosDbContext db)
    {
        _db = db;
        // Pre-load all config on startup
        LoadCache();
    }

    private void LoadCache()
    {
        try
        {
            var entries = _db.DeviceConfig.ToList();
            foreach (var e in entries)
                _cache[e.Key] = e.Value;
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "[Config] Failed to load device config from DB");
        }
    }

    public bool IsDeviceActivated
    {
        get => GetValue(KEY_DEVICE_ACTIVATED) == "true";
    }

    public void SetDeviceActivated(bool activated)
    {
        SetValue(KEY_DEVICE_ACTIVATED, activated ? "true" : "false");
    }

    public void SaveAuthToken(string token)    => SetValue(KEY_AUTH_TOKEN, token);
    public string? GetAuthToken()              => GetValue(KEY_AUTH_TOKEN);
    public void ClearAuthToken()               => SetValue(KEY_AUTH_TOKEN, null);

    public void SaveDeviceCode(string code)    => SetValue(KEY_DEVICE_CODE, code);
    public string? GetDeviceCode()             => GetValue(KEY_DEVICE_CODE);

    public void SaveDeviceName(string name)    => SetValue(KEY_DEVICE_NAME, name);
    public string? GetDeviceName()             => GetValue(KEY_DEVICE_NAME);

    public void SaveUserInfo(string userJson)  => SetValue(KEY_USER_JSON, userJson);
    public string? GetUserJson()               => GetValue(KEY_USER_JSON);

    public void ClearAll()
    {
        _cache.Clear();
        _db.DeviceConfig.RemoveRange(_db.DeviceConfig);
        _db.SaveChanges();
    }

    private string? GetValue(string key)
    {
        _cache.TryGetValue(key, out var val);
        return val;
    }

    private void SetValue(string key, string? value)
    {
        _cache[key] = value;

        var existing = _db.DeviceConfig.Find(key);
        if (existing is not null)
        {
            existing.Value = value;
            existing.UpdatedAt = DateTime.Now;
        }
        else
        {
            _db.DeviceConfig.Add(new DeviceConfigEntity
            {
                Key = key,
                Value = value,
                UpdatedAt = DateTime.Now
            });
        }
        _db.SaveChanges();
    }
}
