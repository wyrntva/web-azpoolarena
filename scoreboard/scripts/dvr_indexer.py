#!/usr/bin/env python3
import json
import os
import re
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional, Tuple

SEG_RE = re.compile(r"^seg_(?:.*_)?(\d{5})\.mp4$")


def now_local() -> datetime:
    return datetime.now()


def hour_dir_for(ts: datetime, root: Path) -> Path:
    return root / ts.strftime("%Y-%m-%d") / ts.strftime("%H")


def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def get_video_duration(file_path: Path, fallback_sec: int = 12) -> int:
    """Get actual video duration in seconds using ffprobe.
    Falls back to fallback_sec if ffprobe fails."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "csv=p=0", str(file_path)],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            return max(1, int(float(result.stdout.strip())))
    except Exception:
        pass
    return fallback_sec


def read_last_index_start(index_file: Path) -> Optional[int]:
    if not index_file.exists():
        return None
    try:
        # Read last non-empty line
        with index_file.open("r", encoding="utf-8") as f:
            lines = f.read().splitlines()
        for ln in reversed(lines):
            ln = ln.strip()
            if not ln:
                continue
            obj = json.loads(ln)
            return int(obj.get("start"))
    except Exception:
        return None


def load_index_map(index_file: Path) -> Dict[str, int]:
    m: Dict[str, int] = {}
    if not index_file.exists():
        return m
    try:
        with index_file.open("r", encoding="utf-8") as f:
            for ln in f:
                ln = ln.strip()
                if not ln:
                    continue
                try:
                    obj = json.loads(ln)
                    fn = str(obj.get("file"))
                    st = int(obj.get("start"))
                    if fn and st:
                        m[fn] = st
                except Exception:
                    continue
    except Exception:
        pass
    return m


def scan_segments(dir_path: Path) -> Tuple[Tuple[str, Path, float], ...]:
    if not dir_path.exists():
        return tuple()
    out = []
    for p in dir_path.glob("seg_*.mp4"):
        m = SEG_RE.match(p.name)
        if not m:
            continue
        try:
            st = p.stat()
        except Exception:
            continue
        out.append((p.name, p, st.st_mtime))
    out.sort(key=lambda x: x[0])  # by filename seg_00001...
    return tuple(out)


def append_index(index_file: Path, file_name: str, start_epoch: int, seg_sec: int) -> None:
    rec = {"file": file_name, "start": int(start_epoch), "segSec": int(seg_sec)}
    with index_file.open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, separators=(",", ":")) + "\n")


def index_one_hour_dir(hdir: Path, default_seg_sec: int) -> None:
    """Build/extend index.jsonl for a specific hour directory."""
    ensure_dir(hdir)
    index_file = hdir / "index.jsonl"
    index_map = load_index_map(index_file)

    last_start = read_last_index_start(index_file)
    if last_start is None:
        # Align baseline to the hour start - 1 segment so the first estimate won't jump backwards.
        # If the folder name is not parseable, fall back to now.
        try:
            # hdir = .../<YYYY-MM-DD>/<HH>
            hour_start = datetime.fromisoformat(hdir.parent.name + "T" + hdir.name + ":00:00")
        except Exception:
            hour_start = now_local().replace(minute=0, second=0, microsecond=0)
        last_start = int(hour_start.timestamp()) - default_seg_sec

    segs = scan_segments(hdir)
    if not segs:
        return

    for fn, fpath, mtime in segs:
        if fn in index_map:
            continue
            
        # Ignore files that are actively being written (mtime is within the last 5 seconds)
        if now_local().timestamp() - mtime < 5.0:
            continue

        # Use actual video duration from ffprobe instead of config value.
        # This ensures correct start time regardless of config changes.
        actual_duration = get_video_duration(fpath, default_seg_sec)

        est_start = int(mtime) - actual_duration
        if last_start is not None and est_start <= last_start:
            est_start = last_start + actual_duration

        append_index(index_file, fn, est_start, actual_duration)
        index_map[fn] = est_start
        last_start = est_start


def iter_hour_dirs_last_24h(root: Path) -> Tuple[Path, ...]:
    """Return hour dirs (root/YYYY-MM-DD/HH) for the last 24h, sorted."""
    out = []
    now = now_local().replace(minute=0, second=0, microsecond=0)
    for i in range(0, 25):
        ts = now - timedelta(hours=i)
        hdir = hour_dir_for(ts, root)
        if hdir.exists():
            out.append(hdir)
    out.sort()
    return tuple(out)


def load_seg_sec_from_config() -> int:
    """Load segment duration from camera.json config."""
    config_file = Path(__file__).resolve().parent.parent / "config" / "camera.json"
    if config_file.exists():
        try:
            with open(config_file, "r") as f:
                data = json.load(f)
            rec = data.get("recording", {})
            legacy = data.get("_legacy", {})
            val = rec.get("segmentSec") or legacy.get("recordSegSec")
            if val:
                return int(val)
        except Exception:
            pass
    return int(os.environ.get("SEG_SEC", "12"))


def main():
    root = Path(os.environ.get("OUT_DIR", "runtime/recordings")).expanduser().resolve()
    seg_sec = load_seg_sec_from_config()
    poll = float(os.environ.get("POLL_SEC", "0.5"))

    ensure_dir(root)

    while True:
        # Index current hour + any existing hour dirs in the last 24h.
        # This fixes cases where the recorder wrote segments into a non-current hour folder.
        hour_dirs = list(iter_hour_dirs_last_24h(root))

        # Always include the current hour dir even if empty (so index is created as soon as segments appear).
        cur = hour_dir_for(now_local(), root)
        if cur not in hour_dirs:
            hour_dirs.append(cur)

        for hdir in sorted(hour_dirs):
            try:
                index_one_hour_dir(hdir, seg_sec)
            except Exception:
                # Keep indexer resilient
                continue

        time.sleep(poll)


if __name__ == "__main__":
    main()
