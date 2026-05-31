from __future__ import annotations

import json
import os
import platform
import uuid
from typing import Any, Dict, Optional

from PySide6.QtCore import QObject, Signal, Slot, QUrl
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply

def _read_app_version() -> str:
    """Read version from VERSION file (created at build time), fallback to 'dev'."""
    import pathlib
    # Check next to this file first (dev), then installed location
    for candidate in [
        pathlib.Path(__file__).resolve().parent.parent / "VERSION",
        pathlib.Path("/opt/azpool-scoreboard/VERSION"),
    ]:
        try:
            return candidate.read_text().strip()
        except Exception:
            continue
    return "dev"

APP_VERSION = _read_app_version()


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _get_device_id() -> str:
    """Get or generate a unique device identifier."""
    try:
        # Try to get machine ID on Linux
        for path in ["/etc/machine-id", "/var/lib/dbus/machine-id"]:
            if os.path.isfile(path):
                with open(path, "r") as f:
                    return f.read().strip()[:32]
    except Exception:
        pass
    # Fallback: generate UUID based on node (MAC address)
    return str(uuid.getnode())


def _get_os_info() -> str:
    """Get OS information string."""
    try:
        system = platform.system()
        release = platform.release()
        if system == "Linux":
            # Try to get distro name
            try:
                import subprocess
                result = subprocess.run(
                    ["lsb_release", "-ds"],
                    capture_output=True, text=True, timeout=2
                )
                if result.returncode == 0 and result.stdout.strip():
                    return f"{result.stdout.strip()} ({release})"
            except Exception:
                pass
        return f"{system} {release}"
    except Exception:
        return "Unknown"


def _get_local_ip() -> str:
    """Get the local IP address using UDP routing (instant, prevents UI thread DNS blocking)."""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # connect() for UDP doesn't send packets, it just calculates routing
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        pass
    
    # Try local broadcast as fallback
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def _get_mac_address() -> str:
    """Get the local MAC address."""
    try:
        import uuid
        mac_num = uuid.getnode()
        mac_hex = '{:012x}'.format(mac_num)
        return ':'.join(mac_hex[i:i+2] for i in range(0, 12, 2)).upper()
    except Exception:
        return "00:00:00:00:00:00"


