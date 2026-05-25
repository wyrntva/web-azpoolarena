#!/bin/bash
# =============================================================
# run_pos.sh — Khởi động PoolArena POS (Avalonia) trên Ubuntu
# =============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ="$SCRIPT_DIR/MyPos.Client.Avalonia/MyPos.Client.Avalonia.csproj"

echo "======================================"
echo "  🎱 PoolArena POS — Avalonia Linux"
echo "======================================"

# ---- Kiểm tra .NET ----
if ! command -v dotnet &>/dev/null; then
    echo ""
    echo "❌ .NET SDK chưa được cài. Chạy:"
    echo "   sudo apt-get install -y dotnet-sdk-8.0"
    exit 1
fi
echo "✓ .NET: $(dotnet --version)"

# ---- Kiểm tra display (cần DISPLAY hoặc Wayland) ----
if [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
    echo ""
    echo "⚠️  Không có display! Các lựa chọn:"
    echo ""
    echo "  [A] SSH với X11 forwarding (từ máy local có GUI):"
    echo "      ssh -X user@$(hostname -I | awk '{print $1}') 'cd $(pwd) && bash run_pos.sh'"
    echo ""
    echo "  [B] Mở VNC Server trên Ubuntu:"
    echo "      sudo apt install tigervnc-standalone-server"
    echo "      vncserver :1 -geometry 1280x800"
    echo "      export DISPLAY=:1"
    echo "      bash run_pos.sh"
    echo ""
    echo "  [C] Chạy trên máy local có GUI (Ubuntu Desktop):"
    echo "      Không cần X11 forwarding, chạy trực tiếp."
    echo ""

    read -p "Bạn muốn thử với DISPLAY=:0 không? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        export DISPLAY=:0
        echo "✓ DISPLAY set to :0"
    else
        exit 0
    fi
fi

# ---- Cài espeak-ng nếu chưa có (TTS) ----
if ! command -v espeak-ng &>/dev/null; then
    echo ""
    echo "ℹ️  espeak-ng chưa cài (TTS sẽ tắt)."
    echo "    Để bật TTS: sudo apt install espeak-ng"
fi

# ---- Restore packages (lần đầu) ----
echo ""
echo "📦 Restoring NuGet packages..."
dotnet restore "$PROJ" --verbosity quiet

# ---- Build ----
echo "🔨 Building..."
dotnet build "$PROJ" -c Debug --verbosity quiet

# ---- Run ----
echo ""
echo "🚀 Launching POS UI..."
echo "   (Nhấn Ctrl+C để thoát)"
echo ""
dotnet run --project "$PROJ" -c Debug
