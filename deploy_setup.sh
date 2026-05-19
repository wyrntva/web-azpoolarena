#!/bin/bash
# ============================================================
# AZ POOLARENA — Deploy Script cho aaPanel Server
# Chạy script này trong Terminal của aaPanel
# Server: 103.90.225.8 | DB: poolarena
# ============================================================

set -e  # Dừng nếu có lỗi

echo "🚀 Bắt đầu deploy AZ PoolArena..."

# ── Cấu hình ──────────────────────────────────────────────
DEPLOY_DIR="/www/wwwroot/azpoolarena"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
DB_USER="poolarena"
DB_PASS="ysH63sy6"
DB_NAME="poolarena"
DOMAIN="cms.poolarena.vn"

# ── Bước 1: Tạo thư mục ───────────────────────────────────
echo "📁 Tạo thư mục..."
mkdir -p $DEPLOY_DIR

# ── Bước 2: Cài Node.js nếu chưa có ──────────────────────
echo "📦 Kiểm tra Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node version: $(node -v)"

# ── Bước 3: Cài PM2 ───────────────────────────────────────
echo "📦 Cài PM2..."
npm install -g pm2 2>/dev/null || true

# ── Bước 4: Cài Mosquitto MQTT ────────────────────────────
echo "📡 Kiểm tra Mosquitto..."
if ! command -v mosquitto &> /dev/null; then
    apt-get install -y mosquitto mosquitto-clients
    systemctl enable mosquitto
    systemctl start mosquitto
    echo "✅ Mosquitto đã cài"
else
    echo "✅ Mosquitto đã có sẵn"
fi

echo ""
echo "✅ Môi trường đã sẵn sàng!"
echo ""
echo "📌 Tiếp theo: Upload code vào $DEPLOY_DIR"
echo "   Sau đó chạy: bash $DEPLOY_DIR/deploy_app.sh"
