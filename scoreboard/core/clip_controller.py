"""
ClipController - QML bridge for video clipping functionality

Provides:
- Clip URL generation
- QR code URL generation
- Server status checking
"""

import json
import socket
from pathlib import Path
from urllib.parse import urlencode, quote

from PySide6.QtCore import QObject, Property, Signal, Slot


class ClipController(QObject):
    """Controller for clip server integration"""

    serverUrlChanged = Signal()
    clipServerPortChanged = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)

        self._app_dir = Path(__file__).resolve().parent.parent
        self._config_file = self._app_dir / "config" / "camera.json"

        self._clip_server_port = 8580
        self._local_ip = self._get_local_ip()

        self._load_config()

    def _load_config(self):
        """Load configuration from camera.json"""
        try:
            if self._config_file.exists():
                data = json.loads(self._config_file.read_text(encoding="utf-8"))
                clip_config = data.get("clipServer", {})
                self._clip_server_port = int(clip_config.get("port", 8580))
        except Exception:
            pass

    def _get_local_ip(self) -> str:
        """Get the local IP address"""
        # 1. Try to use camera host to find local IP
        try:
            if self._config_file.exists():
                data = json.loads(self._config_file.read_text(encoding="utf-8"))
                camera_host = data.get("camera", {}).get("host")
                if camera_host:
                    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    s.settimeout(1)
                    s.connect((camera_host, 80))
                    ip = s.getsockname()[0]
                    s.close()
                    if not ip.startswith("127."):
                        return ip
        except Exception:
            pass

        # 2. Fallback to 8.8.8.8
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(1)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            pass

        return "127.0.0.1"

    @Property(str, notify=serverUrlChanged)
    def serverUrl(self) -> str:
        """Base URL for the clip server"""
        return f"http://{self._local_ip}:{self._clip_server_port}"

    @Property(str, notify=serverUrlChanged)
    def localIp(self) -> str:
        """Local IP address"""
        return self._local_ip

    @Property(int, notify=clipServerPortChanged)
    def clipServerPort(self) -> int:
        """Clip server port"""
        return self._clip_server_port

    @Slot(str, str, str, result=str)
    def getClipUrl(self, cam: str, start_iso: str, end_iso: str) -> str:
        """
        Generate URL to request a video clip.

        Args:
            cam: Camera identifier (e.g., "1")
            start_iso: Start timestamp in ISO format (e.g., "2024-01-15T14:30:00")
            end_iso: End timestamp in ISO format

        Returns:
            Full URL to request the clip
        """
        params = urlencode({
            "cam": cam,
            "start": start_iso,
            "end": end_iso,
        })
        return f"{self.serverUrl}/clip?{params}"

    @Slot(str, result=str)
    def getQrUrl(self, target_url: str) -> str:
        """
        Generate URL to get a QR code image for the given target URL.

        Args:
            target_url: The URL to encode in the QR code

        Returns:
            URL to fetch the QR code image
        """
        encoded = quote(target_url, safe="")
        return f"{self.serverUrl}/qr?url={encoded}"

    @Slot(str, str, str, result=str)
    def getClipQrUrl(self, cam: str, start_iso: str, end_iso: str) -> str:
        """
        Generate URL to get a QR code for a clip request.

        This combines getClipUrl and getQrUrl for convenience.

        Args:
            cam: Camera identifier
            start_iso: Start timestamp in ISO format
            end_iso: End timestamp in ISO format

        Returns:
            URL to fetch the QR code image that encodes the clip URL
        """
        clip_url = self.getClipUrl(cam, start_iso, end_iso)
        return self.getQrUrl(clip_url)

    @Slot(result=str)
    def getStatusUrl(self) -> str:
        """Get URL to check server status"""
        return f"{self.serverUrl}/status"

    @Slot()
    def refreshIp(self):
        """Refresh the local IP address"""
        old_ip = self._local_ip
        self._local_ip = self._get_local_ip()
        if old_ip != self._local_ip:
            self.serverUrlChanged.emit()
