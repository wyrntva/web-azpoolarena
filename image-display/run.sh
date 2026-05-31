#!/bin/bash

# ====== AZ Pool Arena - Image Display Runner ======
# Hỗ trợ: Cooca, Samsung, LG, và các loại TV khác
# Dùng --force-software nếu TV không hiển thị được ảnh

# Di chuyển vào thư mục chứa script
cd "$(dirname "$0")"

# Tự động thiết lập DISPLAY nếu chưa có
if [ -z "$DISPLAY" ]; then
    export DISPLAY=:0
    echo "Đã tự động thiết lập DISPLAY=:0"
fi

# Tự động tìm XAUTHORITY từ process Xwayland hoặc Xorg nếu chưa có
if [ -z "$XAUTHORITY" ] || [ ! -f "$XAUTHORITY" ]; then
    # Thử tìm auth file từ process Xwayland
    DETECTED_AUTH=$(ps aux | grep Xwayland | grep -v grep | grep -o '\-auth [^ ]*' | awk '{print $2}' | head -n 1)
    
    if [ -z "$DETECTED_AUTH" ]; then
        # Thử tìm từ Xorg
        DETECTED_AUTH=$(ps aux | grep Xorg | grep -v grep | grep -o '\-auth [^ ]*' | awk '{print $2}' | head -n 1)
    fi

    if [ -n "$DETECTED_AUTH" ]; then
        export XAUTHORITY="$DETECTED_AUTH"
        echo "Đã tự động thiết lập XAUTHORITY=$XAUTHORITY"
    else
        echo "Cảnh báo: Không tìm thấy file XAUTHORITY. Ứng dụng có thể không hiển thị được."
        echo "Thử chạy lệnh: 'xhost +' trên terminal chính của máy nếu gặp lỗi."
    fi
fi

VENV_DIR="venv"

# Kiểm tra và tạo virtual environment nếu chưa có
if [ ! -d "$VENV_DIR" ]; then
    echo "Đang tạo môi trường ảo (virtual environment) với system-site-packages..."
    python3 -m venv --system-site-packages "$VENV_DIR"
    
    # Kiểm tra nếu tạo venv thất bại
    if [ ! -d "$VENV_DIR" ]; then
        echo "Lỗi: Không thể tạo virtual environment. Hãy đảm bảo bạn đã cài đặt python3-venv."
        echo "Thử chạy: sudo apt install python3-venv (trên Ubuntu/Debian)"
        exit 1
    fi
fi

# Kích hoạt môi trường ảo
source "$VENV_DIR/bin/activate"

# Cài đặt các thư viện cần thiết
if [ -f "requirements.txt" ]; then
    # Chỉ cài đặt nếu có thay đổi hoặc cài lần đầu
    pip install -r requirements.txt > /dev/null
fi

# ====== Thiết lập tương thích GPU/Rendering cho nhiều loại TV ======

# Tắt threaded render loop — nguyên nhân phổ biến gây blank screen trên Samsung TV
export QSG_RENDER_LOOP=basic

# Tắt VSync để tránh treo frame trên một số HDMI output
export QT_QPA_UPDATE_IDLE_TIME=0

# Cho phép chuyển sang software rendering nếu cần
if [[ "$*" == *"--force-software"* ]]; then
    echo "[!] Chế độ Software Rendering (dùng cho TV không tương thích GPU)"
    export QT_QUICK_BACKEND=software
    export LIBGL_ALWAYS_SOFTWARE=1
    # Loại bỏ flag --force-software khỏi tham số truyền vào main.py
    ARGS=$(echo "$@" | sed 's/--force-software//')
else
    ARGS="$@"
fi

# In thông tin debug
echo "======================================"
echo "Đang khởi chạy ứng dụng..."
echo "DISPLAY=$DISPLAY"
echo "QT_QPA_PLATFORM=${QT_QPA_PLATFORM:-auto}"
echo "QSG_RENDER_LOOP=$QSG_RENDER_LOOP"
echo "QT_QUICK_BACKEND=${QT_QUICK_BACKEND:-default (hardware)}"

# Hiển thị resolution màn hình hiện tại (nếu có xrandr)
if command -v xrandr &> /dev/null; then
    SCREEN_RES=$(xrandr 2>/dev/null | grep '\*' | awk '{print $1}' | head -1)
    echo "Screen Resolution: ${SCREEN_RES:-unknown}"
fi
echo "======================================"

python main.py $ARGS
