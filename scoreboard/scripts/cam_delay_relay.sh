#!/bin/bash
# =============================================================================
# cam_delay_relay.sh - GStreamer RTSP to HLS relay with configurable delay
# =============================================================================
# Usage: ./cam_delay_relay.sh [start|stop|restart|status]
#
# Environment variables (can be set in config file or env):
#   CAM_URL       - RTSP URL of the camera (required)
#   DELAY_SEC     - Delay in seconds (default: 7, range: 0-30)
#   LOCAL_PORT    - HTTP port for HLS server (default: 8554)
#   HLS_DIR       - Directory for HLS segments (default: ./runtime/hls)
#   USE_VAAPI     - Use Intel VAAPI hardware acceleration (default: auto)
#   SEGMENT_SEC   - HLS segment duration in seconds (default: 2)
#   PLAYLIST_LEN  - Number of segments in playlist (default: 5)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${CONFIG_FILE:-$APP_DIR/config/camera.json}"
PID_FILE="$APP_DIR/runtime/cam_relay.pid"
HTTP_PID_FILE="$APP_DIR/runtime/cam_relay_http.pid"
LOG_FILE="$APP_DIR/runtime/cam_relay.log"
LOOP_TAG="cam_delay_relay_loop"

# -----------------------------------------------------------------------------
# Load config from JSON file if exists (new structure first, then legacy)
# -----------------------------------------------------------------------------
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        if command -v jq &>/dev/null; then
            # Try new structure first (.liveStream), then legacy keys
            CAM_URL="${CAM_URL:-$(jq -r '.liveStream.rtspUrl // ._legacy.cameraRtspUrl // .cameraRtspUrl // empty' "$CONFIG_FILE" 2>/dev/null)}"
            DELAY_SEC="${DELAY_SEC:-$(jq -r '.liveStream.delaySec // ._legacy.delaySec // .delaySec // empty' "$CONFIG_FILE" 2>/dev/null)}"
            LOCAL_PORT="${LOCAL_PORT:-$(jq -r '.liveStream.hlsPort // ._legacy.localPort // .localPort // empty' "$CONFIG_FILE" 2>/dev/null)}"
            DELAY_SERVER_PORT="${DELAY_SERVER_PORT:-$(jq -r '.liveStream.delayServerPort // ._legacy.delayServerPort // .delayServerPort // empty' "$CONFIG_FILE" 2>/dev/null)}"
            USE_VAAPI="${USE_VAAPI:-$(jq -r '.hardware.useVaapi // ._legacy.useVaapi // .useVaapi // empty' "$CONFIG_FILE" 2>/dev/null)}"
            SEGMENT_SEC="${SEGMENT_SEC:-$(jq -r '.liveStream.segmentSec // ._legacy.segmentSec // .segmentSec // empty' "$CONFIG_FILE" 2>/dev/null)}"
            PLAYLIST_LEN="${PLAYLIST_LEN:-$(jq -r '.liveStream.playlistLen // ._legacy.playlistLen // .playlistLen // empty' "$CONFIG_FILE" 2>/dev/null)}"
        fi
    fi
}

load_config

# -----------------------------------------------------------------------------
# Default values
# -----------------------------------------------------------------------------
CAM_URL="${CAM_URL:-}"
DELAY_SEC="${DELAY_SEC:-7}"
LOCAL_PORT="${LOCAL_PORT:-8554}"
# When DELAY_SEC > 0 we must NOT serve the raw playlist on the same port, otherwise
# clients will read the non-delayed `playlist.m3u8` and you will "see no delay".
#
# By default:
# - Raw HLS (segments + raw playlist) is served internally (no HTTP).
# - Delay server serves the client playlist on `DELAY_SERVER_PORT`.
#
# You can override via env/config: `delayServerPort`.
DELAY_SERVER_PORT="${DELAY_SERVER_PORT:-$((LOCAL_PORT + 1))}"
HLS_DIR="${HLS_DIR:-$APP_DIR/runtime/hls}"
USE_VAAPI="${USE_VAAPI:-auto}"
SEGMENT_SEC="${SEGMENT_SEC:-2}"
PLAYLIST_LEN="${PLAYLIST_LEN:-5}"
# Force transcode to ensure SPS/PPS in each segment (fix decode on HLS clients)
FORCE_TRANSCODE="${FORCE_TRANSCODE:-1}"

# Validate delay range
if [ "$DELAY_SEC" -lt 0 ] 2>/dev/null; then DELAY_SEC=0; fi
if [ "$DELAY_SEC" -gt 30 ] 2>/dev/null; then DELAY_SEC=30; fi

# Convert delay to nanoseconds for GStreamer queue
DELAY_NS=$((DELAY_SEC * 1000000000))

