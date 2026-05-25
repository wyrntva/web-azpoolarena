using MyPos.Core.Business.Interfaces;
using Serilog;
using System.Speech.Synthesis;

namespace MyPos.Client.WPF.Services;

/// <summary>
/// TTS sử dụng Windows built-in Speech Synthesis.
/// Thay thế edge-tts Python CLI + mpv player trong Electron:
///   execFile('python3', ['-m', 'edge_tts', '--voice', voice, '--text', text])
///   spawn('mpv', ['--no-video', tmpFile])
/// 
/// Lợi điểm: Không cần Python, không cần mpv, hoạt động offline 100%.
/// Nếu muốn giọng đọc đẹp hơn → có thể dùng Azure Cognitive Speech SDK.
/// </summary>
public class WindowsTtsService : ITtsService, IDisposable
{
    private readonly SpeechSynthesizer _synth;
    private bool _disposed;

    public bool IsEnabled { get; set; } = true;

    public WindowsTtsService()
    {
        _synth = new SpeechSynthesizer();
        ConfigureVoice();
    }

    private void ConfigureVoice()
    {
        try
        {
            // Tìm giọng tiếng Việt nếu có cài
            var voices = _synth.GetInstalledVoices();
            var viVoice = voices.FirstOrDefault(v =>
                v.VoiceInfo.Name.Contains("vi", StringComparison.OrdinalIgnoreCase) ||
                v.VoiceInfo.Culture.Name.StartsWith("vi", StringComparison.OrdinalIgnoreCase));

            if (viVoice is not null)
            {
                _synth.SelectVoice(viVoice.VoiceInfo.Name);
                Log.Information("[TTS] Using voice: {Voice}", viVoice.VoiceInfo.Name);
            }
            else
            {
                // Fallback: giọng mặc định
                Log.Warning("[TTS] Vietnamese voice not found, using default. Install 'vi-VN' TTS voice in Windows Settings.");
            }

            _synth.Rate = -2;   // Chậm hơn một chút (tương đương --rate=-20% trong edge-tts)
            _synth.Volume = 100;
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "[TTS] Failed to configure voice");
        }
    }

    /// <summary>
    /// Phát text qua loa.
    /// Tương đương ttsGenerateAndPlay() trong electron/main/index.ts.
    /// </summary>
    public async Task SpeakAsync(string text, int repeat = 1, CancellationToken ct = default)
    {
        if (!IsEnabled || string.IsNullOrWhiteSpace(text)) return;

        try
        {
            // Tương đương: parts.join(' ... ') trong Electron
            repeat = Math.Min(repeat, 5);
            var fullText = string.Join(" ... ", Enumerable.Repeat(text, repeat));

            Log.Information("[TTS] 🔊 \"{Text}\"", fullText);

            await Task.Run(() =>
            {
                if (!ct.IsCancellationRequested)
                    _synth.Speak(fullText);
            }, ct);

            Log.Information("[TTS] ✅ Done");
        }
        catch (OperationCanceledException)
        {
            _synth.SpeakAsyncCancelAll();
        }
        catch (Exception ex)
        {
            Log.Error(ex, "[TTS] Error speaking text");
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _synth.Dispose();
            _disposed = true;
        }
    }
}
