using MyPos.Client.WPF.ViewModels;
using MyPos.Core.Business.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace MyPos.Client.WPF.Services;

/// <summary>
/// Navigation service — thay thế useState<Screen> trong App.tsx.
/// Điều hướng giữa các ViewModel bằng cách set ShellViewModel.CurrentViewModel.
/// 
/// Pattern: Shell (Window) → ContentControl bound to CurrentViewModel
///          → DataTemplate selector chọn View tương ứng.
/// </summary>
public class NavigationService : INavigationService
{
    private readonly IServiceProvider _serviceProvider;
    private ShellViewModel? _shell;
    private readonly Stack<BaseViewModel> _history = new();

    public string CurrentView => _shell?.CurrentViewModel?.GetType().Name ?? "";

    public NavigationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    /// <summary>
    /// Phải được gọi sau khi ShellViewModel được tạo ra để tránh circular dependency
    /// </summary>
    public void Initialize(ShellViewModel shell) => _shell = shell;

    public void NavigateTo<TViewModel>() where TViewModel : class
    {
        NavigateTo<TViewModel>(null!);
    }

    public void NavigateTo<TViewModel>(object parameter) where TViewModel : class
    {
        if (_shell is null) return;

        var vm = _serviceProvider.GetRequiredService<TViewModel>() as BaseViewModel
                 ?? throw new InvalidOperationException($"{typeof(TViewModel).Name} is not a BaseViewModel");

        // Save current for back navigation
        if (_shell.CurrentViewModel is not null)
            _history.Push(_shell.CurrentViewModel);

        _shell.CurrentViewModel = vm;
        _ = vm.OnActivatedAsync(parameter);
    }

    public void GoBack()
    {
        if (_shell is null) return;

        _ = _shell.CurrentViewModel?.OnDeactivatedAsync();

        if (_history.TryPop(out var prev))
            _shell.CurrentViewModel = prev;
    }
}
