#!/usr/bin/env python3
"""
Clip Server - HTTP server to cut video segments and provide download links

Endpoints:
    GET /clip?cam=<cam>&start=<iso>&end=<iso>
        - Cuts video from start to end time
        - Returns JSON with download URL

    GET /download/<filename>
        - Serves the clipped video file

    GET /status
        - Returns server status

    GET /qr?url=<url>
        - Returns QR code image (PNG) for the given URL

Usage:
    python3 clip_server.py [--port PORT] [--host HOST]
"""

import os
import sys
import json
import argparse
import subprocess
import hashlib
import time
import threading
from pathlib import Path
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
import io

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from core.dvr_resolver import DVRResolver

DEFAULT_PORT = 8580
DEFAULT_HOST = "0.0.0.0"
CLIP_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "runtime" / "clips"
MAX_CLIP_AGE_HOURS = 24

# Try to import qrcode library
try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False
    print("Warning: qrcode library not installed. QR code generation disabled.", file=sys.stderr)


class ClipHandler(BaseHTTPRequestHandler):
    """HTTP handler for video clipping"""

    recordings_dir = ""
    seg_sec = 60
    output_dir = CLIP_OUTPUT_DIR
    server_base_url = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.lstrip("/")

        if path == "clip":
            self.handle_clip(parse_qs(parsed.query))
        elif path.startswith("download/"):
            filename = path[9:]  # Remove "download/"
            self.handle_download(filename)
        elif path == "status":
            self.handle_status()
        elif path == "qr":
            self.handle_qr(parse_qs(parsed.query))
        else:
            self.send_error(404, "Not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def handle_clip(self, params):
        """Handle clip request: cut video from start to end"""
        try:
            cam = params.get("cam", ["1"])[0]
            start_iso = params.get("start", [None])[0]
            end_iso = params.get("end", [None])[0]

            if not start_iso or not end_iso:
                self.send_json_error(400, "Missing start or end parameter")
                return

            start_iso = unquote(start_iso)
            end_iso = unquote(end_iso)

            # Parse timestamps
            start_dt = self._parse_iso(start_iso)
            end_dt = self._parse_iso(end_iso)

            if end_dt <= start_dt:
                self.send_json_error(400, "End time must be after start time")
                return

            duration = (end_dt - start_dt).total_seconds()
            if duration > 900:  # 15 minutes max
                self.send_json_error(400, "Maximum clip duration is 15 minutes")
                return

            # Generate unique clip filename
            clip_id = self._generate_clip_id(cam, start_iso, end_iso)
            output_file = self.output_dir / f"{clip_id}.mp4"

            # Check if clip already exists
            if output_file.exists():
                download_url = f"{self.server_base_url}/download/{clip_id}.mp4"
                self.send_redirect(download_url)
                return

            # Resolve video files for the time range
            resolver = DVRResolver(self.recordings_dir, self.seg_sec)

            # Get all segments that cover the time range
            segments = self._resolve_segments(resolver, start_dt, end_dt)

            if not segments:
                self.send_json_error(404, "No recordings found for the specified time range")
                return

            # Create output directory
            self.output_dir.mkdir(parents=True, exist_ok=True)

            # Cut the video using ffmpeg
            success = self._cut_video(segments, start_dt, end_dt, output_file)

            if not success:
                self.send_json_error(500, "Failed to cut video")
                return

            download_url = f"{self.server_base_url}/download/{clip_id}.mp4"
            self.send_redirect(download_url)

        except Exception as e:
            print(f"Error handling clip request: {e}", file=sys.stderr)
            self.send_json_error(500, str(e))

    def send_redirect(self, url: str):
        """Send HTTP redirect to the given URL"""
        self.send_response(302)
        self.send_header("Location", url)
        self.send_cors_headers()
        self.end_headers()

    def handle_download(self, filename):
        """Serve a clipped video file"""
        # Sanitize filename to prevent directory traversal
        filename = Path(filename).name
        file_path = self.output_dir / filename

        if not file_path.exists():
            self.send_error(404, "File not found")
            return

        try:
            file_size = file_path.stat().st_size
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", file_size)
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_cors_headers()
            self.end_headers()

            with open(file_path, "rb") as f:
                while chunk := f.read(65536):
                    self.wfile.write(chunk)
        except Exception as e:
            print(f"Error serving file: {e}", file=sys.stderr)

    def handle_status(self):
        """Return server status"""
        # Count clips and calculate total size
        clip_count = 0
        total_size = 0
        if self.output_dir.exists():
            for f in self.output_dir.glob("*.mp4"):
                clip_count += 1
                total_size += f.stat().st_size

        self.send_json_response({
            "ok": True,
            "clipCount": clip_count,
            "totalSizeMB": round(total_size / (1024 * 1024), 2),
            "outputDir": str(self.output_dir),
            "recordingsDir": self.recordings_dir,
            "qrCodeEnabled": HAS_QRCODE,
            "serverBaseUrl": self.server_base_url,
        })

    def handle_qr(self, params):
        """Generate QR code for a URL"""
        if not HAS_QRCODE:
            self.send_json_error(500, "QR code library not installed")
            return

        url = params.get("url", [None])[0]
        if not url:
            self.send_json_error(400, "Missing url parameter")
            return

        url = unquote(url)

        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=2,
            )
            qr.add_data(url)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            # Convert to bytes
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            png_data = buffer.getvalue()

            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", len(png_data))
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(png_data)

        except Exception as e:
            print(f"Error generating QR code: {e}", file=sys.stderr)
            self.send_json_error(500, str(e))

    def _parse_iso(self, iso_str: str) -> datetime:
        """Parse ISO timestamp"""
        s = iso_str.strip().replace(" ", "T")
        return datetime.fromisoformat(s)

    def _generate_clip_id(self, cam: str, start: str, end: str) -> str:
        """Generate unique clip ID from parameters"""
        data = f"{cam}:{start}:{end}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]

    def _resolve_segments(self, resolver: DVRResolver, start_dt: datetime, end_dt: datetime):
        """Resolve all video segments covering the time range"""
        segments = []
        current = start_dt

        while current < end_dt:
            try:
                result = resolver.resolve(current.isoformat())
                seg_info = {
                    "file_path": result.file_path,
                    "seg_start": datetime.fromisoformat(result.seg_start_iso),
                    "seg_end": datetime.fromisoformat(result.seg_end_iso),
                }

                # Avoid duplicates
                if not segments or segments[-1]["file_path"] != seg_info["file_path"]:
                    segments.append(seg_info)

                # Move to next segment
                current = seg_info["seg_end"] + timedelta(seconds=1)
            except FileNotFoundError:
                current += timedelta(seconds=self.seg_sec)
            except Exception as e:
                print(f"Error resolving segment: {e}", file=sys.stderr)
                current += timedelta(seconds=self.seg_sec)

        return segments

    def _cut_video(self, segments, start_dt: datetime, end_dt: datetime, output_file: Path) -> bool:
        """Cut video using ffmpeg"""
        try:
            if len(segments) == 1:
                # Single segment - direct cut
                seg = segments[0]
                ss = (start_dt - seg["seg_start"]).total_seconds()
                duration = (end_dt - start_dt).total_seconds()

                cmd = [
                    "ffmpeg", "-y",
                    "-ss", str(max(0, ss)),
                    "-i", seg["file_path"],
                    "-t", str(duration),
                    "-c:v", "copy",
                    "-c:a", "copy",
                    "-movflags", "+faststart",
                    str(output_file)
                ]
            else:
                # Multiple segments - concat then cut
                # Create concat file
                concat_file = output_file.parent / f"{output_file.stem}_concat.txt"
                with open(concat_file, "w") as f:
                    for seg in segments:
                        f.write(f"file '{seg['file_path']}'\n")

                # Calculate overall offset and duration
                first_seg = segments[0]
                ss = (start_dt - first_seg["seg_start"]).total_seconds()
                duration = (end_dt - start_dt).total_seconds()

                cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(concat_file),
                    "-ss", str(max(0, ss)),
                    "-t", str(duration),
                    "-c:v", "copy",
                    "-c:a", "copy",
                    "-movflags", "+faststart",
                    str(output_file)
                ]

            print(f"Running ffmpeg: {' '.join(cmd)}", file=sys.stderr)
            result = subprocess.run(cmd, capture_output=True, timeout=120)

            # Cleanup concat file if exists
            concat_file = output_file.parent / f"{output_file.stem}_concat.txt"
            if concat_file.exists():
                concat_file.unlink()

            if result.returncode != 0:
                print(f"ffmpeg error: {result.stderr.decode()}", file=sys.stderr)
                return False

            return output_file.exists()

        except Exception as e:
            print(f"Error cutting video: {e}", file=sys.stderr)
            return False

    def send_json_response(self, data: dict):
        content = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(content))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(content)

    def send_json_error(self, code: int, message: str):
        content = json.dumps({"ok": False, "error": message}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(content))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        # Only log errors
        if "404" in str(args) or "500" in str(args):
            super().log_message(format, *args)


