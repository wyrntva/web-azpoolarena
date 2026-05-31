import json
from pathlib import Path

from PySide6.QtCore import QObject, Slot

from core.dvr_resolver import DVRResolver


class DVRController(QObject):
    def __init__(self, parent=None):
        super().__init__(parent)

        self._app_dir = Path(__file__).resolve().parent.parent
        self._config_file = self._app_dir / "config" / "camera.json"

        self._recordings_dir = str(self._app_dir / "runtime" / "recordings")
        self._seg_sec = 12
        self._dvr_cam_url = ""

        self._load_config()
        self._resolver = DVRResolver(recordings_dir=self._recordings_dir, seg_sec=self._seg_sec)

    def _load_config(self):
        try:
            if self._config_file.exists():
                data = json.loads(self._config_file.read_text(encoding="utf-8"))

                # Try new structure first, fall back to legacy keys
                recording = data.get("recording", {})
                legacy = data.get("_legacy", data)  # fallback to root for old format

                rec_dir = recording.get("outputDir") or legacy.get("recordingsDir")
                if rec_dir:
                    # allow relative path under app dir
                    p = Path(rec_dir)
                    self._recordings_dir = str((self._app_dir / p).resolve()) if not p.is_absolute() else str(p)

                self._seg_sec = int(recording.get("segmentSec") or legacy.get("recordSegSec", self._seg_sec))
                self._dvr_cam_url = recording.get("rtspUrl") or legacy.get("dvrCameraRtspUrl", "")
        except Exception:
            pass

    @Slot(str, result="QVariant")
    def resolve(self, ts_iso: str):
        """Resolve an ISO8601 local timestamp to a local MP4 file + offset.

        Returns a QVariantMap-like dict to QML:
          { ok: true, fileUrl, offsetMs, segStartIso, segEndIso }
        or { ok: false, error }
        """
        try:
            r = self._resolver.resolve(ts_iso)
            return {
                "ok": True,
                "fileUrl": r.file_url,
                "offsetMs": r.offset_ms,
                "segStartIso": r.seg_start_iso,
                "segEndIso": r.seg_end_iso,
            }
        except Exception as e:
            return {"ok": False, "error": str(e)}
