using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MyPos.Core.Business.Interfaces;
using MyPos.Core.Business.Models;
using MyPos.Core.Business.Models.Enums;
using MyPos.SyncService.Clients;
using System.Collections.ObjectModel;
using System.Windows.Threading;

namespace MyPos.Client.WPF.ViewModels;

/// <summary>
/// ViewModel cho CashierView — màn hình thu ngân chính.
/// Tương đương CashierScreen.tsx (743 dòng) → được tách gọn nhờ MVVM + DI.
/// 
/// Binding với CashierView.xaml qua DataContext
/// </summary>
public partial class CashierViewModel : BaseViewModel
{
    private readonly ICartService _cartService;
    private readonly ITimeBasedPricingService _pricing;
    private readonly CloudApiClient _cloudApi;
    private readonly ISecureConfigService _config;
    private readonly INavigationService _navigation;

    // ============================================
    // OBSERVABLE PROPERTIES
    // Tương đương useState() hooks trong CashierScreen.tsx
    // ============================================

    // --- Search & Menu ---
    [ObservableProperty] private string _searchQuery = string.Empty;
    [ObservableProperty] private ObservableCollection<Menu> _menus = new();
    [ObservableProperty] private ObservableCollection<Product> _products = new();
    [ObservableProperty] private Menu? _selectedCategory;
    [ObservableProperty] private bool _loadingMenus;
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

    // --- Modal visibility ---
    [ObservableProperty] private bool _showTablePicker;
    [ObservableProperty] private bool _showTimeEditModal;
    [ObservableProperty] private bool _showUnsavedChangesModal;
    [ObservableProperty] private bool _showMoreMenu;
    [ObservableProperty] private CartLine? _editingLine;

    // --- Clock (thay setInterval clock) ---
    private readonly DispatcherTimer _clock;
    [ObservableProperty] private string _timeText = string.Empty;
    [ObservableProperty] private string _dateText = string.Empty;

    // --- Reload timer (products mỗi 30s) ---
    private readonly DispatcherTimer _productRefreshTimer;

    // --- Initial order (khi edit existing order) ---
    public Order? InitialOrder { get; set; }
    private string? _initialTable;

    // ============================================
    // COMPUTED PROPERTIES
    // Tương đương useMemo() trong React
    // ============================================

    public decimal CartTotal => _cartService.CalculateTotal(Cart, DateTime.Now);
    public bool HasCartItems => Cart.Count > 0;

    public IEnumerable<Product> FilteredProducts
    {
        get
        {
            var source = SelectedCategory?.ProductIds?.Count > 0
                ? Products.Where(p => SelectedCategory.ProductIds.Contains(p.Id))
                : Products;

            var query = SearchQuery.Trim().ToLower();
            if (!string.IsNullOrEmpty(query))
                source = source.Where(p => p.Name.ToLower().Contains(query)
                                        || (p.Barcode ?? "").Contains(query));
            return source;
        }
    }

    public bool IsDirty
    {
        get
        {
            if (InitialOrder is null) return Cart.Count > 0;
            return SelectedTable != _initialTable || Cart.Count != InitialOrder.Items.Count;
        }
    }

    public string UserName => _config.GetUserJson() is string json
        ? System.Text.Json.JsonDocument.Parse(json).RootElement
            .GetProperty("full_name").GetString() ?? "Nhân viên POS"
        : "Nhân viên POS";

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

        // Clock timer — tương đương setInterval(setNow, 1000)
        _clock = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _clock.Tick += OnClockTick;
        _clock.Start();
        UpdateClock();

