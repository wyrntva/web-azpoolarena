using CommunityToolkit.Mvvm.ComponentModel;

namespace MyPos.Client.WPF.ViewModels;

/// <summary>
/// ViewModel gốc — tất cả ViewModels kế thừa từ đây.
/// CommunityToolkit.Mvvm cung cấp:
///   - ObservableObject → INotifyPropertyChanged (tương đương React useState)
///   - [ObservableProperty] → auto-generate property + notification
///   - [RelayCommand] → auto-generate ICommand (tương đương onClick handlers)
/// </summary>
public abstract class BaseViewModel : ObservableObject
{
    private bool _isBusy;
    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }

    private string? _errorMessage;
    public string? ErrorMessage
    {
        get => _errorMessage;
        set => SetProperty(ref _errorMessage, value);
    }

    public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

    protected void SetError(string message)
    {
        ErrorMessage = message;
        OnPropertyChanged(nameof(HasError));
    }

    protected void ClearError()
    {
        ErrorMessage = null;
        OnPropertyChanged(nameof(HasError));
    }

    /// <summary>
    /// Chạy async task với try/catch + IsBusy flag tự động.
    /// Tương đương async useEffect pattern trong React.
    /// </summary>
    protected async Task RunSafeAsync(Func<Task> action, string? errorPrefix = null)
    {
        try
        {
            IsBusy = true;
            ClearError();
            await action();
        }
        catch (Exception ex)
        {
            var msg = $"{errorPrefix ?? "Lỗi"}: {ex.Message}";
            SetError(msg);
            Serilog.Log.Error(ex, "[ViewModel] {Error}", msg);
        }
        finally
        {
            IsBusy = false;
        }
    }

    /// <summary>
    /// Gọi khi ViewModel được navigate tới
    /// </summary>
    public virtual Task OnActivatedAsync(object? parameter = null) => Task.CompletedTask;

    /// <summary>
    /// Gọi khi navigate rời khỏi ViewModel
    /// </summary>
    public virtual Task OnDeactivatedAsync() => Task.CompletedTask;
}