def cleanup_old_clips():
    """Remove clips older than MAX_CLIP_AGE_HOURS"""
    while True:
        try:
            cutoff = time.time() - (MAX_CLIP_AGE_HOURS * 3600)
            if CLIP_OUTPUT_DIR.exists():
                for f in CLIP_OUTPUT_DIR.glob("*.mp4"):
                    if f.stat().st_mtime < cutoff:
                        print(f"Removing old clip: {f.name}", file=sys.stderr)
                        f.unlink()
        except Exception as e:
            print(f"Error cleaning up clips: {e}", file=sys.stderr)
        time.sleep(3600)  # Check every hour


def load_config():
    """Load configuration from camera.json"""
    config_file = Path(__file__).resolve().parent.parent / "config" / "camera.json"
    config = {
        "recordings_dir": str(Path(__file__).resolve().parent.parent / "runtime" / "recordings"),
        "seg_sec": 60,
    }

    if config_file.exists():
        try:
            with open(config_file, "r") as f:
                data = json.load(f)

            recording = data.get("recording", {})
            if recording.get("outputDir"):
                rec_dir = Path(recording["outputDir"])
                if not rec_dir.is_absolute():
                    rec_dir = config_file.parent.parent / rec_dir
                config["recordings_dir"] = str(rec_dir.resolve())

            config["seg_sec"] = int(recording.get("segmentSec", 60))
        except Exception as e:
            print(f"Warning: Could not load config: {e}", file=sys.stderr)

    return config