# -----------------------------------------------------------------------------
# Check dependencies
# -----------------------------------------------------------------------------
check_deps() {
    local missing=()

    for cmd in gst-launch-1.0 python3; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        echo "ERROR: Missing dependencies: ${missing[*]}"
        echo "Install with: sudo apt install gstreamer1.0-tools gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-vaapi python3"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Check VAAPI availability
# -----------------------------------------------------------------------------
check_vaapi() {
    if [ "$USE_VAAPI" = "false" ] || [ "$USE_VAAPI" = "0" ]; then
        echo "false"
        return
    fi

    # Check if ALL VAAPI elements can actually be loaded by current user
    # VAAPI requires access to /dev/dri/renderD128 (render group)
    if [ -r /dev/dri/renderD128 ] && \
       gst-inspect-1.0 vaapidecodebin &>/dev/null && \
       gst-inspect-1.0 vaapih264enc &>/dev/null && \
       gst-inspect-1.0 vaapipostproc &>/dev/null && \
       [ -d "/dev/dri" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# -----------------------------------------------------------------------------
# Detect codec from RTSP stream
# -----------------------------------------------------------------------------
detect_codec() {
    local url="$1"

    # Method 1: Use ffprobe (most reliable)
    if command -v ffprobe &>/dev/null; then
        local probe
        probe=$(timeout 10 ffprobe -v quiet -rtsp_transport tcp \
            -i "$url" -show_streams -select_streams v:0 \
            -of default=noprint_wrappers=1 2>&1 | grep "codec_name" | head -1)
        if echo "$probe" | grep -qi "hevc\|h265"; then
            echo "h265"
            return
        elif echo "$probe" | grep -qi "h264\|avc"; then
            echo "h264"
            return
        fi
    fi

    # Method 2: Fallback to gst-discoverer
    local sdp
    sdp=$(timeout 10 gst-discoverer-1.0 -t 5 "$url" 2>&1 || true)
    if echo "$sdp" | grep -qi "h265\|hevc"; then
        echo "h265"
    elif echo "$sdp" | grep -qi "h264\|avc"; then
        echo "h264"
    else
        # Last resort: try to read SDP directly via RTSP DESCRIBE
        local sdp_raw
        sdp_raw=$(timeout 5 bash -c "
            exec 3<>/dev/tcp/${url#rtsp://*/}
            echo -e 'DESCRIBE $url RTSP/1.0\r\nCSeq: 1\r\n\r\n' >&3
            cat <&3
        " 2>/dev/null || true)
        if echo "$sdp_raw" | grep -qi "H265\|HEVC"; then
            echo "h265"
        else
            # Default - assume h264 as safer fallback
            echo "h264"
        fi
    fi
}

# -----------------------------------------------------------------------------
# Build GStreamer pipeline
# -----------------------------------------------------------------------------
build_pipeline() {
    local vaapi_available=$(check_vaapi)
    local codec=$(detect_codec "$CAM_URL")

    echo "=== Camera Delay Relay Configuration ===" >&2
    echo "  Camera URL: $CAM_URL" >&2
    echo "  Delay: ${DELAY_SEC}s" >&2
    echo "  Codec detected: $codec" >&2
    echo "  VAAPI available: $vaapi_available" >&2
    echo "  HLS output: http://127.0.0.1:$LOCAL_PORT/live/playlist.m3u8" >&2
    echo "=========================================" >&2

    # RTSP source with reconnection
    # Increase latency a bit for smoother playback on jittery networks
    local src="rtspsrc location=\"$CAM_URL\" latency=200 do-retransmission=false protocols=tcp do-rtcp=true retry=5 timeout=5000000"

    # Depay based on codec
    local depay
    local decode
    local encode

    if [ "$codec" = "h265" ]; then
        depay="rtph265depay"
        if [ "$vaapi_available" = "true" ]; then
            decode="vaapih265dec"
            encode="vaapih264enc rate-control=cbr bitrate=4000 keyframe-period=30"
        else
            decode="avdec_h265"
            encode="x264enc tune=zerolatency bitrate=4000 key-int-max=30 speed-preset=ultrafast"
        fi
    else
        depay="rtph264depay"
        # Ưu tiên remux H.264 để giảm CPU và phát mượt hơn (không decode/encode)
        if [ "${FORCE_TRANSCODE:-0}" != "1" ]; then
            # Ensure SPS/PPS are inserted for each IDR so HLS segments can decode reliably.
            local parse_out="h264parse config-interval=-1"
            local mux="mpegtsmux"
            local max_files=$((DELAY_SEC / SEGMENT_SEC + PLAYLIST_LEN + 5))
            local hls_sink="hlssink location=\"$HLS_DIR/segment%05d.ts\" playlist-location=\"$HLS_DIR/playlist.m3u8\" target-duration=$SEGMENT_SEC max-files=$max_files playlist-length=$PLAYLIST_LEN"
            echo "$src ! $depay ! $parse_out ! $mux ! $hls_sink"
            return
        fi

        if [ "$vaapi_available" = "true" ]; then
            decode="vaapih264dec"
            encode="vaapih264enc rate-control=cbr bitrate=4000 keyframe-period=30"
        else
            decode="avdec_h264"
            encode="x264enc tune=zerolatency bitrate=4000 key-int-max=30 speed-preset=ultrafast"
        fi
    fi

    # Parse elements
    local parse="h264parse config-interval=-1"

    # Simple queue for buffering (no delay here - delay is handled by HLS delay server)
    local buffer_queue="queue max-size-buffers=0 max-size-bytes=0 max-size-time=3000000000"

    # HLS sink - writes segments as fast as possible
    # Keep more segments for delay server to work with (delay + buffer)
    local max_files=$((DELAY_SEC / SEGMENT_SEC + PLAYLIST_LEN + 5))
    local hls_sink="hlssink location=\"$HLS_DIR/segment%05d.ts\" playlist-location=\"$HLS_DIR/playlist.m3u8\" target-duration=$SEGMENT_SEC max-files=$max_files playlist-length=$PLAYLIST_LEN"

    # Muxer
    local mux="mpegtsmux"

    # Build full pipeline (delay is handled by hls_delay_server.py, not here)
    # Use vaapipostproc instead of videoconvert when VAAPI is active (GPU memory compatibility)
    if [ "$vaapi_available" = "true" ]; then
        echo "$src ! $depay ! $decode ! vaapipostproc ! $buffer_queue ! $encode ! $parse ! $mux ! $hls_sink"
    else
        # When no VAAPI, use passthrough for H.264 (no decode/encode = ~0% CPU)
        # h264parse config-interval=-1 ensures SPS/PPS in each segment
        echo "$src ! $depay ! h264parse config-interval=-1 ! $mux ! $hls_sink"
    fi
}

# -----------------------------------------------------------------------------
# Start HLS delay server (serves segments with configurable delay)
# -----------------------------------------------------------------------------
start_delay_server() {
    local port="$1"
    local delay="$2"
    local dir="$3"

    # Kill existing delay server
    pkill -f "hls_delay_server.py" 2>/dev/null || true
    pkill -f "python3 -m http.server $port" 2>/dev/null || true
    sleep 0.5

    # Start delay server
    local delay_script="$SCRIPT_DIR/hls_delay_server.py"
    if [ -f "$delay_script" ]; then
        setsid bash -c '
            while true; do
                python3 "$1" --port "$2" --delay "$3" --hls-dir "$4" >> "$5" 2>&1 || true
                sleep 3
            done
        ' "delay_server_loop" "$delay_script" "$port" "$delay" "$dir" "$LOG_FILE" </dev/null >/dev/null 2>&1 &
        echo $!
    else
        echo "ERROR: hls_delay_server.py not found at $delay_script" >&2
        # Fallback to simple HTTP server (no delay)
        cd "$dir"
        setsid python3 -m http.server "$port" --bind 127.0.0.1 &>/dev/null &
        echo $!
    fi
}

# -----------------------------------------------------------------------------
# Start relay
# -----------------------------------------------------------------------------
do_start() {
    if [ -z "$CAM_URL" ]; then
        echo "ERROR: CAM_URL is required"
        echo "Set it in $CONFIG_FILE or as environment variable"
        exit 1
    fi

    check_deps

    # If stale processes exist (from previous detached runs), stop them first.
    if pgrep -f "$LOOP_TAG" >/dev/null 2>&1 || \
       pgrep -f "gst-launch.*$HLS_DIR" >/dev/null 2>&1 || \
       pgrep -f "hls_delay_server.py.*--port $DELAY_SERVER_PORT" >/dev/null 2>&1; then
        echo "Stale relay processes detected. Stopping..."
        do_stop
    fi

    # Check if already running
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cut -d: -f1 "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            echo "Relay already running (PID: $old_pid)"
            exit 0
        fi
        rm -f "$PID_FILE"
    fi

    # Prepare HLS directory
    mkdir -p "$HLS_DIR"
    rm -f "$HLS_DIR"/*.ts "$HLS_DIR"/*.m3u8 2>/dev/null || true

    # Create initial empty playlist
    cat > "$HLS_DIR/playlist.m3u8" << 'EOF'
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
EOF

    # Build and run pipeline
    local pipeline=$(build_pipeline)

    echo "Starting GStreamer pipeline..."
    echo "Pipeline: $pipeline" >> "$LOG_FILE"

    # Start HLS delay server (client-facing HTTP) on a dedicated port.
    local http_pid=$(start_delay_server "$DELAY_SERVER_PORT" "$DELAY_SEC" "$HLS_DIR")
    echo "HLS delay server started on port $DELAY_SERVER_PORT with ${DELAY_SEC}s delay (PID: $http_pid)"

    # Run GStreamer in background with restart loop (detached so it survives shell exit)
    export PIPELINE="$pipeline"
    export HLS_DIR
    export LOG_FILE
    setsid bash -c '
        while true; do
            echo "[$(date "+%Y-%m-%d %H:%M:%S")] Starting GStreamer pipeline..." >> "$LOG_FILE"
            eval "gst-launch-1.0 -e $PIPELINE" >> "$LOG_FILE" 2>&1 || true
            echo "[$(date "+%Y-%m-%d %H:%M:%S")] Pipeline stopped, restarting in 3s..." >> "$LOG_FILE"
            sleep 3
            rm -f "$HLS_DIR"/segment*.ts 2>/dev/null || true
        done
    ' "$LOOP_TAG" >> "$LOG_FILE" 2>&1 &

    local gst_pid=$!
    # Keep PIDFile systemd-compatible (single integer PID).
    echo "$gst_pid" > "$PID_FILE"
    echo "$http_pid" > "$HTTP_PID_FILE"

    echo "Relay started (GStreamer PID: $gst_pid, HTTP PID: $http_pid)"
    echo "Stream URL: http://127.0.0.1:$DELAY_SERVER_PORT/playlist.m3u8"  # delayed playlist
    echo "Raw (no-delay) playlist file: $HLS_DIR/playlist.m3u8"
    echo "Log file: $LOG_FILE"
}

# -----------------------------------------------------------------------------
# Stop relay
# -----------------------------------------------------------------------------
do_stop() {
    local gst_pid=""
    local http_pid=""

    if [ -f "$PID_FILE" ]; then
        local pids
        pids=$(cat "$PID_FILE")
        # Backward compatibility: old format was "gst_pid:http_pid"
        if [[ "$pids" == *:* ]]; then
            gst_pid=$(echo "$pids" | cut -d: -f1)
            http_pid=$(echo "$pids" | cut -d: -f2)
        else
            gst_pid="$pids"
        fi

        # Kill GStreamer and its children
        if [ -n "$gst_pid" ]; then
            pkill -P "$gst_pid" 2>/dev/null || true
            kill "$gst_pid" 2>/dev/null || true
        fi

        rm -f "$PID_FILE"
    fi

    # Kill HTTP server from dedicated PID file if available
    if [ -f "$HTTP_PID_FILE" ]; then
        http_pid=$(cat "$HTTP_PID_FILE")
        if [ -n "$http_pid" ]; then
            kill "$http_pid" 2>/dev/null || true
        fi
        rm -f "$HTTP_PID_FILE"
    elif [ -n "$http_pid" ]; then
        # Old format fallback
        kill "$http_pid" 2>/dev/null || true
    fi

    if [ -n "$gst_pid" ] || [ -n "$http_pid" ]; then
        echo "Relay stopped"
    else
        echo "Relay not running"
    fi

    # Cleanup any remaining processes
    pkill -f "$LOOP_TAG" 2>/dev/null || true
    pkill -f "delay_server_loop" 2>/dev/null || true
    pkill -f "gst-launch.*$HLS_DIR" 2>/dev/null || true
    pkill -f "python3 -m http.server $LOCAL_PORT" 2>/dev/null || true
    pkill -f "hls_delay_server.py" 2>/dev/null || true
}

# -----------------------------------------------------------------------------
# Status
# -----------------------------------------------------------------------------
do_status() {
    if [ -f "$PID_FILE" ]; then
        local pids=$(cat "$PID_FILE")
        local gst_pid=$(echo "$pids" | cut -d: -f1)

        if kill -0 "$gst_pid" 2>/dev/null; then
            echo "Relay is running (PID: $gst_pid)"
            echo "Stream URL: http://127.0.0.1:$LOCAL_PORT/playlist.m3u8"

            # Check if playlist exists and has segments
            if [ -f "$HLS_DIR/playlist.m3u8" ]; then
                local segments=$(grep -c "\.ts" "$HLS_DIR/playlist.m3u8" 2>/dev/null || echo 0)
                echo "HLS segments: $segments"
            fi
            return 0
        fi
    fi

    echo "Relay is not running"
    return 1
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
case "${1:-start}" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    restart)
        do_stop
        sleep 1
        do_start
        ;;
    status)
        do_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
