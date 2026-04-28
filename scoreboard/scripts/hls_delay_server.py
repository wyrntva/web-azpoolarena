#!/usr/bin/env python3
"""
HLS Delay Server - Serves HLS segments with configurable delay

This server acts as a proxy between the HLS segment files and the client,
introducing a configurable delay by only serving segments that are old enough.

Usage:
    python3 hls_delay_server.py [--port PORT] [--delay SECONDS] [--hls-dir DIR]
"""

import sys
import time
import json
import argparse
import math
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import re

# Default configuration
DEFAULT_PORT = 8555
DEFAULT_DELAY = 7
DEFAULT_HLS_DIR = None  # Will be set from config or args


class DelayedHLSHandler(SimpleHTTPRequestHandler):
    """HTTP handler that serves HLS with delay"""

    # Class-level config (set before server starts)
    hls_dir = "."
    delay_seconds = 7

    def __init__(self, *args, **kwargs):
        # Set the directory to serve from
        super().__init__(*args, directory=self.hls_dir, **kwargs)

    def do_GET(self):
        """Handle GET requests with delay logic for playlist"""
        parsed = urlparse(self.path)
        path = parsed.path.lstrip('/')

        if path == 'playlist.m3u8' or path.endswith('/playlist.m3u8'):
            self.serve_delayed_playlist()
        elif path.endswith('.ts'):
            # Serve segment files normally (delay is in playlist)
            super().do_GET()
        elif path == 'status':
            self.serve_status()
        else:
            super().do_GET()

    def serve_delayed_playlist(self):
        """Generate and serve a delayed playlist"""
        playlist_path = Path(self.hls_dir) / 'playlist.m3u8'

        if not playlist_path.exists():
            self.send_error(404, "Playlist not found")
            return

        try:
            with open(playlist_path, 'r', encoding='utf-8') as f:
                original = f.read()

            delayed_playlist = self.create_delayed_playlist(original)

            content = delayed_playlist.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/vnd.apple.mpegurl')
            self.send_header('Content-Length', len(content))
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)

        except Exception as e:
            self.log_error(f"Error serving playlist: {e}")
            self.send_error(500, str(e))

    @staticmethod
    def _extract_seg_num(filename: str) -> int:
        # Allow segment_00001.ts and segment00001.ts
        m = re.search(r'segment_?(\d+)\.ts', filename)
        return int(m.group(1)) if m else -1

    def create_delayed_playlist(self, original_playlist):
        """Tạo playlist delay ổn định.

        Lý do phải làm kiểu này:
        - Playlist gốc của `hlssink` chỉ có `playlist-length` segment (vd 5).
        - Nếu delaySec lớn hơn window này, muốn delay đúng bắt buộc phải "lùi" về
          các segment cũ hơn trong thư mục.

        Chiến lược:
        - Parse playlist gốc để lấy `target_duration`, `media_sequence` và segment mới nhất.
        - Tính `delay_segments = ceil(delaySec / segment_duration)`.
        - Scan thư mục `segment*.ts` để lấy danh sách segment theo số thứ tự.
        - Chọn một "cửa sổ" gồm N segment kết thúc ở (latest - delay_segments).
        """
        raw_lines = [ln.strip() for ln in original_playlist.splitlines()]

        target_duration = 2.0
        seg_entries = []  # (duration, filename) from original playlist

        for ln in raw_lines:
            if not ln:
                continue
            if ln.startswith('#EXT-X-TARGETDURATION:'):
                try:
                    target_duration = float(ln.split(':', 1)[1])
                except Exception:
                    target_duration = 2.0
            elif ln.startswith('#EXTINF:'):
                try:
                    dur_part = ln.split(':', 1)[1]
                    dur = float(dur_part.split(',', 1)[0])
                except Exception:
                    dur = target_duration
                seg_entries.append([dur, None])
            elif ln.endswith('.ts'):
                if seg_entries and seg_entries[-1][1] is None:
                    seg_entries[-1][1] = ln

        seg_entries = [(d, f) for (d, f) in seg_entries if f]

        if not seg_entries:
            return """#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:0\n"""

        seg_duration = seg_entries[0][0] if seg_entries[0][0] > 0 else target_duration
        if seg_duration <= 0: seg_duration = 2.0

        delay_segments = int(math.ceil(self.delay_seconds / seg_duration)) if self.delay_seconds > 0 else 0

        # Parse MEDIA-SEQUENCE của raw playlist để "bám" sát delaySec.
        raw_media_sequence = None
        for ln in raw_lines:
            if ln.startswith('#EXT-X-MEDIA-SEQUENCE:'):
                try:
                    raw_media_sequence = int(ln.split(':', 1)[1])
                except Exception:
                    raw_media_sequence = None
                break

        if raw_media_sequence is None:
            return """#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:0\n"""

        # Với HLS live: MEDIA-SEQUENCE là số của segment ĐẦU TIÊN trong playlist raw.
        # segment cuối (latest trong raw window) = raw_media_sequence + (len(seg_entries)-1)
        latest_num = raw_media_sequence + (len(seg_entries) - 1)

        # Scan thư mục để map num -> filename (dùng để lấy đúng file segment)
        hls_path = Path(self.hls_dir)
        all_files = sorted(
            [
                (self._extract_seg_num(f.name), f.name)
                for f in hls_path.glob('segment*.ts')
                if self._extract_seg_num(f.name) >= 0
            ]
        )
        if not all_files:
            return original_playlist

        min_num, max_num = all_files[0][0], all_files[-1][0]

        # Tính end_num theo delaySegments để bám sát delaySec
        end_num = latest_num - delay_segments

        if end_num < min_num:
            print(f"[DELAY_SERVER] INFO: Not enough segments to meet {self.delay_seconds}s delay. Waiting... (end_num={end_num} < min_num={min_num})", file=sys.stderr)
            return """#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:0\n"""

        window = max(1, len(seg_entries))
        start_num = max(min_num, end_num - (window - 1))

        file_map = dict(all_files)
        out = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            f'#EXT-X-TARGETDURATION:{int(target_duration)}',
            f'#EXT-X-MEDIA-SEQUENCE:{start_num}',
            ''
        ]

        for n in range(start_num, end_num + 1):
            f = file_map.get(n)
            if f:
                out.append(f'#EXTINF:{seg_duration:.6f},')
                out.append(f)

        # Debug log
        # print(f"[DELAY_SERVER] latest={latest_num}, delay_segs={delay_segments}, start={start_num}, end={end_num}", file=sys.stderr)

        return '\n'.join(out)

    def serve_status(self):
        """Serve status information as JSON"""
        playlist_path = Path(self.hls_dir) / 'playlist.m3u8'
        status = {'delay_seconds': self.delay_seconds, 'hls_dir': str(self.hls_dir)}
        try:
            with open(playlist_path, 'r', encoding='utf-8') as f:
                original = f.read()
            status['raw_playlist'] = original
            status['delayed_playlist'] = self.create_delayed_playlist(original)
        except Exception as e:
            status['error'] = str(e)

        content = json.dumps(status, indent=2).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(content))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        if '404' not in str(args) and '500' not in str(args):
            return
        super().log_message(format, *args)

