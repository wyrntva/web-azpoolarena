#!/bin/bash
# =============================================================================
# cam_record_main.sh - Record RTSP main stream to MP4 segments (H.264)
# =============================================================================
# Env/Args:
#   DVR_CAM_URL  - RTSP URL (preferred)
#   CAM_URL      - RTSP URL fallback
#   OUT_DIR      - Recordings root directory (default: ./runtime/recordings)
#   SEG_SEC      - Segment duration seconds (default: 60)
#   MAX_HOURS    - Retention hours (default: 24)
#   LATENCY_MS   - rtspsrc latency (default: 200)
#
# Output layout:
#   OUT_DIR/YYYY-MM-DD/HH/seg_00000.mp4
#
# Graceful URL switching:
#   When camera URL changes in camera.json, the script detects it at the
#   start of each loop iteration. If GStreamer is still running (shouldn't be
#   at loop top), it will be sent SIGINT to trigger EOS and finalize the
#   current segment before restarting with the new URL.
#
#   External callers (e.g. CameraController) can send SIGINT to the
#   gst-launch process to gracefully finish the current segment. The loop
#   will then restart and re-read camera.json for the new URL.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${CONFIG_FILE:-$APP_DIR/config/camera.json}"
LOG_DIR="$APP_DIR/runtime"
LOG_FILE="$LOG_DIR/cam_record_main.log"

# Store PID of current GStreamer process for graceful stop
GST_PID=""

# Trap SIGINT/SIGTERM: forward to GStreamer for graceful finalization
cleanup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Received signal, shutting down gracefully..." | tee -a "$LOG_FILE"
    if [ -n "$GST_PID" ] && kill -0 "$GST_PID" 2>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sending SIGINT to GStreamer (PID: $GST_PID) for EOS finalization..." | tee -a "$LOG_FILE"
        kill -INT "$GST_PID" 2>/dev/null || true
        # Wait up to 15s for GStreamer to finalize
        for i in $(seq 1 15); do
            if ! kill -0 "$GST_PID" 2>/dev/null; then
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] GStreamer finalized after ${i}s" | tee -a "$LOG_FILE"
                break
            fi
            sleep 1
        done
        # Force kill if still running
        kill -9 "$GST_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

