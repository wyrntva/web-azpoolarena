#!/bin/bash
# =============================================================================
# restart_services.sh - Restart camera services after config change
# =============================================================================
# Usage: ./restart_services.sh [all|relay|record]
#
# This script can be added to sudoers for passwordless restart:
#   wavy ALL=(ALL) NOPASSWD: /home/wavy/web-azpoolarena/scoreboard/scripts/restart_services.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

restart_relay() {
    echo "Restarting camera relay service..."
    if systemctl is-active --quiet cam-delay 2>/dev/null; then
        systemctl --no-ask-password restart cam-delay
        echo "✓ cam-delay restarted via systemctl"
    else
        # Fallback to direct script
        "$SCRIPT_DIR/cam_delay_relay.sh" restart
        echo "✓ cam-delay restarted via script"
    fi
}

restart_record() {
    echo "Restarting recording service..."
    if systemctl is-active --quiet cam-record 2>/dev/null; then
        systemctl --no-ask-password restart cam-record
        echo "✓ cam-record restarted via systemctl"
    else
        # Fallback: kill existing process (if running under another method)
        pkill -f "cam_record_main" 2>/dev/null || true
        sleep 1
        # Start in background
        nohup "$SCRIPT_DIR/cam_record_main.sh" >> "$APP_DIR/runtime/cam_record_main.log" 2>&1 &
        echo "✓ cam-record started in background"
    fi
}

graceful_record() {
    echo "Graceful restart recording (finish current segment, then use new URL)..."
    # Send SIGINT to GStreamer process specifically (not the wrapper script)
    # The -e flag makes gst-launch send EOS on SIGINT, finalizing the current segment
    local gst_pids
    gst_pids=$(pgrep -f "gst-launch.*splitmuxsink" 2>/dev/null || true)
    if [ -n "$gst_pids" ]; then
        for pid in $gst_pids; do
            echo "  Sending SIGINT to GStreamer PID $pid..."
            kill -INT "$pid" 2>/dev/null || true
        done
        echo "✓ GStreamer signaled for graceful finalization"
        echo "  Recording loop will restart with new URL from camera.json"
    else
        echo "  No GStreamer recording process found, doing full restart..."
        restart_record
    fi
}

case "${1:-all}" in
    relay)
        restart_relay
        ;;
    record)
        restart_record
        ;;
    graceful)
        graceful_record
        ;;
    all)
        restart_relay
        sleep 1
        restart_record
        ;;
    *)
        echo "Usage: $0 {all|relay|record|graceful}"
        exit 1
        ;;
esac

echo "Done."
