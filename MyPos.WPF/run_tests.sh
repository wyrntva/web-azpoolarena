#!/bin/bash
# =============================================================
# run_tests.sh — Chạy toàn bộ unit tests trên Ubuntu
# =============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_PROJ="$SCRIPT_DIR/MyPos.Tests/MyPos.Tests.csproj"

echo "======================================"
echo "  PoolArena POS — Unit Tests (Linux)"
echo "======================================"
echo ""

# Kiểm tra .NET đã cài chưa
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK chưa được cài. Chạy trước: bash setup_dotnet_linux.sh"
    exit 1
fi

echo "✓ .NET version: $(dotnet --version)"
echo ""

# Restore + Run tests với output chi tiết
dotnet test "$TEST_PROJ" \
    --verbosity normal \
    --logger "console;verbosity=detailed" \
    --configuration Debug

echo ""
echo "======================================"
echo "✅ Xong! Xem kết quả bên trên."
echo "======================================"