# -----------------------------------------------------------------------------
# Load config from JSON file (called each loop iteration)
# -----------------------------------------------------------------------------
load_config() {
    # Reset DVR_CAM_URL so we always read fresh from config
    DVR_CAM_URL=""
    OUT_DIR=""
    SEG_SEC=""
    MAX_HOURS=""
    LATENCY_MS=""
    USE_VAAPI=""

    if [ -f "$CONFIG_FILE" ]; then
        if command -v jq &>/dev/null; then
            DVR_CAM_URL="$(jq -r '.recording.rtspUrl // ._legacy.dvrCameraRtspUrl // .dvrCameraRtspUrl // empty' "$CONFIG_FILE" 2>/dev/null)"
            local REC_DIR
            REC_DIR="$(jq -r '.recording.outputDir // ._legacy.recordingsDir // .recordingsDir // empty' "$CONFIG_FILE" 2>/dev/null)"
            SEG_SEC="$(jq -r '.recording.segmentSec // ._legacy.recordSegSec // .recordSegSec // empty' "$CONFIG_FILE" 2>/dev/null)"
            MAX_HOURS="$(jq -r '.recording.maxHours // empty' "$CONFIG_FILE" 2>/dev/null)"
            LATENCY_MS="$(jq -r '.recording.latencyMs // empty' "$CONFIG_FILE" 2>/dev/null)"
            USE_VAAPI="$(jq -r '.hardware.useVaapi // ._legacy.useVaapi // .useVaapi // empty' "$CONFIG_FILE" 2>/dev/null)"

            # Handle relative path for recordings dir
            if [ -n "$REC_DIR" ] && [[ ! "$REC_DIR" = /* ]]; then
                OUT_DIR="$APP_DIR/$REC_DIR"
            elif [ -n "$REC_DIR" ]; then
                OUT_DIR="$REC_DIR"
            fi
        fi
    fi

    # Apply defaults
    CAM_URL="${DVR_CAM_URL:-${CAM_URL_INITIAL:-}}"
    OUT_DIR="${OUT_DIR:-$APP_DIR/runtime/recordings}"
    SEG_SEC="${SEG_SEC:-60}"
    MAX_HOURS="${MAX_HOURS:-24}"
    LATENCY_MS="${LATENCY_MS:-200}"
    USE_VAAPI="${USE_VAAPI:-auto}"
}

# -----------------------------------------------------------------------------
# Check VAAPI availability (same logic as cam_delay_relay.sh)
# -----------------------------------------------------------------------------
check_vaapi() {
    if [ "$USE_VAAPI" = "false" ] || [ "$USE_VAAPI" = "0" ]; then
        echo "false"
        return
    fi

    # Check if VAAPI elements can actually be loaded by current user
    # VAAPI requires access to /dev/dri/renderD128 (render group)
    if [ -r /dev/dri/renderD128 ] && \
       gst-inspect-1.0 vaapih265dec &>/dev/null 2>&1 && \
       gst-inspect-1.0 vaapih264enc &>/dev/null 2>&1 && \
       gst-inspect-1.0 vaapipostproc &>/dev/null 2>&1; then
        echo "true"
    else
        echo "false"
    fi
}

# Save initial CAM_URL from env/args (used as fallback if config has no URL)
CAM_URL_INITIAL="${DVR_CAM_URL:-${CAM_URL:-${1:-}}}"

# Initial config load (for validation)
load_config

if [ -z "$CAM_URL" ]; then
  echo "ERROR: CAM_URL is required" >&2
  exit 2
fi

mkdir -p "$OUT_DIR" "$LOG_DIR"

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
        # Default - assume h264 as safer fallback
        echo "h264"
    fi
}

echo "=== cam_record_main ===" | tee -a "$LOG_FILE"
echo "  Initial CAM_URL: $CAM_URL" | tee -a "$LOG_FILE"
echo "  OUT_DIR: $OUT_DIR" | tee -a "$LOG_FILE"
echo "  SEG_SEC: $SEG_SEC" | tee -a "$LOG_FILE"
echo "  MAX_HOURS: $MAX_HOURS" | tee -a "$LOG_FILE"
echo "  LATENCY_MS: $LATENCY_MS" | tee -a "$LOG_FILE"
echo "=======================" | tee -a "$LOG_FILE"

# Adaptive retry: short wait after normal stop, longer wait after quick crash
RETRY_WAIT=3         # Normal retry wait (seconds)
RETRY_WAIT_MAX=15    # Max retry wait when camera keeps rejecting
FAIL_THRESHOLD=30    # If pipeline runs < this many seconds, it's a "quick crash"

while true; do
  # ===== RE-READ CONFIG each iteration to pick up URL changes =====
  PREV_CAM_URL="$CAM_URL"
  load_config

  if [ -z "$CAM_URL" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No camera URL configured, waiting 10s..." | tee -a "$LOG_FILE"
    sleep 10
    continue
  fi

  # Log URL change
  if [ "$PREV_CAM_URL" != "$CAM_URL" ] && [ -n "$PREV_CAM_URL" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] *** Camera URL changed! ***" | tee -a "$LOG_FILE"
    echo "  Old: $PREV_CAM_URL" | tee -a "$LOG_FILE"
    echo "  New: $CAM_URL" | tee -a "$LOG_FILE"
  fi

  MAX_FILES=$(( (MAX_HOURS * 3600) / SEG_SEC + 120 ))
  if [ "$MAX_FILES" -lt 200 ]; then MAX_FILES=200; fi

  DAY_DIR="$OUT_DIR/$(date '+%Y-%m-%d')"
  HOUR_DIR="$DAY_DIR/$(date '+%H')"
  mkdir -p "$HOUR_DIR"
  # Ensure directory is writable by current user (fix ownership if created by root)
  chown "$(id -u):$(id -g)" "$DAY_DIR" "$HOUR_DIR" 2>/dev/null || true
  chmod 755 "$HOUR_DIR" 2>/dev/null || true
  # Find the highest index to resume from if restarting in the same hour
  LAST_IDX=$(ls "$HOUR_DIR"/seg_*.mp4 2>/dev/null | grep -oE 'seg_[0-9]+\.mp4' | awk -F_ '{print $2}' | awk -F. '{print $1}' | sort -n | tail -1 | sed 's/^0*//' || true)
  if [ -z "$LAST_IDX" ]; then 
    START_IDX=0 
  else 
    START_IDX=$((LAST_IDX + 1)) 
  fi
  LOCATION_TEMPLATE="$HOUR_DIR/seg_%05d.mp4"

  CODEC=$(detect_codec "$CAM_URL")

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting GStreamer recorder..." | tee -a "$LOG_FILE"
  echo "  CAM_URL: $CAM_URL" | tee -a "$LOG_FILE"
  echo "  HOUR_DIR: $HOUR_DIR" | tee -a "$LOG_FILE"
  echo "  START_IDX: $START_IDX" | tee -a "$LOG_FILE"
  echo "  LOCATION: $LOCATION_TEMPLATE" | tee -a "$LOG_FILE"
  echo "  CODEC: $CODEC" | tee -a "$LOG_FILE"

  # run only until few seconds past the hour then restart to rotate directory
  secs_to_next=$(( (60 - 10#$(date +%M)) * 60 - 10#$(date +%S) + 10 ))
  echo "  Will rotate after $secs_to_next seconds" | tee -a "$LOG_FILE"

  # Check VAAPI support
  VAAPI_OK=$(check_vaapi)
  echo "  VAAPI available: $VAAPI_OK" | tee -a "$LOG_FILE"

  if [ "$CODEC" = "h265" ]; then
    # H.265 PASSTHROUGH: No decode/encode needed, just remux directly to MP4
    # This uses ~0% CPU vs 110% for software transcode
    PIPELINE="rtspsrc location=\"$CAM_URL\" protocols=tcp latency=$LATENCY_MS do-retransmission=true timeout=5000000 retry=5 ! rtph265depay ! h265parse ! splitmuxsink name=mux muxer=qtmux location=\"$LOCATION_TEMPLATE\" start-index=$START_IDX max-size-time=$((SEG_SEC * 1000000000)) max-files=$MAX_FILES async-finalize=true"
  else
    # H.264 PASSTHROUGH: Same approach
    PIPELINE="rtspsrc location=\"$CAM_URL\" protocols=tcp latency=$LATENCY_MS do-retransmission=true timeout=5000000 retry=5 ! rtph264depay ! h264parse config-interval=-1 ! splitmuxsink name=mux muxer=qtmux location=\"$LOCATION_TEMPLATE\" start-index=$START_IDX max-size-time=$((SEG_SEC * 1000000000)) max-files=$MAX_FILES async-finalize=true"
  fi

  # Run GStreamer with -e flag: SIGINT triggers EOS → splitmuxsink finalizes current segment
  # --signal=INT: timeout sends SIGINT (not SIGTERM) so GStreamer can finalize gracefully
  # --foreground: ensures GStreamer is in same process group and can receive external signals
  # --kill-after=15: if GStreamer doesn't exit 15s after SIGINT, force-kill it
  PIPELINE_START=$(date +%s)

  timeout --signal=INT --kill-after=15 --foreground "$secs_to_next" \
  gst-launch-1.0 -e $PIPELINE \
    >> "$LOG_FILE" 2>&1 || true

  PIPELINE_END=$(date +%s)
  RUN_DURATION=$(( PIPELINE_END - PIPELINE_START ))

  # Adaptive retry backoff:
  # - If pipeline ran longer than FAIL_THRESHOLD (normal stop / hourly rotate): reset to 3s
  # - If pipeline crashed quickly (camera rejected connection): increase wait up to 15s
  if [ "$RUN_DURATION" -ge "$FAIL_THRESHOLD" ]; then
    # Normal operation — reset backoff
    RETRY_WAIT=3
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Recorder stopped after ${RUN_DURATION}s (normal), restart in ${RETRY_WAIT}s..." | tee -a "$LOG_FILE"
  else
    # Quick crash — camera likely rejecting connections, back off
    if [ "$RETRY_WAIT" -lt 10 ]; then
      RETRY_WAIT=10
    elif [ "$RETRY_WAIT" -lt "$RETRY_WAIT_MAX" ]; then
      RETRY_WAIT=$RETRY_WAIT_MAX
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Recorder crashed after ${RUN_DURATION}s (camera may be rejecting), retry in ${RETRY_WAIT}s..." | tee -a "$LOG_FILE"
  fi

  sleep "$RETRY_WAIT"

done