def get_local_ip():
    """Get the local IP address"""
    import socket
    
    # 1. Try to read from camera.json config if available
    try:
        config = load_config()
        # If we have any camera host, try to see which of our IPs can reach it
        camera_host = None
        config_file = Path(__file__).resolve().parent.parent / "config" / "camera.json"
        if config_file.exists():
            with open(config_file, "r") as f:
                data = json.load(f)
                camera_host = data.get("camera", {}).get("host")
        
        if camera_host:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(1)
            # Connecting to the camera host is the best way to find the IP on the same subnet
            s.connect((camera_host, 80))
            ip = s.getsockname()[0]
            s.close()
            if not ip.startswith("127."):
                return ip
    except Exception:
        pass

    # 2. Try to reach the internet (standard method)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(1)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        pass

    # 3. Last resort: use hostname
    try:
        return socket.gethostbyname(socket.gethostname())
    except Exception:
        pass
        
    return "127.0.0.1"


def main():
    parser = argparse.ArgumentParser(description="Clip Server - Cut and download video segments")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT, help="Server port")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help="Server host")
    args = parser.parse_args()

    config = load_config()

    # Set class-level config
    ClipHandler.recordings_dir = config["recordings_dir"]
    ClipHandler.seg_sec = config["seg_sec"]
    ClipHandler.output_dir = CLIP_OUTPUT_DIR

    # Determine server base URL
    local_ip = get_local_ip()
    ClipHandler.server_base_url = f"http://{local_ip}:{args.port}"

    # Create output directory
    CLIP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Start cleanup thread
    cleanup_thread = threading.Thread(target=cleanup_old_clips, daemon=True)
    cleanup_thread.start()

    # Start server
    server = HTTPServer((args.host, args.port), ClipHandler)
    print(f"""
=== Clip Server ===
  Host: {args.host}
  Port: {args.port}
  Local IP: {local_ip}

  Endpoints:
    GET /clip?cam=<cam>&start=<iso>&end=<iso>  - Cut video
    GET /download/<filename>                    - Download clip
    GET /qr?url=<url>                          - Generate QR code
    GET /status                                 - Server status

  Recordings: {config['recordings_dir']}
  Clips: {CLIP_OUTPUT_DIR}
  QR Code: {'Enabled' if HAS_QRCODE else 'Disabled (pip install qrcode[pil])'}
===================
""")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
