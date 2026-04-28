#!/bin/bash

# ====== Jarvis AI — AZ Pool Arena Runner ======
# Khởi chạy Jarvis web server với Gemini AI

cd "$(dirname "$0")"

VENV_DIR="venv"

# Kiểm tra và tạo virtual environment nếu chưa có
if [ ! -d "$VENV_DIR" ]; then
    echo "🤖 Jarvis: Đang thiết lập môi trường..."
    python3 -m venv "$VENV_DIR"
    
    if [ ! -d "$VENV_DIR" ]; then
        echo "❌ Lỗi: Không thể tạo virtual environment."
        echo "Thử chạy: sudo apt install python3-venv"
        exit 1
    fi
fi

# Kích hoạt môi trường ảo
source "$VENV_DIR/bin/activate"

# Cài đặt các thư viện cần thiết
if [ -f "requirements.txt" ]; then
    echo "📦 Kiểm tra dependencies..."
    pip install -r requirements.txt -q
fi

# Load .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

PORT="${JARVIS_PORT:-8899}"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     🤖 JARVIS AI — AZ Pool Arena        ║"
echo "║     Quản gia trí tuệ nhân tạo           ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Web UI: http://localhost:$PORT          ║"
echo "║  API:    http://localhost:$PORT/api      ║"
echo "║  Health: http://localhost:$PORT/api/health║"
echo "╚══════════════════════════════════════════╝"
echo ""

python -m uvicorn server:app --host 0.0.0.0 --port "$PORT" --reload
