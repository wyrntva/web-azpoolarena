#!/bin/bash
# =============================================================
# setup_dotnet_linux.sh
# Cài .NET 8 SDK + tạo project test cho PoolArena POS trên Ubuntu
# Chạy: bash setup_dotnet_linux.sh
# =============================================================

set -e
echo "=== PoolArena POS — .NET Linux Setup ==="
echo ""

# ---- 1. Cài .NET 8 SDK ----
echo "[1/4] Cài .NET 8 SDK..."
sudo apt-get update -q
sudo apt-get install -y dotnet-sdk-8.0

echo ""
echo "[✓] .NET version: $(dotnet --version)"

# ---- 2. Cài libgdiplus (cần cho một số thư viện .NET graphics) ----
echo ""
echo "[2/4] Cài dependencies..."
sudo apt-get install -y libgdiplus sqlite3

# ---- 3. Restore packages cho các non-WPF projects ----
echo ""
echo "[3/4] Restore NuGet packages..."
PROJ_DIR="$(dirname "$0")/MyPos.WPF"

# Chỉ restore các project chạy được trên Linux (không có -windows)
dotnet restore "$PROJ_DIR/MyPos.Core.Business/MyPos.Core.Business.csproj" && echo "  ✓ Core.Business"
dotnet restore "$PROJ_DIR/MyPos.Data.Repository/MyPos.Data.Repository.csproj" && echo "  ✓ Data.Repository"
dotnet restore "$PROJ_DIR/MyPos.SyncService/MyPos.SyncService.csproj" && echo "  ✓ SyncService"

# ---- 4. Build non-WPF projects ----
echo ""
echo "[4/4] Build..."
dotnet build "$PROJ_DIR/MyPos.Core.Business/MyPos.Core.Business.csproj" -c Debug && echo "  ✓ Core.Business built"
dotnet build "$PROJ_DIR/MyPos.Data.Repository/MyPos.Data.Repository.csproj" -c Debug && echo "  ✓ Data.Repository built"
dotnet build "$PROJ_DIR/MyPos.SyncService/MyPos.SyncService.csproj" -c Debug && echo "  ✓ SyncService built"

echo ""
echo "======================================"
echo "✅ Setup xong! Chạy tests bằng:"
echo "   bash run_tests.sh"
echo ""
echo "⚠️  WPF UI (MyPos.Client.WPF) chỉ build được trên Windows."
echo "   Để test UI: xem hướng dẫn bên dưới."
echo "======================================"
