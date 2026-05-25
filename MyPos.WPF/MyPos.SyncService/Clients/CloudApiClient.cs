using MyPos.Core.Business.Models;
using Serilog;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace MyPos.SyncService.Clients;

/// <summary>
/// HTTP Client giao tiếp với Cloud backend.
/// Tương đương toàn bộ services/api.ts trong Electron (fetch wrapper).
/// 
/// Sử dụng IHttpClientFactory (DI) thay cho new HttpClient() trực tiếp
/// để tránh Socket exhaustion.
/// </summary>
public class CloudApiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _baseUrl;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public CloudApiClient(IHttpClientFactory httpClientFactory, string baseUrl)
    {
        _httpClientFactory = httpClientFactory;
        _baseUrl = baseUrl.TrimEnd('/');
    }

    // ============================================
    // Orders API
    // ============================================

    /// <summary>
    /// POST /api/pos/orders — Tạo đơn hàng mới
    /// Tương đương createOrder() trong api.ts
    /// </summary>
    public async Task<Order> CreateOrderAsync(CreateOrderPayload payload, string token,
        CancellationToken ct = default)
    {
        var response = await PostAsync<Order>("/api/pos/orders", payload, token, ct);
        return response;
    }

    /// <summary>
    /// GET /api/pos/orders — Lấy tất cả đơn (thay thế polling React)
    /// </summary>
    public async Task<List<Order>> FetchOrdersAsync(string token, CancellationToken ct = default)
    {
        return await GetAsync<List<Order>>($"/api/pos/orders?_t={DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}", token, ct);
    }

    /// <summary>
    /// PUT /api/pos/orders/{id} — Cập nhật đơn
    /// </summary>
    public async Task<Order> UpdateOrderAsync(int orderId, CreateOrderPayload payload, string token,
        CancellationToken ct = default)
    {
        return await PutAsync<Order>($"/api/pos/orders/{orderId}", payload, token, ct);
    }

    /// <summary>
    /// DELETE /api/pos/orders/{id}
    /// </summary>
    public async Task DeleteOrderAsync(int orderId, string token, CancellationToken ct = default)
    {
        await DeleteAsync($"/api/pos/orders/{orderId}", token, ct);
    }

    /// <summary>
    /// POST /api/pos/orders/{id}/confirm — Xác nhận đơn Scoreboard
    /// Tương đương confirmScoreboardOrder() trong api.ts
    /// </summary>
    public async Task<Order> ConfirmScoreboardOrderAsync(int orderId, string token,
        CancellationToken ct = default)
    {
        return await PostAsync<Order>($"/api/pos/orders/{orderId}/confirm", null, token, ct);
    }

    // ============================================
    // Auth API
    // ============================================

    /// <summary>
    /// POST /api/auth/pos-login — Đăng nhập bằng PIN
    /// Tương đương login() trong api.ts
    /// </summary>
    public async Task<LoginResponse> PosLoginAsync(string pin, CancellationToken ct = default)
    {
        var payload = new { pin };
        return await PostAsync<LoginResponse>("/api/auth/pos-login", payload, null, ct);
    }

    // ============================================
    // Device API
    // ============================================

    public async Task<DeviceActivationResponse> ActivateDeviceAsync(
        string deviceCode, CancellationToken ct = default)
    {
        var payload = new { device_code = deviceCode, device_type = "pos", device_os = "windows" };
        return await PostAsync<DeviceActivationResponse>("/api/devices/activate", payload, null, ct);
    }

    public async Task CheckHealthAsync(string deviceCode, CancellationToken ct = default)
    {
        var client = CreateClient(null);
        client.DefaultRequestHeaders.Add("X-Device-Code", deviceCode);
        var response = await client.GetAsync($"{_baseUrl}/health?_t={DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}", ct);
        response.EnsureSuccessStatusCode();
    }

    // ============================================
    // Products API
    // ============================================

    public async Task<List<Product>> FetchProductsAsync(string token, CancellationToken ct = default)
    {
        return await GetAsync<List<Product>>("/api/products", token, ct);
    }

    public async Task<List<Menu>> FetchMenusAsync(string token, CancellationToken ct = default)
    {
        return await GetAsync<List<Menu>>("/api/menus", token, ct);
    }

    // ============================================
    // HTTP Helpers
    // ============================================

    private HttpClient CreateClient(string? token)
    {
        var client = _httpClientFactory.CreateClient("CloudApi");
        client.BaseAddress = new Uri(_baseUrl);
        client.Timeout = TimeSpan.FromSeconds(30);

        if (!string.IsNullOrEmpty(token))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    private async Task<T> GetAsync<T>(string endpoint, string? token, CancellationToken ct)
    {
        var client = CreateClient(token);
        var response = await client.GetAsync(endpoint, ct);
        return await ParseResponseAsync<T>(response, ct);
    }

    private async Task<T> PostAsync<T>(string endpoint, object? body, string? token, CancellationToken ct)
    {
        var client = CreateClient(token);
        var content = body is null
            ? new StringContent("", Encoding.UTF8, "application/json")
            : new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json");

        var response = await client.PostAsync(endpoint, content, ct);
        return await ParseResponseAsync<T>(response, ct);
    }

    private async Task<T> PutAsync<T>(string endpoint, object body, string? token, CancellationToken ct)
    {
        var client = CreateClient(token);
        var content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json");
        var response = await client.PutAsync(endpoint, content, ct);
        return await ParseResponseAsync<T>(response, ct);
    }

    private async Task DeleteAsync(string endpoint, string? token, CancellationToken ct)
    {
        var client = CreateClient(token);
        var response = await client.DeleteAsync(endpoint, ct);
        response.EnsureSuccessStatusCode();
    }

    private static async Task<T> ParseResponseAsync<T>(HttpResponseMessage response, CancellationToken ct)
    {
        var json = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            Log.Warning("[CloudApi] HTTP {Status} — {Body}", (int)response.StatusCode, json);
            throw new HttpRequestException($"API Error {(int)response.StatusCode}: {json}");
        }

        return JsonSerializer.Deserialize<T>(json, JsonOptions)
               ?? throw new InvalidOperationException("Empty API response");
    }
}

// Response DTOs
public record LoginResponse(string AccessToken, string RefreshToken, string TokenType, LoginUser? User);
public record LoginUser(int Id, string Username, string FullName, string? RoleName);
public record DeviceActivationResponse(bool Success, int? DeviceId, string? DeviceName, string? Message);
