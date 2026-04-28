using Avalonia.Threading;  // ← Thay System.Windows.Threading
using CommunityToolkit.Mvvm.ComponentModel;

namespace MyPos.Client.Avalonia.ViewModels;

/// <summary>
/// BaseViewModel cho Avalonia — giống WPF, chỉ khác namespace DispatcherTimer.
/// CommunityToolkit.Mvvm hoạt động giống hệt trên cả WPF lẫn Avalonia.
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
        set
        {
            SetProperty(ref _errorMessage, value);
            OnPropertyChanged(nameof(HasError));
        }
    }

    public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

    protected void SetError(string message) => ErrorMessage = message;
    protected void ClearError() => ErrorMessage = null;

    /// <summary>
    /// Run async với IsBusy + error handling tự động.
    /// Giống WPF version nhưng tương thích Avalonia UI thread.
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
    /// Cập nhật UI từ background thread (thay App.Current.Dispatcher.Invoke)
    /// Avalonia: Dispatcher.UIThread.InvokeAsync()
    /// </summary>
    protected static Task InvokeOnUiThread(Action action)
        => Dispatcher.UIThread.InvokeAsync(action).GetTask();

    public virtual Task OnActivatedAsync(object? parameter = null) => Task.CompletedTask;
    public virtual Task OnDeactivatedAsync() => Task.CompletedTask;
}
