#!/bin/bash
# =============================================================================
# run.sh - Chạy GUI app (cross-platform: Ubuntu production / Windows dev)
# =============================================================================

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SCRIPT="app.py"
VENV_PATH="$APP_DIR/venv"
LOG_FILE="$APP_DIR/app.log"

# -----------------------------------------------------------------------------
# OS detection
# -----------------------------------------------------------------------------
detect_os() {
    case "$OSTYPE" in
        msys*|cygwin*|win32*) echo "windows" ;;
        linux*)               echo "linux" ;;
        darwin*)              echo "macos" ;;
        *)                    echo "unknown" ;;
    esac
}

OS_TYPE=$(detect_os)
echo "=== Detected OS: $OS_TYPE ==="

# -----------------------------------------------------------------------------
# Display setup (Linux only — Windows/macOS use native display via Qt)
# -----------------------------------------------------------------------------
if [ "$OS_TYPE" = "linux" ]; then

    get_desktop_user() {
        who | grep -E '\(:0\)|\(tty[0-9]\)' | head -1 | awk '{print $1}'
    }

    DESKTOP_USER="${DESKTOP_USER:-$(get_desktop_user)}"
    if [ -z "$DESKTOP_USER" ]; then
        DESKTOP_USER="$USER"
    fi

    get_display_env() {
        local user="$1"
        local uid=$(id -u "$user" 2>/dev/null || echo "")

        if [ -n "$uid" ] && [ -d "/run/user/$uid" ]; then
            if [ -S "/run/user/$uid/wayland-0" ]; then
                echo "SESSION_TYPE=wayland"
                echo "WAYLAND_DISPLAY=wayland-0"
                echo "XDG_RUNTIME_DIR=/run/user/$uid"
                return 0
            fi
        fi

        local display=$(pgrep -u "$user" -a 2>/dev/null | grep -oP 'DISPLAY=:\d+' | head -1 | cut -d= -f2)
        if [ -z "$display" ]; then
            for d in :0 :1 :10; do
                if DISPLAY=$d xdpyinfo >/dev/null 2>&1; then
                    display=$d
                    break
                fi
            done
        fi
        display="${display:-:0}"

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

    echo "=== Detecting display environment for user: $DESKTOP_USER ==="

    eval "$(get_display_env "$DESKTOP_USER")"

    export DISPLAY="${DISPLAY:-:0}"
    export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u $DESKTOP_USER)}"

    if [ "$SESSION_TYPE" = "wayland" ]; then
        export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
        export QT_QPA_PLATFORM="wayland"
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
        export QT_QPA_PLATFORM="xcb"
        echo "X11 session detected"
        echo "  DISPLAY=$DISPLAY"
        echo "  XAUTHORITY=$XAUTHORITY"
    fi

    echo "  XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR"

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

else
    # Windows / macOS: Qt uses native display — no X11/Wayland setup needed
    echo "=== Skipping display detection (native display) ==="
    if [ "$OS_TYPE" = "windows" ]; then
        export QT_QPA_PLATFORM="${QT_QPA_PLATFORM:-windows}"
        echo "  QT_QPA_PLATFORM=$QT_QPA_PLATFORM"
    fi
fi

# -----------------------------------------------------------------------------
# Activate virtualenv
# -----------------------------------------------------------------------------
cd "$APP_DIR"

# Windows venv uses Scripts/, Linux/macOS uses bin/
if [ "$OS_TYPE" = "windows" ]; then
    VENV_BIN="$VENV_PATH/Scripts"
    DEFAULT_PYTHON="python"
else
    VENV_BIN="$VENV_PATH/bin"
    DEFAULT_PYTHON="python3"
fi

PYTHON_BIN="$DEFAULT_PYTHON"

if [ -f "$VENV_BIN/python" ] || [ -f "$VENV_BIN/python.exe" ]; then
    PYTHON_BIN="$VENV_BIN/python"
    echo "Using venv python: $PYTHON_BIN"
elif [ -f "$VENV_BIN/activate" ]; then
    echo "Activating virtualenv..."
    source "$VENV_BIN/activate"
    PYTHON_BIN="$(command -v $DEFAULT_PYTHON)"
    echo "Using activated python: $PYTHON_BIN"
else
    echo "WARNING: No venv found at $VENV_PATH — using system $DEFAULT_PYTHON"
    echo "  Run: $DEFAULT_PYTHON -m venv venv && $VENV_BIN/pip install -r requirements.txt"
fi

echo "=== Starting application ==="
echo "Working directory: $APP_DIR"
echo "Log file: $LOG_FILE"

# -----------------------------------------------------------------------------
# Log rotation — cross-platform (stat -c%s is Linux-only)
# -----------------------------------------------------------------------------
MAX_LOG_SIZE=$((5 * 1024 * 1024))  # 5MB
if [ -f "$LOG_FILE" ]; then
    if [ "$OS_TYPE" = "linux" ]; then
        LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    else
        LOG_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null | tr -d ' ' || echo 0)
    fi
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        echo "Rotating log file (size: ${LOG_SIZE} bytes)..."
        mv "$LOG_FILE" "${LOG_FILE}.1"
        rm -f "${LOG_FILE}.2" 2>/dev/null
    fi
fi
echo ""

# Giảm log spam từ FFmpeg/Qt Multimedia
export QT_LOGGING_RULES="${QT_LOGGING_RULES:-qt.multimedia.ffmpeg.debug=false;qt.multimedia.ffmpeg.info=false;qt.multimedia.ffmpeg.warning=false}"
export PYTHONUNBUFFERED=1

exec "$PYTHON_BIN" "$APP_SCRIPT" "$@" 2>&1 | grep -v "\[swscaler @" | tee "$LOG_FILE"
