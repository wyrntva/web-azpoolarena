#!/bin/bash
# ============================================================
# launch_gui.sh
# Chạy script này từ Terminal trong Desktop (GNOME/KDE/XFCE)
# KHÔNG chạy từ SSH thuần tty
# ============================================================

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "=== PoolArena POS — Avalonia UI ==="
echo ""
echo "DISPLAY=$DISPLAY"
echo "WAYLAND_DISPLAY=$WAYLAND_DISPLAY"
echo ""

# Kiểm tra .NET
if ! command -v dotnet &>/dev/null; then
    echo "❌ .NET chưa cài: sudo apt install dotnet-sdk-8.0"
    exit 1
fi

# Chạy app
dotnet run --project MyPos.Client.Avalonia/MyPos.Client.Avalonia.csproj -c Debug
