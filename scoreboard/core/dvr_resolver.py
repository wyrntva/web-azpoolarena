import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple


@dataclass
class ResolveResult:
    file_path: str
    file_url: str
    offset_ms: int
    seg_start_iso: str
    seg_end_iso: str


@dataclass
class IndexEntry:
    file: str
    start: int
    seg_sec: int


class DVRResolver:
    def __init__(self, recordings_dir: str, seg_sec: int = 12, tz_mode: str = "local"):
        self.recordings_dir = Path(recordings_dir)
        self.seg_sec = int(seg_sec)
        self.tz_mode = tz_mode
        # Cache: {hour_dir_str: (mtime, entries)}
        self._index_cache: Dict[str, Tuple[float, List[IndexEntry]]] = {}

    def _parse_ts_iso(self, ts_iso: str) -> datetime:
        # Accept "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD HH:MM:SS" with optional timezone.
        s = ts_iso.strip().replace(" ", "T")
        dt = datetime.fromisoformat(s)
        # If naive, treat as local time.
        return dt

    def _hour_dir_for(self, ts: datetime) -> Path:
        # Layout: OUT_DIR/YYYY-MM-DD/HH/
        return self.recordings_dir / ts.strftime("%Y-%m-%d") / ts.strftime("%H")

    def _load_index(self, hour_dir: Path) -> List[IndexEntry]:
        idx = hour_dir / "index.jsonl"
        if not idx.exists():
            return []

        cache_key = str(hour_dir)
        try:
            current_mtime = idx.stat().st_mtime
        except Exception:
            return []

        # Check cache validity
        if cache_key in self._index_cache:
            cached_mtime, cached_entries = self._index_cache[cache_key]
            if cached_mtime == current_mtime:
                return cached_entries

        # Load from file
        entries: List[IndexEntry] = []
        try:
            with idx.open("r", encoding="utf-8") as f:
                for ln in f:
                    ln = ln.strip()
                    if not ln:
                        continue
                    try:
                        obj = json.loads(ln)
                        file = str(obj.get("file") or "")
                        start = int(obj.get("start"))
                        seg_sec = int(obj.get("segSec") or self.seg_sec)
                        if file and start:
                            entries.append(IndexEntry(file=file, start=start, seg_sec=seg_sec))
                    except Exception:
                        continue
        except Exception:
            return []

        entries.sort(key=lambda e: e.start)

        # Update cache
        self._index_cache[cache_key] = (current_mtime, entries)
        return entries

    def _find_entry_for_ts(self, entries: List[IndexEntry], target_epoch: int) -> Optional[IndexEntry]:
        if not entries:
            return None
        # Find last entry with start <= target_epoch
        lo, hi = 0, len(entries) - 1
        best = None
        while lo <= hi:
            mid = (lo + hi) // 2
            e = entries[mid]
            if e.start <= target_epoch:
                best = e
                lo = mid + 1
            else:
                hi = mid - 1
        return best

    def _fallback_scan_nearest_file(self, hour_dir: Path) -> Optional[Tuple[Path, int]]:
        # Fallback: pick newest seg_*.mp4 and estimate start via mtime-seg_sec
        if not hour_dir.exists():
            return None
        files = sorted(hour_dir.glob("seg_*.mp4"))
        if not files:
            return None
        p = files[-1]
        try:
            mtime = int(p.stat().st_mtime)
        except Exception:
            return None
        est_start = mtime - self.seg_sec
        return (p, est_start)

    def resolve(self, ts_iso: str) -> ResolveResult:
        ts = self._parse_ts_iso(ts_iso)
        target_epoch = int(ts.timestamp())

        hour_dir = self._hour_dir_for(ts)
        entries = self._load_index(hour_dir)

        chosen_path: Optional[Path] = None
        seg_start_epoch: Optional[int] = None
        seg_sec: int = self.seg_sec

        entry = self._find_entry_for_ts(entries, target_epoch)
        if entry is not None:
            seg_sec = entry.seg_sec
            seg_start_epoch = entry.start
            chosen_path = (hour_dir / entry.file)
            if not chosen_path.exists():
                # file missing - fallback
                chosen_path = None
                seg_start_epoch = None

        if chosen_path is None or seg_start_epoch is None:
            # Try previous hour (because target could be near beginning of hour)
            prev_hour = ts - timedelta(hours=1)
            prev_dir = self._hour_dir_for(prev_hour)
            prev_entries = self._load_index(prev_dir)
            entry = self._find_entry_for_ts(prev_entries, target_epoch)
            if entry is not None:
                seg_sec = entry.seg_sec
                seg_start_epoch = entry.start
                chosen_path = prev_dir / entry.file

        if chosen_path is None or seg_start_epoch is None:
            fb = self._fallback_scan_nearest_file(hour_dir)
            if fb:
                chosen_path, seg_start_epoch = fb

        if chosen_path is None or seg_start_epoch is None or not chosen_path.exists():
            raise FileNotFoundError("No recording found for requested time")

        seg_start_dt = datetime.fromtimestamp(seg_start_epoch, tz=ts.tzinfo)
        seg_end_dt = seg_start_dt + timedelta(seconds=seg_sec)

        offset_ms = int(max(0, (target_epoch - seg_start_epoch) * 1000))
        
        # If the requested time is more than 15 seconds after this segment ends,
        # it means we are in a recording gap. We should not return an old file.
        if offset_ms > (seg_sec + 15) * 1000:
            raise FileNotFoundError("Requested time is in a recording gap")
            
        if offset_ms > seg_sec * 1000:
            offset_ms = seg_sec * 1000

        file_path = str(chosen_path.resolve())
        file_url = Path(file_path).as_uri()

        return ResolveResult(
            file_path=file_path,
            file_url=file_url,
            offset_ms=offset_ms,
            seg_start_iso=seg_start_dt.isoformat(sep="T"),
            seg_end_iso=seg_end_dt.isoformat(sep="T"),
        )


def resolve_ts(ts_iso: str, recordings_dir: str, seg_sec: int = 12) -> Dict[str, Any]:
    r = DVRResolver(recordings_dir=recordings_dir, seg_sec=seg_sec).resolve(ts_iso)
    return {
        "filePath": r.file_path,
        "fileUrl": r.file_url,
        "offsetMs": r.offset_ms,
        "segStartIso": r.seg_start_iso,
        "segEndIso": r.seg_end_iso,
    }