def load_config():
    """Load configuration from camera.json (new structure first, then legacy)"""
    config_file = Path(__file__).resolve().parent.parent / 'config' / 'camera.json'
    config = {'delay': DEFAULT_DELAY, 'port': DEFAULT_PORT, 'hls_dir': str(config_file.parent.parent / 'runtime' / 'hls')}
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                data = json.load(f)

            # Try new structure first (.liveStream), then legacy keys
            live = data.get('liveStream', {})
            legacy = data.get('_legacy', data)

            config['delay'] = live.get('delaySec') or legacy.get('delaySec', DEFAULT_DELAY)
            config['port'] = live.get('delayServerPort') or legacy.get('delayServerPort', DEFAULT_PORT)
        except Exception as e:
            print(f"Warning: Could not load config: {e}", file=sys.stderr)
    return config

def main():
    parser = argparse.ArgumentParser(description='HLS Delay Server')
    parser.add_argument('--port', '-p', type=int, help='Server port')
    parser.add_argument('--delay', '-d', type=float, help='Delay in seconds')
    parser.add_argument('--hls-dir', type=str, help='HLS segments directory')
    args = parser.parse_args()

    config = load_config()
    port = args.port or config['port']
    delay = args.delay if args.delay is not None else config['delay']
    hls_dir = args.hls_dir or config['hls_dir']

    hls_path = Path(hls_dir)
    hls_path.mkdir(parents=True, exist_ok=True)

    DelayedHLSHandler.hls_dir = str(hls_path)
    DelayedHLSHandler.delay_seconds = delay

    server = HTTPServer(('127.0.0.1', port), DelayedHLSHandler)
    print(f"=== HLS Delay Server ===\n  Port: {port}\n  Delay: {delay} seconds\n  HLS Dir: {hls_dir}\n  Stream URL: http://127.0.0.1:{port}/playlist.m3u8\n  Status URL: http://127.0.0.1:{port}/status\n========================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()

if __name__ == '__main__':
    main()
