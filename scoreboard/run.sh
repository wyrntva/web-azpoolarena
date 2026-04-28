#!/bin/bash
# =============================================================================
# run_app.sh - Chạy GUI app từ SSH, hiển thị trên màn hình Ubuntu local
# =============================================================================

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SCRIPT="app.py"
VENV_PATH="$APP_DIR/venv"
LOG_FILE="$APP_DIR/app.log"

# -----------------------------------------------------------------------------
# 1. Xác định user đang login vào desktop (không phải user SSH)
# -----------------------------------------------------------------------------
get_desktop_user() {
    # Tìm user đang có graphical session
    who | grep -E '\(:0\)|\(tty[0-9]\)' | head -1 | awk '{print $1}'
}

DESKTOP_USER="${DESKTOP_USER:-$(get_desktop_user)}"
if [ -z "$DESKTOP_USER" ]; then
    DESKTOP_USER="$USER"
fi

# -----------------------------------------------------------------------------
# 2. Lấy thông tin DISPLAY và XAUTHORITY từ desktop session
# -----------------------------------------------------------------------------
get_display_env() {
    local user="$1"

    # Thử lấy từ systemd user session
    local uid=$(id -u "$user" 2>/dev/null || echo "")

    if [ -n "$uid" ] && [ -d "/run/user/$uid" ]; then
        # Wayland session
        if [ -S "/run/user/$uid/wayland-0" ]; then
            echo "SESSION_TYPE=wayland"
            echo "WAYLAND_DISPLAY=wayland-0"
            echo "XDG_RUNTIME_DIR=/run/user/$uid"
            return 0
        fi
    fi

    # X11 session - tìm DISPLAY từ process của user
    local display=$(pgrep -u "$user" -a 2>/dev/null | grep -oP 'DISPLAY=:\d+' | head -1 | cut -d= -f2)
    if [ -z "$display" ]; then
        # Fallback: kiểm tra các display phổ biến
        for d in :0 :1 :10; do
            if DISPLAY=$d xdpyinfo >/dev/null 2>&1; then
                display=$d
                break
            fi
        done
    fi
    display="${display:-:0}"

    # Tìm XAUTHORITY
    local xauth=""
    if [ -f "/home/$user/.Xauthority" ]; then
        xauth="/home/$user/.Xauthority"
    elif [ -f "/run/user/$uid/gdm/Xauthority" ]; then
        xauth="/run/user/$uid/gdm/Xauthority"
    elif [ -f "/tmp/.X0-lock" ]; then
        xauth="/home/$user/.Xauthority"
    fi

    echo "SESSION_TYPE=x11"
    echo "DISPLAY=$display"
    [ -n "$xauth" ] && echo "XAUTHORITY=$xauth"
    [ -n "$uid" ] && echo "XDG_RUNTIME_DIR=/run/user/$uid"
}

# -----------------------------------------------------------------------------
# 3. Export environment variables
# -----------------------------------------------------------------------------
echo "=== Detecting display environment for user: $DESKTOP_USER ==="

eval "$(get_display_env "$DESKTOP_USER")"

export DISPLAY="${DISPLAY:-:0}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u $DESKTOP_USER)}"

if [ "$SESSION_TYPE" = "wayland" ]; then
    export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
    # Force correct platform for Wayland (avoid stale QT_QPA_PLATFORM=xcb from shell env)
    export QT_QPA_PLATFORM="wayland"
    # Ensure XWayland auth is available for any XCB fallback (QtMultimedia/FFmpeg)
    if [ -z "${XAUTHORITY:-}" ]; then
        xauth_file=$(ls -t "/run/user/$(id -u $DESKTOP_USER)"/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
        if [ -n "$xauth_file" ]; then
            export XAUTHORITY="$xauth_file"
        fi
    fi
    echo "Wayland session detected"
    echo "  WAYLAND_DISPLAY=$WAYLAND_DISPLAY"
    [ -n "${XAUTHORITY:-}" ] && echo "  XAUTHORITY=$XAUTHORITY"
else
    export XAUTHORITY="${XAUTHORITY:-/home/$DESKTOP_USER/.Xauthority}"
    # Force correct platform for X11
    export QT_QPA_PLATFORM="xcb"
    echo "X11 session detected"
    echo "  DISPLAY=$DISPLAY"
    echo "  XAUTHORITY=$XAUTHORITY"
fi

echo "  XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR"

# -----------------------------------------------------------------------------
# 4. Kiểm tra kết nối display
# -----------------------------------------------------------------------------
check_display() {
    if [ "$SESSION_TYPE" = "wayland" ]; then
        [ -S "$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY" ]
    else
        xdpyinfo >/dev/null 2>&1
    fi
}

if ! check_display; then
    echo "ERROR: Cannot connect to display server!"
    echo "Make sure:"
    echo "  1. User '$DESKTOP_USER' is logged into desktop"
    echo "  2. Screen is not locked"
    echo "  3. You have permission to access the display"
    exit 1
fi

echo "Display connection: OK"

# -----------------------------------------------------------------------------
# 5. Activate virtualenv và chạy app
# -----------------------------------------------------------------------------
cd "$APP_DIR"

PYTHON_BIN="python3"
if [ -x "$VENV_PATH/bin/python" ]; then
    PYTHON_BIN="$VENV_PATH/bin/python"
    echo "Using venv python: $PYTHON_BIN"
elif [ -f "$VENV_PATH/bin/activate" ]; then
    echo "Activating virtualenv..."
    source "$VENV_PATH/bin/activate"
    PYTHON_BIN="$(command -v python3)"
    echo "Using activated python: $PYTHON_BIN"
fi

echo "=== Starting application ==="
echo "Working directory: $APP_DIR"
echo "Log file: $LOG_FILE"

# -----------------------------------------------------------------------------
# 6. Log rotation - rotate if > 5MB
# -----------------------------------------------------------------------------
MAX_LOG_SIZE=$((5 * 1024 * 1024))  # 5MB
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        echo "Rotating log file (size: ${LOG_SIZE} bytes)..."
        mv "$LOG_FILE" "${LOG_FILE}.1"
        # Keep only 1 backup
        rm -f "${LOG_FILE}.2" 2>/dev/null
    fi
fi
echo ""

# Giảm log spam từ FFmpeg/Qt Multimedia (ví dụ swscaler "deprecated pixel format").
# Không ảnh hưởng phát video, chỉ giảm noise trong terminal/log.
# Enable QML import tracing for debugging
# export QML_IMPORT_TRACE=1
# export QT_DEBUG_PLUGINS=1

export QT_LOGGING_RULES="${QT_LOGGING_RULES:-qt.multimedia.ffmpeg.debug=false;qt.multimedia.ffmpeg.info=false;qt.multimedia.ffmpeg.warning=false}"

# Chạy app, redirect output vào log
export PYTHONUNBUFFERED=1
exec "$PYTHON_BIN" "$APP_SCRIPT" "$@" 2>&1 | grep -v "\[swscaler @" | tee "$LOG_FILE"
