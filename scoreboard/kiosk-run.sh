#!/bin/bash
# =============================================================================
# kiosk-run.sh - Launch AZ Scoreboard in kiosk/fullscreen mode
# =============================================================================
# This script is called from .xinitrc after X11 is ready.
# It handles:
#   1. Camera relay startup
#   2. App launch in fullscreen with infinite restart loop
# =============================================================================

set -u

APP_DIR="/opt/azpool-scoreboard"
VENV_PYTHON="$APP_DIR/venv/bin/python"
LOG_FILE="$APP_DIR/runtime/kiosk.log"

# Ensure runtime dir
mkdir -p "$APP_DIR/runtime"

# ─── Log rotation (max 5 MB) ─────────────────────────────────────────────────
MAX_LOG_SIZE=$((5 * 1024 * 1024))
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.1"
        rm -f "${LOG_FILE}.2" 2>/dev/null
    fi
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== AZ Scoreboard Kiosk starting ==="
log "  APP_DIR: $APP_DIR"
log "  DISPLAY: ${DISPLAY:-unset}"

# Camera relay is handled by systemd azpool-cam-delay.service
# Do NOT start it here — duplicate processes cause HLS segment conflicts and video stutter

# ─── Qt / PySide6 environment ────────────────────────────────────────────────
export QT_QPA_PLATFORM="xcb"
export QSG_RENDER_LOOP="threaded"
export QSG_RHI_BACKEND="opengl"
export QT_QUICK_CONTROLS_STYLE="Material"
export QT_ENABLE_HIGHDPI_SCALING="1"
export QT_AUTO_SCREEN_SCALE_FACTOR="1"
export QT_IM_MODULE="qtvirtualkeyboard"
export QT_MEDIA_BACKEND="ffmpeg"
export QT_LOGGING_RULES="qt.multimedia.ffmpeg.debug=false;qt.multimedia.ffmpeg.info=false;qt.multimedia.ffmpeg.warning=false"
export PYTHONUNBUFFERED=1

# Disable VAAPI hardware decoding for Qt Multimedia / FFmpeg player
# SIGSEGV 139 occurs even with render group access — driver incompatibility with Qt FFmpeg backend
# This only affects QML video player, NOT GStreamer relay/recording (separate systemd services)
export LIBVA_DRIVER_NAME=null
log "VAAPI disabled for Qt video player (prevents SIGSEGV 139)"

# ─── Infinite restart loop for the GUI app ────────────────────────────────────
cd "$APP_DIR"

while true; do
    log "Launching scoreboard app..."
    "$VENV_PYTHON" app.py >> "$LOG_FILE" 2>&1
    EXIT_CODE=$?
    log "App exited with code $EXIT_CODE. Restarting in 3 seconds..."
    sleep 3
done
