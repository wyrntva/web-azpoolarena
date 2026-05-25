#!/bin/bash

# Di chuyển vào thư mục chứa script
cd "$(dirname "$0")"

# Tự động tìm XAUTHORITY chính xác
if [ -z "$XAUTHORITY" ] || [ ! -f "$XAUTHORITY" ]; then
    DETECTED_AUTH=$(ps aux | grep Xwayland | grep -v grep | grep -o '\-auth [^ ]*' | awk '{print $2}' | head -n 1)
    if [ -z "$DETECTED_AUTH" ]; then
        DETECTED_AUTH=$(ps aux | grep Xorg | grep -v grep | grep -o '\-auth [^ ]*' | awk '{print $2}' | head -n 1)
    fi
    if [ -n "$DETECTED_AUTH" ]; then
        export XAUTHORITY="$DETECTED_AUTH"
    fi
fi

# Nếu vẫn không có DISPLAY, mặc định là :0
if [ -z "$DISPLAY" ]; then
    export DISPLAY=:0
fi

# Cấp quyền cho docker kết nối tới X Server (quan trọng)
xhost +local:docker 2>/dev/null

echo "Khởi chạy Docker container..."
echo "DISPLAY=$DISPLAY"
echo "XAUTHORITY=$XAUTHORITY"

# Chạy docker compose với biến môi trường hiện tại
docker compose up --build -d
