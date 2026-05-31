"""
Camera Controller - Manages camera stream configuration and relay service
"""
import glob
import json
import subprocess
import os
from pathlib import Path
from typing import Optional

from PySide6.QtCore import QObject, Property, Signal, Slot, QTimer


class CameraController(QObject):
    """
    Controller for camera delay relay service.
    Exposes camera settings to QML and manages the relay service.
    """

    # Signals
    streamUrlChanged = Signal()
    delaySecChanged = Signal()
    cameraUrlChanged = Signal()
    streamStatusChanged = Signal()
    errorChanged = Signal()
    forceReload = Signal()  # Emitted when video player should reconnect to new stream

    def __init__(self, parent=None):
        super().__init__(parent)

        # Paths
        self._app_dir = Path(__file__).resolve().parent.parent
        self._config_file = self._app_dir / "config" / "camera.json"
        self._relay_script = self._app_dir / "scripts" / "cam_delay_relay.sh"
        self._record_script = self._app_dir / "scripts" / "cam_record_main.sh"
        self._hls_dir = self._app_dir / "runtime" / "hls"

        # State
        self._camera_url: str = ""
        self._delay_sec: int = 7
        self._local_port: int = 8554
        self._stream_url: str = ""
        self._stream_status: str = "disconnected"  # disconnected, connecting, connected, error
        self._error: str = ""
        self._use_vaapi: str = "auto"

        # Camera update lock - prevents status check from overriding during restart
        self._updating_camera: bool = False

        # Cache for playlist check optimization
        self._last_playlist_mtime: float = 0.0

        # Load config
        self._load_config()

        # Status check timer with adaptive interval
        self._status_timer = QTimer(self)
        self._status_timer.timeout.connect(self._check_stream_status)
        self._status_timer.start(2000)  # Initial 2 seconds

        # Startup: restart recording service once after first status check completes
        # This ensures the recording process uses the current camera.json URL,
        # even if a previous GStreamer process was left running with an old URL.
        self._startup_record_restart_done = False
        QTimer.singleShot(35000, self._startup_restart_recording)

        # Auto-start relay on app startup if camera URL is configured but relay isn't running
        if self._camera_url:
            QTimer.singleShot(3000, self._auto_start_relay)

    def _auto_start_relay(self):
        """Auto-start relay with correct URL from camera.json.
        
        On kiosk machines, systemd may have started relay with default camera.env URL
        which could be wrong for this table. Always restart to sync with camera.json.
        """
        if not self._camera_url:
            return
        if self.checkRelayStatus():
            # Relay running (likely from systemd with possibly wrong URL)
            # Restart it with the correct URL from camera.json
            print(f"[CameraController] Relay running, restarting to sync URL: {self._camera_url}")
            self.restartRelay()
        else:
            print(f"[CameraController] Auto-starting relay for: {self._camera_url}")
            self.startRelay()

    def _startup_restart_recording(self):
        """One-time recording service restart on app startup to sync with camera.json."""
        if self._startup_record_restart_done:
            return
        self._startup_record_restart_done = True
        try:
            if self._config_file.exists():
                with open(self._config_file, 'r') as f:
                    config = json.load(f)
                rec_url = config.get("recording", {}).get("rtspUrl", "")
                if rec_url:
                    print(f"[CameraController] Startup: restarting recording service to sync URL: {rec_url}")
                    self.restartRecordService()
                else:
                    print("[CameraController] Startup: no recording URL configured, skipping restart")
        except Exception as e:
            print(f"[CameraController] Startup recording restart error: {e}")

    def _load_config(self):
        """Load configuration from JSON file"""
        try:
            if self._config_file.exists():
                with open(self._config_file, 'r') as f:
                    config = json.load(f)

                # Try new structure first, fall back to legacy keys
                live = config.get("liveStream", {})
                hw = config.get("hardware", {})
                legacy = config.get("_legacy", config)  # fallback to root for old format

                self._camera_url = live.get("rtspUrl") or legacy.get("cameraRtspUrl", "")
                self._delay_sec = live.get("delaySec") or legacy.get("delaySec", 7)
                self._local_port = live.get("hlsPort") or legacy.get("localPort", 8554)
                self._use_vaapi = hw.get("useVaapi") or legacy.get("useVaapi", "auto")

                # Build stream URL
                delay_port = live.get("delayServerPort") or legacy.get("delayServerPort")
                if delay_port:
                    self._stream_url = live.get("localStreamUrl") or legacy.get(
                        "localStreamUrl",
                        f"http://127.0.0.1:{delay_port}/playlist.m3u8"
                    )
                else:
                    self._stream_url = live.get("localStreamUrl") or legacy.get(
                        "localStreamUrl",
                        f"http://127.0.0.1:{self._local_port}/playlist.m3u8"
                    )
        except Exception as e:
            self._error = f"Failed to load config: {e}"
            self.errorChanged.emit()

    def _save_config(self):
        """Save configuration to JSON file"""
        try:
            # Load existing config to preserve recording settings
            existing = {}
            if self._config_file.exists():
                with open(self._config_file, 'r') as f:
                    existing = json.load(f)

            # Get recording settings from existing config
            recording = existing.get("recording", {})
            camera = existing.get("camera", {})

            # Build new config with both new structure and legacy keys
            delay_port = self._local_port + 1  # delay server port = hls port + 1
            config = {
                "_comment": "Camera Configuration - Single source of truth",
                "camera": camera,
                "liveStream": {
                    "_comment": "Channel for live display",
                    "rtspUrl": self._camera_url,
                    "delaySec": self._delay_sec,
                    "hlsPort": self._local_port,
                    "delayServerPort": delay_port,
                    "localStreamUrl": self._stream_url,
                    "segmentSec": existing.get("liveStream", {}).get("segmentSec", 2),
                    "playlistLen": existing.get("liveStream", {}).get("playlistLen", 10)
                },
                "recording": recording,
                "hardware": {
                    "useVaapi": self._use_vaapi
                },
                "_legacy": {
                    "_comment": "Legacy keys for backward compatibility",
                    "cameraRtspUrl": self._camera_url,
                    "dvrCameraRtspUrl": recording.get("rtspUrl", ""),
                    "recordingsDir": recording.get("outputDir", "runtime/recordings"),
                    "recordSegSec": recording.get("segmentSec", 60),
                    "delaySec": self._delay_sec,
                    "localPort": self._local_port,
                    "delayServerPort": delay_port,
                    "localStreamUrl": self._stream_url,
                    "useVaapi": self._use_vaapi,
                    "segmentSec": existing.get("liveStream", {}).get("segmentSec", 2),
                    "playlistLen": existing.get("liveStream", {}).get("playlistLen", 10)
                }
            }

            self._config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self._config_file, 'w') as f:
                json.dump(config, f, indent=4)

            # Also update env file for systemd service
            self._update_env_file(recording)

        except Exception as e:
            self._error = f"Failed to save config: {e}"
            self.errorChanged.emit()

    def _update_env_file(self, recording: dict = None):
        """Update environment file for systemd service"""
        env_file = self._app_dir / "config" / "camera.env"
        recording = recording or {}
        try:
            content = f"""# Camera Delay Relay Configuration
# =================================
# Primary config is in camera.json - this file is for systemd services

# ==================== LIVE STREAM ====================
CAM_URL={self._camera_url}
DELAY_SEC={self._delay_sec}
LOCAL_PORT={self._local_port}
SEGMENT_SEC=2
PLAYLIST_LEN=10

# ==================== RECORDING ====================
DVR_CAM_URL={recording.get('rtspUrl', '')}
OUT_DIR={self._app_dir / recording.get('outputDir', 'runtime/recordings')}
SEG_SEC={recording.get('segmentSec', 60)}
MAX_HOURS={recording.get('maxHours', 6)}
LATENCY_MS={recording.get('latencyMs', 200)}

# ==================== HARDWARE ====================
USE_VAAPI={self._use_vaapi}
"""
            with open(env_file, 'w') as f:
                f.write(content)
        except Exception as e:
            print(f"Warning: Could not update env file: {e}")

    def _check_stream_status(self):
        """Check if HLS stream is available (with mtime cache optimization)"""
        # Skip status check while camera is being updated
        if self._updating_camera:
            return

        playlist = self._hls_dir / "playlist.m3u8"

        old_status = self._stream_status

        if not playlist.exists():
            self._stream_status = "disconnected"
            self._last_playlist_mtime = 0.0
        else:
            try:
                current_mtime = playlist.stat().st_mtime
                # Only read file if mtime changed (saves I/O)
                if current_mtime != self._last_playlist_mtime:
                    self._last_playlist_mtime = current_mtime
                    with open(playlist, 'r') as f:
                        content = f.read()
                    # Check if playlist has segments
                    if ".ts" in content:
                        self._stream_status = "connected"
                    else:
                        self._stream_status = "connecting"
            except Exception:
                self._stream_status = "error"

        # Adaptive timer interval: faster when connecting, slower when stable
        if self._stream_status == "connecting":
            self._status_timer.setInterval(1000)  # Check every 1s when connecting
        elif self._stream_status == "connected":
            self._status_timer.setInterval(5000)  # Check every 5s when connected
        else:
            self._status_timer.setInterval(3000)  # Check every 3s when disconnected

        if old_status != self._stream_status:
            print(f"[CameraController] Stream status: {old_status} -> {self._stream_status}")
            self.streamStatusChanged.emit()

            # Force video player reload when stream comes back after camera update
            if old_status == "connecting" and self._stream_status == "connected":
                print("[CameraController] Stream recovered, waiting for delay server to buffer...")

                def _emit_reload():
                    print("[CameraController] Emitting forceReload signal to video player")
                    self.forceReload.emit()

                # Wait 8s for HLS delay server to buffer enough segments (7s delay)
                QTimer.singleShot(8000, _emit_reload)

    # -------------------------------------------------------------------------
    # Properties for QML
    # -------------------------------------------------------------------------

    @Property(str, notify=streamUrlChanged)
    def streamUrl(self) -> str:
        """Local HLS stream URL for QML Video element"""
        return self._stream_url

    @Property(str, notify=cameraUrlChanged)
    def cameraUrl(self) -> str:
        """RTSP URL of the camera"""
        return self._camera_url

    @cameraUrl.setter
    def cameraUrl(self, value: str):
        if self._camera_url != value:
            self._camera_url = value
            self.cameraUrlChanged.emit()

    @Property(int, notify=delaySecChanged)
    def delaySec(self) -> int:
        """Delay in seconds (0-30)"""
        return self._delay_sec

    @delaySec.setter
    def delaySec(self, value: int):
        value = max(0, min(30, value))
        if self._delay_sec != value:
            self._delay_sec = value
            self.delaySecChanged.emit()

    @Property(str, notify=streamStatusChanged)
    def streamStatus(self) -> str:
        """Stream status: disconnected, connecting, connected, error"""
        return self._stream_status

    @Property(str, notify=errorChanged)
    def error(self) -> str:
        """Last error message"""
        return self._error

    @Property(bool, notify=streamStatusChanged)
    def isConnected(self) -> bool:
        """Whether stream is connected and ready"""
        return self._stream_status == "connected"

    # -------------------------------------------------------------------------
    # Slots for QML
    # -------------------------------------------------------------------------

    @Slot()
    def startRelay(self):
        """Start the camera delay relay service"""
        self._save_config()
        try:
            env = os.environ.copy()
            env["CAM_URL"] = self._camera_url
            env["DELAY_SEC"] = str(self._delay_sec)
            env["LOCAL_PORT"] = str(self._local_port)

            subprocess.run(
                [str(self._relay_script), "start"],
                env=env,
                check=True,
                capture_output=True,
                text=True
            )
            self._stream_status = "connecting"
            self.streamStatusChanged.emit()
            self._error = ""
            self.errorChanged.emit()

        except subprocess.CalledProcessError as e:
            self._error = f"Failed to start relay: {e.stderr}"
            self._stream_status = "error"
            self.errorChanged.emit()
            self.streamStatusChanged.emit()

    @Slot()
    def stopRelay(self):
        """Stop the camera delay relay service"""
        try:
            subprocess.run(
                [str(self._relay_script), "stop"],
                check=True,
                capture_output=True,
                text=True
            )
            self._stream_status = "disconnected"
            self.streamStatusChanged.emit()

        except subprocess.CalledProcessError as e:
            self._error = f"Failed to stop relay: {e.stderr}"
            self.errorChanged.emit()

    @Slot()
    def restartRelay(self):
        """Restart the relay with new settings"""
        self.stopRelay()
        QTimer.singleShot(1000, self.startRelay)

    @Slot(int)
    def setDelay(self, seconds: int):
        """Set delay and restart relay"""
        self.delaySec = seconds
        self._save_config()
        self.restartRelay()

    @Slot(str)
    def setCameraUrl(self, url: str):
        """Set camera URL and restart relay"""
        self.cameraUrl = url
        self._save_config()
        self.restartRelay()

    @Slot()
    def saveConfig(self):
        """Save current configuration"""
        self._save_config()

    @Slot(result=bool)
    def checkRelayStatus(self) -> bool:
        """Check if relay is running"""
        try:
            result = subprocess.run(
                [str(self._relay_script), "status"],
                capture_output=True,
                text=True
            )
            return result.returncode == 0
        except Exception:
            return False

    @Slot(result=str)
    def restartRecordService(self) -> str:
        """Restart the recording service - returns status message"""
        try:
            restart_script = self._app_dir / "scripts" / "restart_services.sh"
            
            # Try without sudo
            result = subprocess.run(
                [str(restart_script), "record"],
                capture_output=True,
                text=True,
                timeout=15
            )

            if result.returncode == 0:
                print("[CameraController] Recording service restarted successfully.")
                return "Recording service restarted"

            # Try with sudo (non-interactive)
            result = subprocess.run(
                ["sudo", "-n", str(restart_script), "record"],
                capture_output=True,
                text=True,
                timeout=15
            )

            if result.returncode == 0:
                print("[CameraController] Recording service restarted via sudo.")
                return "Recording service restarted"
                
            msg = "Run manually: sudo systemctl restart cam-record.service"
            print(f"[CameraController] {msg}")
            return msg

        except Exception as e:
            msg = f"Restart failed: {e}. Run: sudo systemctl restart cam-record.service"
            print(msg)
            return msg

    @Slot(result=str)
    def stopRecordService(self) -> str:
        """Stop the recording service"""
        try:
            # Try to stop systemd service if active
            result = subprocess.run(
                ["systemctl", "is-active", "--quiet", "cam-record"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                subprocess.run(
                    ["sudo", "-n", "systemctl", "stop", "cam-record"],
                    capture_output=True, text=True, timeout=15
                )
                print("[CameraController] Recording service stopped via systemctl.")
                return "Recording service stopped"
                
            # Fallback: kill process directly
            subprocess.run(["pkill", "-f", "cam_record_main"], check=False)
            print("[CameraController] Recording process killed.")
            return "Recording killed."
        except Exception as e:
            msg = f"Stop failed: {e}"
            print(f"[CameraController] {msg}")
            return msg

    @Slot(result=str)
    def gracefulRestartRecording(self) -> str:
        """
        Gracefully restart recording: send SIGINT to GStreamer process so it
        finalizes the current MP4 segment (via EOS from -e flag), then the
        cam_record_main.sh loop will restart and re-read camera.json for the
        new URL.

        If GStreamer doesn't exit within 10s (EOS stuck on live RTSP), force-kill it.
        The recording loop script will then restart and pick up the new URL.
        """
        import signal
        import threading

        try:
            # Find ONLY the gst-launch-1.0 processes (not timeout wrappers)
            result = subprocess.run(
                ["pgrep", "-x", "-f", "gst-launch-1.0 -e.*splitmuxsink"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode != 0 or not result.stdout.strip():
                print("[CameraController] No GStreamer recording process found, doing full restart...")
                return self.restartRecordService()

            pids = [int(p.strip()) for p in result.stdout.strip().split('\n') if p.strip()]
            print(f"[CameraController] Found {len(pids)} GStreamer recording process(es): {pids}")

            # Send SIGINT to each GStreamer process
            for pid in pids:
                try:
                    os.kill(pid, signal.SIGINT)
                    print(f"[CameraController] SIGINT sent to PID {pid}")
                except ProcessLookupError:
                    print(f"[CameraController] PID {pid} already gone")

            # Watchdog: if GStreamer doesn't exit in 10s, force kill
            def _watchdog(target_pids):
                import time
                for i in range(10):
                    time.sleep(1)
                    alive = []
                    for pid in target_pids:
                        try:
                            os.kill(pid, 0)  # Check if alive
                            alive.append(pid)
                        except ProcessLookupError:
                            pass
                    if not alive:
                        print(f"[CameraController] All GStreamer processes exited after {i+1}s")
                        return
                # Still alive after 10s — force kill
                for pid in alive:
                    try:
                        print(f"[CameraController] GStreamer PID {pid} stuck after 10s, force killing...")
                        os.kill(pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass

            t = threading.Thread(target=_watchdog, args=(pids,), daemon=True)
            t.start()

            print("[CameraController] Graceful restart initiated (10s timeout watchdog active)")
            return "Graceful restart initiated"

        except Exception as e:
            msg = f"Graceful restart failed: {e}, falling back to hard restart"
            print(f"[CameraController] {msg}")
            return self.restartRecordService()

    @Slot(result=str)
    def applyConfigChanges(self) -> str:
        """Save config and restart all camera services"""
        self._save_config()

        restart_script = self._app_dir / "scripts" / "restart_services.sh"
        try:
            # Try without sudo first
            result = subprocess.run(
                [str(restart_script), "all"],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                self._stream_status = "connecting"
                self.streamStatusChanged.emit()
                return "OK"

            # Try with sudo
            result = subprocess.run(
                ["sudo", str(restart_script), "all"],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                self._stream_status = "connecting"
                self.streamStatusChanged.emit()
                return "OK"

            return f"Run: sudo {restart_script} all"

        except subprocess.TimeoutExpired:
            return "Timeout. Run: sudo systemctl restart cam-delay cam-record"
        except Exception as e:
            return f"Error: {e}"

    @Slot(str)
    def setRecordingUrl(self, url: str):
        """Set DVR recording URL and restart recording service"""
        try:
            # Load existing config
            if self._config_file.exists():
                with open(self._config_file, 'r') as f:
                    config = json.load(f)
            else:
                config = {}

            # Update recording URL
            if "recording" not in config:
                config["recording"] = {}
            config["recording"]["rtspUrl"] = url

            # Also update legacy
            if "_legacy" not in config:
                config["_legacy"] = {}
            config["_legacy"]["dvrCameraRtspUrl"] = url

            # Save config
            with open(self._config_file, 'w') as f:
                json.dump(config, f, indent=4)

            # Update env file and restart
            self._update_env_file(config.get("recording", {}))
            self.restartRecordService()

        except Exception as e:
            self._error = f"Failed to set recording URL: {e}"
            self.errorChanged.emit()

    @Slot(str, str)
    def updateFromServer(self, main_stream: str, sub_stream: str):
        """
        Update camera URLs from backend server.
        Called when DeviceActivationService receives camera URLs from /device/status or /device/verify.
        Only restarts services if URLs actually changed.
        Non-blocking: uses QTimer for delayed start after stop.
        """
        main_stream = (main_stream or "").strip()
        sub_stream = (sub_stream or "").strip()

        # Load current config to compare
        current_main = ""
        current_sub = ""
        try:
            if self._config_file.exists():
                with open(self._config_file, 'r') as f:
                    config = json.load(f)
                current_sub = config.get("liveStream", {}).get("rtspUrl", "")
                current_main = config.get("recording", {}).get("rtspUrl", "")
        except Exception:
            pass

        # Check if anything changed (including clearing URLs)
        sub_changed = sub_stream != current_sub
        main_changed = main_stream != current_main

        if not main_changed and not sub_changed:
            return

        # If both URLs are empty AND were already empty, nothing to do
        if not main_stream and not sub_stream and not current_main and not current_sub:
            return

        print(f"[CameraController] Server camera URLs changed!")
        if main_changed:
            print(f"  Main stream: {current_main} -> {main_stream}")
        if sub_changed:
            print(f"  Sub stream:  {current_sub} -> {sub_stream}")

        # Update config file
        try:
            config = {}
            if self._config_file.exists():
                with open(self._config_file, 'r') as f:
                    config = json.load(f)

            if sub_changed:
                if "liveStream" not in config:
                    config["liveStream"] = {}
                config["liveStream"]["rtspUrl"] = sub_stream
                self._camera_url = sub_stream
                self.cameraUrlChanged.emit()
                if "_legacy" not in config:
                    config["_legacy"] = {}
                config["_legacy"]["cameraRtspUrl"] = sub_stream

            if main_changed:
                if "recording" not in config:
                    config["recording"] = {}
                config["recording"]["rtspUrl"] = main_stream
                if "_legacy" not in config:
                    config["_legacy"] = {}
                config["_legacy"]["dvrCameraRtspUrl"] = main_stream

            self._config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self._config_file, 'w') as f:
                json.dump(config, f, indent=4)

            self._update_env_file(config.get("recording", {}))
            print("[CameraController] Config saved")

        except Exception as e:
            print(f"[CameraController] Failed to save config: {e}")
            self._error = f"Failed to update camera URLs: {e}"
            self.errorChanged.emit()
            return

        # If main stream (DVR) changed, gracefully restart recording
        # Config is already saved above — the recording loop will re-read camera.json
        # and pick up the new URL after the current segment is finalized
        if main_changed and main_stream:
            print("[CameraController] Main stream (DVR) changed - graceful restart recording...")
            print(f"[CameraController] Current segment will finish with old URL, next segment uses new URL")
            QTimer.singleShot(500, self.gracefulRestartRecording)
        elif main_changed and not main_stream:
            print("[CameraController] Main stream cleared - stopping recording service...")
            QTimer.singleShot(500, self.stopRecordService)

        # If sub stream didn't change, we're done here
        if not sub_changed:
            return

        # If sub stream URL was cleared, just stop relay and go to disconnected
        if not sub_stream:
            print("[CameraController] Camera URL cleared, stopping relay...")
            relay_script = str(self._relay_script)
            try:
                subprocess.run([relay_script, "stop"], capture_output=True, text=True, timeout=10)
                print("[CameraController] Relay stopped")
            except Exception as e:
                print(f"[CameraController] Relay stop error: {e}")

            # Clean HLS segments
            try:
                hls_dir = str(self._hls_dir)
                for f in glob.glob(os.path.join(hls_dir, "segment*.ts")):
                    os.remove(f)
                playlist = self._hls_dir / "playlist.m3u8"
                if playlist.exists():
                    os.remove(str(playlist))
                print("[CameraController] HLS segments cleaned")
            except Exception as e:
                print(f"[CameraController] HLS cleanup: {e}")

            # Clear stream URL and set disconnected
            self._stream_url = ""
            self.streamUrlChanged.emit()
            self._stream_status = "disconnected"
            self.streamStatusChanged.emit()
            self._updating_camera = False
            print("[CameraController] Camera disconnected - no URL configured")
            return

        # URL was set/changed (not cleared) - restart relay
        # Restore stream URL if it was previously cleared
        if not self._stream_url:
            self._load_config()
            self.streamUrlChanged.emit()
            print(f"[CameraController] Restored stream URL: {self._stream_url}")

        # Lock status to "connecting" during restart
        self._updating_camera = True
        self._stream_status = "connecting"
        self._last_playlist_mtime = 0.0
        self._status_timer.setInterval(1000)
        self.streamStatusChanged.emit()
        print("[CameraController] >>> Status locked to 'connecting', starting restart...")

        relay_script = str(self._relay_script)

        # Step 1: Stop relay (blocking - wait for it to finish)
        try:
            result = subprocess.run(
                [relay_script, "stop"],
                capture_output=True, text=True, timeout=10
            )
            print(f"[CameraController] Relay stopped")
        except Exception as e:
            print(f"[CameraController] Relay stop error: {e}")

        # Step 2: Clean old HLS segments so status check won't see stale data
        try:
            hls_dir = str(self._hls_dir)
            for f in glob.glob(os.path.join(hls_dir, "segment*.ts")):
                os.remove(f)
            playlist = self._hls_dir / "playlist.m3u8"
            if playlist.exists():
                with open(playlist, 'w') as f:
                    f.write("#EXTM3U\n#EXT-X-VERSION:3\n")
            print("[CameraController] Old HLS segments cleaned")
        except Exception as e:
            print(f"[CameraController] HLS cleanup: {e}")

        # Step 3: Start relay after 3 seconds, then unlock status check
        def _delayed_start():
            try:
                env = {**os.environ, "CAM_URL": self._camera_url, "DELAY_SEC": str(self._delay_sec)}
                subprocess.Popen(
                    [relay_script, "start"],
                    env=env,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    start_new_session=True
                )
                print("[CameraController] Relay start initiated")
            except Exception as e:
                print(f"[CameraController] Relay start error: {e}")

            # Unlock status check after another 5s (give relay time to produce segments)
            def _unlock_status():
                self._updating_camera = False
                self._last_playlist_mtime = 0.0
                print("[CameraController] >>> Status check unlocked, will detect new stream")

            QTimer.singleShot(5000, _unlock_status)

        QTimer.singleShot(3000, _delayed_start)
