using MyPos.Client.Avalonia.ViewModels;
using MyPos.Core.Business.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace MyPos.Client.Avalonia.Services;

public class NavigationService : INavigationService
{
    private readonly IServiceProvider _sp;
    private ShellViewModel? _shell;
    private readonly Stack<BaseViewModel> _history = new();

    public string CurrentView => _shell?.CurrentViewModel?.GetType().Name ?? "";

    public NavigationService(IServiceProvider sp) => _sp = sp;

    public void Initialize(ShellViewModel shell) => _shell = shell;

    public void NavigateTo<TViewModel>() where TViewModel : class
        => NavigateTo<TViewModel>(null!);

    public void NavigateTo<TViewModel>(object parameter) where TViewModel : class
    {
        if (_shell is null) return;
        var vm = _sp.GetRequiredService<TViewModel>() as BaseViewModel
                 ?? throw new InvalidOperationException($"{typeof(TViewModel).Name} is not BaseViewModel");

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
