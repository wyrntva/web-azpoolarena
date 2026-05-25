#!/bin/bash
# =============================================================================
# prune_recordings.sh - Delete recordings older than MAX_HOURS (default 24)
# =============================================================================
# Env/Args:
#   OUT_DIR    - recordings root directory (required)
#   MAX_HOURS  - retention hours (default: 24)
# =============================================================================

set -euo pipefail

OUT_DIR="${OUT_DIR:-${1:-}}"
MAX_HOURS="${MAX_HOURS:-${2:-24}}"

if [ -z "$OUT_DIR" ]; then
  echo "ERROR: OUT_DIR is required" >&2
  exit 2
fi

if [ ! -d "$OUT_DIR" ]; then
  echo "WARN: OUT_DIR does not exist: $OUT_DIR" >&2
  exit 0
fi

MINUTES=$((MAX_HOURS * 60))

# Delete old mp4 segments
find "$OUT_DIR" -type f -name "*.mp4" -mmin +"$MINUTES" -print -delete || true

# Option B: if an hour directory has no remaining mp4, delete its index.jsonl too
# so the directory becomes empty and can be removed.
find "$OUT_DIR" -type f -name "index.jsonl" -print | while IFS= read -r idx; do
  dir="$(dirname "$idx")"
  if ! find "$dir" -maxdepth 1 -type f -name "*.mp4" | grep -q .; then
    echo "$idx"
    rm -f "$idx" || true
  fi
done

# Remove empty directories (date/hour)
find "$OUT_DIR" -type d -empty -print -delete || true
