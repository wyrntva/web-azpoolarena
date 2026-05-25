using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;
using MyPos.SyncService.Clients;
using System.Collections.ObjectModel;

namespace MyPos.Client.Avalonia.ViewModels;

public partial class CashierViewModel : BaseViewModel
{
    private readonly ICartService _cartService;
    private readonly ITimeBasedPricingService _pricing;
    private readonly CloudApiClient _cloudApi;
    private readonly ISecureConfigService _config;
    private readonly INavigationService _navigation;

    // --- Search & Menu ---
    [ObservableProperty] private string _searchQuery = string.Empty;
    [ObservableProperty] private ObservableCollection<Menu> _menus = new();
    [ObservableProperty] private ObservableCollection<Product> _products = new();
    [ObservableProperty] private Menu? _selectedCategory;
    [ObservableProperty] private bool _loadingProducts;

    // --- Cart ---
    [ObservableProperty] private ObservableCollection<CartLine> _cart = new();
    [ObservableProperty] private CartLine? _selectedLine;

    // --- Order Meta ---
    [ObservableProperty] private int _customerCount = 1;
    [ObservableProperty] private OrderType _orderType = OrderType.DineIn;
    [ObservableProperty] private string? _selectedTable;
    [ObservableProperty] private int? _selectedTableId;
    [ObservableProperty] private int? _selectedAreaId;

    // --- Modal flags ---
    [ObservableProperty] private bool _showTablePicker;
    [ObservableProperty] private bool _showTimeEditModal;
    [ObservableProperty] private bool _showUnsavedChangesModal;
    [ObservableProperty] private CartLine? _editingLine;

    // --- Clock ---
    private readonly DispatcherTimer _clock;
    private readonly DispatcherTimer _productRefreshTimer;
    [ObservableProperty] private string _timeText = string.Empty;
    [ObservableProperty] private string _dateText = string.Empty;

    public Order? InitialOrder { get; set; }
    private string? _initialTableSnapshot;

    // ---- Computed ----
    public decimal CartTotal => _cartService.CalculateTotal(Cart, DateTime.Now);
    public bool HasCartItems => Cart.Count > 0;

    public IEnumerable<Product> FilteredProducts
    {
        get
        {
            var source = SelectedCategory?.ProductIds?.Count > 0
                ? Products.Where(p => SelectedCategory.ProductIds.Contains(p.Id))
                : (IEnumerable<Product>)Products;

            var q = SearchQuery.Trim().ToLower();
            if (!string.IsNullOrEmpty(q))
                source = source.Where(p => p.Name.ToLower().Contains(q)
                                        || (p.Barcode ?? "").Contains(q));
            return source;
        }
    }

    public bool IsDirty => SelectedTable != _initialTableSnapshot || Cart.Count > 0;

    public string UserName => "Nhân viên POS"; // TODO: từ config

    public CashierViewModel(
        ICartService cartService,
        ITimeBasedPricingService pricing,
        CloudApiClient cloudApi,
        ISecureConfigService config,
        INavigationService navigation)
    {
        _cartService = cartService;
        _pricing = pricing;
        _cloudApi = cloudApi;
        _config = config;
        _navigation = navigation;

        // Clock mỗi giây — tương đương setInterval(setNow, 1000) trong React
        _clock = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _clock.Tick += (_, _) =>
        {
            UpdateClock();
            OnPropertyChanged(nameof(CartTotal)); // Realtime time-based price
        };
        _clock.Start();
        UpdateClock();

        // Refresh products mỗi 30s
        _productRefreshTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(30) };
        _productRefreshTimer.Tick += async (_, _) => await LoadDataAsync(background: true);
        _productRefreshTimer.Start();