        // Product refresh mỗi 30 giây
        _productRefreshTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(30) };
        _productRefreshTimer.Tick += async (_, _) => await LoadMenusAndProductsAsync(background: true);
        _productRefreshTimer.Start();

        // Khi SearchQuery thay đổi → notify FilteredProducts
        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(SearchQuery) or nameof(SelectedCategory))
                OnPropertyChanged(nameof(FilteredProducts));
        };

        // Khi Cart thay đổi → notify total
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
            _initialTable = order.TableName;
            SelectedTable = order.TableName;
            SelectedTableId = order.TableId;
            SelectedAreaId = order.AreaId;
            OrderType = order.OrderType;

            // Load cart từ existing order items (merge time-based)
            LoadCartFromOrder(order);
        }

        await LoadMenusAndProductsAsync();
    }

    public override Task OnDeactivatedAsync()
    {
        _clock.Stop();
        _productRefreshTimer.Stop();
        return base.OnDeactivatedAsync();
    }

    // ============================================
    // COMMANDS — tương đương event handlers trong CashierScreen.tsx
    // ============================================

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
        ShowMoreMenu = false;
        OnPropertyChanged(nameof(CartTotal));
        OnPropertyChanged(nameof(HasCartItems));
    }

    [RelayCommand]
    private void Exit()
    {
        // Tương đương handleExit() trong CashierScreen.tsx
        if (IsDirty)
            ShowUnsavedChangesModal = true;
        else
            _navigation.GoBack();
    }

    [RelayCommand]
    private async Task SaveOrderAsync()
    {
        // Tương đương handleSaveOrder() trong CashierScreen.tsx
        if (Cart.Count == 0)
        {
            if (InitialOrder is not null)
                await DeleteOrderAsync();
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
            var payload = BuildOrderPayload();

            if (InitialOrder?.Id > 0 && !IsTemporaryId(InitialOrder.LocalId))
                await _cloudApi.UpdateOrderAsync(InitialOrder.Id, payload, token);
            else
                await _cloudApi.CreateOrderAsync(payload, token);

            _navigation.GoBack();
        }, "Lỗi lưu đơn hàng");
    }

    [RelayCommand]
    private async Task ConfirmScoreboardAsync()
    {
        if (InitialOrder is null) return;
        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            await _cloudApi.ConfirmScoreboardOrderAsync(InitialOrder.Id, token);
            _navigation.GoBack();
        }, "Lỗi xác nhận Scoreboard");
    }

    [RelayCommand]
    private async Task DeleteOrderAsync()
    {
        if (InitialOrder is null || IsTemporaryId(InitialOrder.LocalId)) return;
        await RunSafeAsync(async () =>
        {
            var token = _config.GetAuthToken() ?? throw new Exception("Chưa đăng nhập");
            await _cloudApi.DeleteOrderAsync(InitialOrder.Id, token);
            _navigation.GoBack();
        }, "Lỗi xóa đơn");
    }

    [RelayCommand]
    private void OpenTimeEdit(CartLine line)
    {
        EditingLine = line;
        ShowTimeEditModal = true;
    }

    [RelayCommand]
    private void SaveTimeEdit((string LineId, DateTime? Start, DateTime? End, string? Note) update)
    {
        var line = Cart.FirstOrDefault(l => l.Id == update.LineId);
        if (line is null) return;
        line.StartTime = update.Start;
        line.EndTime = update.End;
        line.Note = update.Note;
        ShowTimeEditModal = false;
        EditingLine = null;
        OnPropertyChanged(nameof(CartTotal));
    }

    [RelayCommand]
    private void SelectTable((string Name, int Id, int AreaId) table)
    {
        SelectedTable = table.Name;
        SelectedTableId = table.Id;
        SelectedAreaId = table.AreaId;
        ShowTablePicker = false;
    }

    [RelayCommand]
    private void IncrementCustomers() => CustomerCount++;

    [RelayCommand]
    private void DecrementCustomers() => CustomerCount = Math.Max(1, CustomerCount - 1);

    // ============================================
    // DATA LOADING
    // ============================================

    private async Task LoadMenusAndProductsAsync(bool background = false)
    {
        try
        {
            if (!background) LoadingMenus = true;
            var token = _config.GetAuthToken() ?? "";
            var menuData = await _cloudApi.FetchMenusAsync(token);

            App.Current.Dispatcher.Invoke(() =>
            {
                Menus.Clear();
                foreach (var m in menuData) Menus.Add(m);
                if (SelectedCategory is null && Menus.Count > 0)
                    SelectedCategory = Menus[0];
                OnPropertyChanged(nameof(FilteredProducts));
            });
        }
        catch (Exception ex)
        {
            Serilog.Log.Warning(ex, "[Cashier] Failed to load menus");
        }
        finally
        {
            if (!background) LoadingMenus = false;
        }

        try
        {
            if (!background) LoadingProducts = true;
            var token = _config.GetAuthToken() ?? "";
            var productData = await _cloudApi.FetchProductsAsync(token);

            App.Current.Dispatcher.Invoke(() =>
            {
                Products.Clear();
                foreach (var p in productData) Products.Add(p);
                OnPropertyChanged(nameof(FilteredProducts));
            });
        }
        catch (Exception ex)
        {
            Serilog.Log.Warning(ex, "[Cashier] Failed to load products");
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

    private CreateOrderPayload BuildOrderPayload()
    {
        var tableMatch = System.Text.RegularExpressions.Regex.Match(SelectedTable ?? "", @"\d+");
        var tableNumber = tableMatch.Success ? int.Parse(tableMatch.Value) : 0;
        var hasTimeBased = Cart.Any(l => l.IsTimeBased);

        return new CreateOrderPayload
        {
            FrontendId = InitialOrder?.LocalId ?? Guid.NewGuid().ToString(),
            TableId = SelectedTableId,
            AreaId = SelectedAreaId,
            TableName = SelectedTable,
            TableNumber = tableNumber,
            OrderType = OrderType == OrderType.DineIn ? "dine-in" : "takeaway",
            PaymentInfo = hasTimeBased ? "T.tiền theo giờ" : $"{CartTotal:N0}₫",
            CustomerCount = CustomerCount,
            Status = "dine-in",
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

    // ============================================
    // HELPERS
    // ============================================

    private void OnClockTick(object? sender, EventArgs e) => UpdateClock();

    private void UpdateClock()
    {
        var now = DateTime.Now;
        var h12 = now.Hour % 12; if (h12 == 0) h12 = 12;
        TimeText = $"{h12}:{now.Minute:D2} {(now.Hour >= 12 ? "PM" : "AM")}";
        DateText = now.ToString("dd/MM/yyyy");
        OnPropertyChanged(nameof(CartTotal)); // Realtime time-based price update
    }

    private static bool IsTemporaryId(string? localId) =>
        string.IsNullOrEmpty(localId) || localId.StartsWith("order-");
}