class DeviceActivationService(QObject):
    activationFinished = Signal(bool, str, int, int, str, str)  # success, device_code, table_id, area_id, message, table_name
    activationFailed = Signal(str)
    statusChecked = Signal(bool, str, str)  # connected, message, table_name
    cameraUrlsReceived = Signal(str, str)  # camera_main_stream, camera_sub_stream

    def __init__(self, parent: Optional[QObject] = None) -> None:
        super().__init__(parent)
        self._base_url = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
        self._network = QNetworkAccessManager(self)
        self._device_id = _get_device_id()

    @Slot(result=str)
    def getDeviceId(self) -> str:
        """Return this device's unique ID."""
        return self._device_id

    @Slot(str, str)
    def checkStatus(self, device_code: str, device_id: str) -> None:
        """Check if this device is still connected to the table."""
        code = (device_code or "").strip().upper()
        dev_id = (device_id or "").strip()

        if not code or not dev_id:
            self.statusChecked.emit(False, "Invalid parameters", "")
            return

        url = QUrl(f"{self._base_url}/api/areas/device/status")
        request = QNetworkRequest(url)
        request.setRawHeader(b"Accept", b"application/json")
        request.setRawHeader(b"Content-Type", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")

        payload = {
            "device_code": code, 
            "device_id": dev_id,
            "device_ip": _get_local_ip(),
            "device_mac": _get_mac_address(),
            "device_app_version": APP_VERSION
        }
        body = json.dumps(payload).encode("utf-8")
        reply = self._network.post(request, body)
        reply.setProperty("request_type", "status")
        reply.finished.connect(lambda r=reply: self._on_status_finished(r))

    def _on_status_finished(self, reply: QNetworkReply) -> None:
        try:
            if reply.error() != QNetworkReply.NetworkError.NoError:
                # Network error - stay connected (offline mode)
                # Don't disconnect just because network is temporarily unavailable
                error_msg = reply.errorString() or "Network error"
                print(f"[DeviceStatus] Network error (offline mode): {error_msg}")
                self.statusChecked.emit(True, "Offline mode", "")
                return

            raw = bytes(reply.readAll())
            try:
                payload: Dict[str, Any] = json.loads(raw.decode("utf-8")) if raw else {}
            except Exception:
                # Invalid response - treat as network issue, stay connected
                print("[DeviceStatus] Invalid JSON response, staying connected")
                self.statusChecked.emit(True, "Invalid response", "")
                return

            connected = bool(payload.get("connected"))
            message = str(payload.get("message") or "")
            table_name = str(payload.get("table_name") or "")
            print(f"[DeviceStatus] Server response: connected={connected}, message={message}, table_name={table_name}")

            # Only disconnect when server EXPLICITLY says device is not connected
            self.statusChecked.emit(connected, message, table_name)

            # Emit camera URLs if connected (even if empty, to clear them out)
            if connected:
                cam_main = str(payload.get("camera_main_stream") or "")
                cam_sub = str(payload.get("camera_sub_stream") or "")
                print(f"[DeviceStatus] Camera URLs from server: main='{cam_main}', sub='{cam_sub}'")
                self.cameraUrlsReceived.emit(cam_main, cam_sub)
        finally:
            reply.deleteLater()

    @Slot(str)
    def verifyDeviceCode(self, device_code: str) -> None:
        code = (device_code or "").strip().upper()
        if len(code) != 6:
            self.activationFailed.emit("Invalid device code")
            return

        url = QUrl(f"{self._base_url}/api/areas/device/verify")
        request = QNetworkRequest(url)
        request.setRawHeader(b"Accept", b"application/json")
        request.setRawHeader(b"Content-Type", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")

        # Include device info in the request
        payload = {
            "device_code": code,
            "device_type": "AZ Scoreboard",
            "device_os": _get_os_info(),
            "device_id": self._device_id,
            "device_app_version": APP_VERSION,
            "device_ip": _get_local_ip(),
            "device_mac": _get_mac_address()
        }
        body = json.dumps(payload).encode("utf-8")
        reply = self._network.post(request, body)
        reply.setProperty("device_code", code)
        reply.setProperty("request_type", "verify")
        reply.finished.connect(lambda r=reply: self._on_verify_finished(r))

    def _on_verify_finished(self, reply: QNetworkReply) -> None:
        try:
            code = str(reply.property("device_code") or "")

            status_code = reply.attribute(QNetworkRequest.HttpStatusCodeAttribute)
            status_code = _to_int(status_code, 0)

            if reply.error() != QNetworkReply.NetworkError.NoError:
                msg = reply.errorString() or "Request failed"
                if status_code:
                    msg = f"HTTP {status_code}: {msg}"
                self.activationFailed.emit(msg)
                return

            raw = bytes(reply.readAll())
            try:
                payload: Dict[str, Any] = json.loads(raw.decode("utf-8")) if raw else {}
            except Exception:
                self.activationFailed.emit("Invalid JSON response")
                return

            success = bool(payload.get("success"))
            message = str(payload.get("message") or "")
            table_id = _to_int(payload.get("table_id"), 0)
            area_id = _to_int(payload.get("area_id"), 0)
            table_name = str(payload.get("table_name") or "")

            if not success:
                self.activationFailed.emit(message or "Device code not found")
                return

            self.activationFinished.emit(True, code, table_id, area_id, message, table_name)

            # Emit camera URLs (even if empty, to clear them out)
            cam_main = str(payload.get("camera_main_stream") or "")
            cam_sub = str(payload.get("camera_sub_stream") or "")
            self.cameraUrlsReceived.emit(cam_main, cam_sub)
        finally:
            reply.deleteLater()