        // Khi SearchQuery/SelectedCategory thay đổi → refresh filtered products
        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(SearchQuery) or nameof(SelectedCategory))
                OnPropertyChanged(nameof(FilteredProducts));
        };

        // Khi Cart thay đổi → refresh computed properties
        Cart.CollectionChanged += (_, _) =>
        {
            OnPropertyChanged(nameof(CartTotal));
            OnPropertyChanged(nameof(HasCartItems));
            OnPropertyChanged(nameof(IsDirty));
        };
    }

    public override async Task OnActivatedAsync(object? parameter = null)
    {
        if (parameter is Order order)
        {
            InitialOrder = order;
            _initialTableSnapshot = order.TableName;
            SelectedTable = order.TableName;
            SelectedTableId = order.TableId;
            SelectedAreaId = order.AreaId;
            OrderType = order.OrderType;
            LoadCartFromOrder(order);
        }
        else
        {
            _initialTableSnapshot = null;
        }

        await LoadDataAsync();
    }

    public override Task OnDeactivatedAsync()
    {
        _clock.Stop();
        _productRefreshTimer.Stop();
        return base.OnDeactivatedAsync();
    }

    // ---- Commands ----

    [RelayCommand]
    private void AddToCart(Product product)
    {
        var line = _cartService.AddOrMerge(Cart, product);
        SelectedLine = line;
        OnPropertyChanged(nameof(CartTotal));
        OnPropertyChanged(nameof(HasCartItems));
    }

    [RelayCommand]
    private void IncrementQty(CartLine line)
    {
        _cartService.IncrementQty(Cart, line.Id);
        SelectedLine = line;
        OnPropertyChanged(nameof(CartTotal));
    }

    [RelayCommand]
    private void DecrementQty(CartLine line)
    {
        _cartService.DecrementQty(Cart, line.Id);
        SelectedLine = line;
        OnPropertyChanged(nameof(CartTotal));
    }

    [RelayCommand]
    private void RemoveLine(CartLine line)
    {
        _cartService.RemoveLine(Cart, line.Id);
        OnPropertyChanged(nameof(CartTotal));
        OnPropertyChanged(nameof(HasCartItems));
    }

    [RelayCommand]
    private void ResetCart()
    {
        _cartService.Reset(Cart);
        SelectedTable = null;
        SelectedTableId = null;
        SelectedAreaId = null;
        OnPropertyChanged(nameof(CartTotal));
        OnPropertyChanged(nameof(HasCartItems));
    }

    [RelayCommand]
    private void Exit()
    {
        if (IsDirty && Cart.Count > 0)
            ShowUnsavedChangesModal = true;
        else
            _navigation.GoBack();
    }

    [RelayCommand]
    private async Task SaveOrderAsync()
    {
        if (Cart.Count == 0)
        {
            if (InitialOrder is not null) await DeleteOrderAsync();
            return;
        }

        if (string.IsNullOrEmpty(SelectedTable))
        {
            ShowTablePicker = true;
            return;
        }

        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            var payload = BuildPayload();

            if (InitialOrder?.Id > 0 && !IsTemp(InitialOrder.LocalId))
                await _cloudApi.UpdateOrderAsync(InitialOrder.Id, payload, token);
            else
                await _cloudApi.CreateOrderAsync(payload, token);

            _navigation.GoBack();
        }, "Lỗi lưu đơn");
    }

    [RelayCommand]
    private async Task CheckoutAsync()
    {
        if (!HasCartItems) return;
        // TODO: mở màn hình thanh toán
        Serilog.Log.Information("[Cashier] Checkout total: {Total:N0}₫", CartTotal);
    }

    [RelayCommand]
    private async Task DeleteOrderAsync()
    {
        if (InitialOrder is null || IsTemp(InitialOrder.LocalId)) return;
        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            await _cloudApi.DeleteOrderAsync(InitialOrder.Id, token);
            _navigation.GoBack();
        });
    }

    [RelayCommand]
    private void SelectCategory(Menu menu)
    {
        SelectedCategory = menu;
    }

    [RelayCommand]
    private void IncrementCustomers() => CustomerCount++;

    [RelayCommand]
    private void DecrementCustomers() => CustomerCount = Math.Max(1, CustomerCount - 1);

    [RelayCommand]
    private void SelectTable((string Name, int Id, int AreaId) t)
    {
        SelectedTable = t.Name;
        SelectedTableId = t.Id;
        SelectedAreaId = t.AreaId;
        ShowTablePicker = false;
    }

    [RelayCommand]
    private void DiscardAndExit()
    {
        ShowUnsavedChangesModal = false;
        _navigation.GoBack();
    }

    // ---- Data ----

    private async Task LoadDataAsync(bool background = false)
    {
        try
        {
            if (!background) LoadingProducts = true;
            var token = _config.GetAuthToken() ?? "";

            var menuData = await _cloudApi.FetchMenusAsync(token);
            var productData = await _cloudApi.FetchProductsAsync(token);

            await Dispatcher.UIThread.InvokeAsync(() =>
            {
                Menus.Clear();
                foreach (var m in menuData) Menus.Add(m);
                if (SelectedCategory is null && Menus.Count > 0)
                    SelectedCategory = Menus[0];

                Products.Clear();
                foreach (var p in productData) Products.Add(p);
                OnPropertyChanged(nameof(FilteredProducts));
            });
        }
        catch (Exception ex)
        {
            if (!background) SetError($"Không tải được dữ liệu: {ex.Message}");
            Serilog.Log.Warning(ex, "[Cashier] LoadData failed");
        }
        finally
        {
            if (!background) LoadingProducts = false;
        }
    }

    private void LoadCartFromOrder(Order order)
    {
        Cart.Clear();
        foreach (var item in order.Items)
        {
            Cart.Add(new CartLine
            {
                Id = item.Id?.ToString() ?? Guid.NewGuid().ToString(),
                Product = item.Product ?? new Product { Id = item.ProductId, Name = item.ProductName ?? "", Price = item.Price },
                Qty = item.Qty,
                IsTimeBased = item.IsTimeBased,
                StartTime = item.StartTime,
                EndTime = item.EndTime,
                Note = item.Note
            });
        }
        OnPropertyChanged(nameof(CartTotal));
        OnPropertyChanged(nameof(HasCartItems));
    }

    private CreateOrderPayload BuildPayload()
    {
        var match = System.Text.RegularExpressions.Regex.Match(SelectedTable ?? "", @"\d+");
        return new CreateOrderPayload
        {
            FrontendId = InitialOrder?.LocalId ?? Guid.NewGuid().ToString(),
            TableId = SelectedTableId,
            AreaId = SelectedAreaId,
            TableName = SelectedTable,
            TableNumber = match.Success ? int.Parse(match.Value) : 0,
            OrderType = OrderType == OrderType.DineIn ? "dine-in" : "takeaway",
            PaymentInfo = Cart.Any(l => l.IsTimeBased) ? "T.tiền theo giờ" : $"{CartTotal:N0}₫",
            CustomerCount = CustomerCount,
            CreatedAt = InitialOrder?.CreatedAt ?? DateTime.Now,
            Items = Cart.Select(l => new CreateOrderItemPayload
            {
                ProductId = l.Product.Id,
                Qty = l.Qty,
                Price = l.Product.Price,
                IsTimeBased = l.IsTimeBased,
                StartTime = l.StartTime,
                EndTime = l.EndTime,
                Note = l.Note
            }).ToList()
        };
    }

    private void UpdateClock()
    {
        var now = DateTime.Now;
        var h = now.Hour % 12; if (h == 0) h = 12;
        TimeText = $"{h}:{now.Minute:D2} {(now.Hour >= 12 ? "PM" : "AM")}";
        DateText = now.ToString("dd/MM/yyyy");
    }

    private static bool IsTemp(string? id) => string.IsNullOrEmpty(id) || id.StartsWith("order-");
}
