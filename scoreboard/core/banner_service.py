"""
Banner Service - Fetches banners from PoolArena backend API
Downloads and caches banner images locally for offline use.
When the backend changes banners, new images are downloaded
and old ones are automatically deleted.
"""
import os
import json
import hashlib
import logging
from pathlib import Path
from typing import List, Dict
from PySide6.QtCore import QObject, Signal, Slot, QUrl, QTimer
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply

logger = logging.getLogger(__name__)


class BannerService(QObject):
    """Service to fetch, download, and cache banners from backend API"""

    # Signals
    bannersLoaded = Signal(str, list)  # banner_type, list of local file:// URLs
    requestFailed = Signal(str, str)   # banner_type, error_message
    wifiChanged = Signal()

    ALL_TYPES = ['tournament', 'scoreboard', 'ranking', 'member', 'promo']

    def __init__(self, parent=None):
        super().__init__(parent)
        self.network_manager = QNetworkAccessManager(self)
        self.api_base_url = os.getenv('POOLARENA_API_BASE_URL', 'http://localhost:8000')

        # Local cache directory: <app_dir>/cache/banners/<type>/
        app_dir = Path(__file__).resolve().parent.parent
        self._cache_dir = str(app_dir / "cache" / "banners")
        os.makedirs(self._cache_dir, exist_ok=True)

        # remote URL cache (for change detection)
        self._remote_url_cache: Dict[str, List[str]] = {}
        # local file URL cache (emitted to QML)
        self._local_path_cache: Dict[str, List[str]] = {}

        # Download tracking per banner_type
        self._pending_downloads: Dict[str, Dict[str, str]] = {}
        self._pending_context: Dict[str, dict] = {}

        # WiFi info from store settings
        self._wifi_ssid = ""
        self._wifi_password = ""

        # Load previously cached banners from disk
        self._load_local_cache()

        # Auto-refresh timer (15 seconds)
        self._refresh_timer = QTimer(self)
        self._refresh_timer.timeout.connect(self._auto_refresh)
        self._refresh_timer.setInterval(15 * 1000)

    # ── helpers ──────────────────────────────────────────────

    def _get_type_dir(self, banner_type: str) -> str:
        type_dir = os.path.join(self._cache_dir, banner_type)
        os.makedirs(type_dir, exist_ok=True)
        return type_dir

    @staticmethod
    def _url_to_filename(url: str) -> str:
        """Deterministic filename from a URL (readable + unique hash)."""
        path = url.split('?')[0]
        ext = os.path.splitext(path)[1] or '.png'
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        original = os.path.splitext(os.path.basename(path))[0][:30]
        return f"{original}_{url_hash}{ext}"

    # ── local cache persistence ──────────────────────────────

    def _manifest_path(self, banner_type: str) -> str:
        return os.path.join(self._get_type_dir(banner_type), "manifest.json")

    def _load_local_cache(self):
        """Restore banner cache from disk on startup."""
        for banner_type in self.ALL_TYPES:
            manifest_file = self._manifest_path(banner_type)
            if not os.path.exists(manifest_file):
                continue
            try:
                with open(manifest_file, 'r') as f:
                    manifest = json.load(f)

                type_dir = self._get_type_dir(banner_type)
                remote_urls = manifest.get("urls", [])
                local_paths = []
                for entry in manifest.get("files", []):
                    local_path = os.path.join(type_dir, entry["filename"])
                    if os.path.exists(local_path):
                        local_paths.append(QUrl.fromLocalFile(local_path).toString())

                if local_paths:
                    self._remote_url_cache[banner_type] = remote_urls
                    self._local_path_cache[banner_type] = local_paths
                    logger.info(f"Loaded {len(local_paths)} cached banner(s) for '{banner_type}' from disk")
            except Exception as e:
                logger.error(f"Failed to load banner cache for {banner_type}: {e}")

    def _save_manifest(self, banner_type: str, remote_urls: List[str],
                       files: List[dict]):
        try:
            with open(self._manifest_path(banner_type), 'w') as f:
                json.dump({"urls": remote_urls, "files": files}, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save manifest for {banner_type}: {e}")

    # ── public API ───────────────────────────────────────────

    def start_auto_refresh(self):
        """Start periodic refresh. Emits cached banners immediately."""
        for banner_type, local_paths in self._local_path_cache.items():
            if local_paths:
                self.bannersLoaded.emit(banner_type, local_paths)
        self._refresh_timer.start()

    def stop_auto_refresh(self):
        self._refresh_timer.stop()

    @Slot(str)
    def fetch_banners(self, banner_type: str):
        """Trigger a network fetch (reuses _auto_refresh which fetches all)."""
        self._auto_refresh()

    @Slot(str, result=list)
    def get_cached_banners(self, banner_type: str) -> List[str]:
        """Return cached banners (local file URLs) for a given type."""
        return self._local_path_cache.get(banner_type, [])

    @Slot(result=str)
    def wifiSsid(self) -> str:
        return self._wifi_ssid

    @Slot(result=str)
    def wifiPassword(self) -> str:
        return self._wifi_password

    # ── network fetch ────────────────────────────────────────

    @Slot()
    def _auto_refresh(self):
        try:
            url = QUrl(f"{self.api_base_url}/api/store-settings/public")
            request = QNetworkRequest(url)
            request.setHeader(QNetworkRequest.KnownHeaders.ContentTypeHeader,
                              "application/json")
            reply = self.network_manager.get(request)
            reply.finished.connect(lambda: self._handle_response_all(reply))
        except Exception as e:
            logger.error(f"Failed to fetch banners: {e}")

    def _handle_response_all(self, reply: QNetworkReply):
        try:
            if reply.error() != QNetworkReply.NetworkError.NoError:
                logger.error(f"Network error fetching banners: {reply.errorString()}")
                return

            response = json.loads(bytes(reply.readAll()).decode('utf-8'))

            # Extract WiFi info
            new_ssid = response.get('wifi_ssid', '') or ''
            new_pass = response.get('wifi_password', '') or ''
            if new_ssid != self._wifi_ssid or new_pass != self._wifi_password:
                self._wifi_ssid = new_ssid
                self._wifi_password = new_pass
                self.wifiChanged.emit()
                logger.info(f"WiFi info updated: SSID='{new_ssid}'")

            for banner_type in self.ALL_TYPES:
                banner_data = response.get(f"banner_{banner_type}")
                banner_urls = self._parse_banner_data(banner_data)

                # resolve relative → absolute
                full_urls = []
                for url in banner_urls:
                    if url:
                        full_urls.append(
                            f"{self.api_base_url}{url}" if url.startswith('/') else url
                        )

                # Skip if unchanged
                if self._remote_url_cache.get(banner_type) == full_urls:
                    continue

                logger.info(f"Banner URLs changed for '{banner_type}': "
                            f"{len(full_urls)} banner(s)")
                self._download_banners(banner_type, full_urls)

        except Exception as e:
            logger.error(f"Failed to parse banner response: {e}")
        finally:
            reply.deleteLater()

    @staticmethod
    def _parse_banner_data(banner_data) -> List[str]:
        if not banner_data:
            return []
        try:
            parsed = json.loads(banner_data)
            return parsed if isinstance(parsed, list) else [parsed]
        except (json.JSONDecodeError, TypeError):
            return [banner_data]

    # ── download logic ───────────────────────────────────────

    def _download_banners(self, banner_type: str, remote_urls: List[str]):
        """Compare with local cache, download new images, delete stale ones."""
        type_dir = self._get_type_dir(banner_type)

        # All banners removed on backend
        if not remote_urls:
            self._cleanup_type_dir(banner_type)
            self._remote_url_cache[banner_type] = []
            self._local_path_cache[banner_type] = []
            self._save_manifest(banner_type, [], [])
            self.bannersLoaded.emit(banner_type, [])
            logger.info(f"Cleared all banners for '{banner_type}'")
            return

        # Split into already-cached vs need-download
        already_cached: Dict[str, str] = {}
        need_download: Dict[str, str] = {}

        for url in remote_urls:
            filename = self._url_to_filename(url)
            local_path = os.path.join(type_dir, filename)
            if os.path.exists(local_path):
                already_cached[url] = local_path
            else:
                need_download[url] = local_path

        if not need_download:
            # Everything already on disk – just reorder / cleanup
            self._finalize_banners(banner_type, remote_urls, already_cached)
            return

        # Store context so we can finalize after all downloads finish
        self._pending_downloads[banner_type] = dict(need_download)
        self._pending_context[banner_type] = {
            'remote_urls': remote_urls,
            'already_cached': already_cached,
        }

        for url, local_path in need_download.items():
            self._download_single(banner_type, url, local_path)

    def _download_single(self, banner_type: str, url: str, local_path: str):
        try:
            request = QNetworkRequest(QUrl(url))
            reply = self.network_manager.get(request)
            # Capture loop vars via default args
            reply.finished.connect(
                lambda bt=banner_type, u=url, lp=local_path, r=reply:
                    self._handle_download(r, bt, u, lp)
            )
        except Exception as e:
            logger.error(f"Failed to start download for {url}: {e}")
            self._on_download_complete(banner_type, url)

    def _handle_download(self, reply: QNetworkReply, banner_type: str,
                         url: str, local_path: str):
        try:
            if reply.error() != QNetworkReply.NetworkError.NoError:
                logger.error(f"Download failed for {url}: {reply.errorString()}")
                return

            image_bytes = bytes(reply.readAll())
            if not image_bytes:
                logger.error(f"Empty response downloading {url}")
                return

            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, 'wb') as f:
                f.write(image_bytes)

            logger.info(f"Downloaded banner: {url} → {local_path} "
                        f"({len(image_bytes)} bytes)")
        except Exception as e:
            logger.error(f"Failed to save banner {url}: {e}")
        finally:
            reply.deleteLater()
            self._on_download_complete(banner_type, url)

    def _on_download_complete(self, banner_type: str, url: str):
        """Track per-URL completion; finalize when all downloads are done."""
        pending = self._pending_downloads.get(banner_type)
        if pending is None:
            return
        pending.pop(url, None)

        if pending:
            return  # still waiting for more

        # All downloads finished
        ctx = self._pending_context.pop(banner_type, {})
        remote_urls = ctx.get('remote_urls', [])
        already_cached = ctx.get('already_cached', {})
        self._pending_downloads.pop(banner_type, None)

        # Build full url→path map (both pre-existing + freshly downloaded)
        url_to_path = dict(already_cached)
        type_dir = self._get_type_dir(banner_type)
        for u in remote_urls:
            if u not in url_to_path:
                lp = os.path.join(type_dir, self._url_to_filename(u))
                if os.path.exists(lp):
                    url_to_path[u] = lp

        self._finalize_banners(banner_type, remote_urls, url_to_path)

    # ── finalize & cleanup ───────────────────────────────────

    def _finalize_banners(self, banner_type: str, remote_urls: List[str],
                          url_to_path: Dict[str, str]):
        """Emit signal, save manifest, delete stale files."""
        type_dir = self._get_type_dir(banner_type)

        local_paths: List[str] = []
        manifest_files: List[dict] = []
        valid_filenames: set = {"manifest.json"}

        for url in remote_urls:
            lp = url_to_path.get(url)
            if lp and os.path.exists(lp):
                local_paths.append(QUrl.fromLocalFile(lp).toString())
                fn = os.path.basename(lp)
                manifest_files.append({"url": url, "filename": fn})
                valid_filenames.add(fn)

        # Delete stale files
        for existing in os.listdir(type_dir):
            if existing not in valid_filenames:
                old = os.path.join(type_dir, existing)
                try:
                    os.remove(old)
                    logger.info(f"Deleted old banner: {old}")
                except Exception as e:
                    logger.error(f"Failed to delete {old}: {e}")

        # Update caches
        self._remote_url_cache[banner_type] = remote_urls
        self._local_path_cache[banner_type] = local_paths

        self._save_manifest(banner_type, remote_urls, manifest_files)
        self.bannersLoaded.emit(banner_type, local_paths)
        logger.info(f"Finalized {len(local_paths)} banner(s) for '{banner_type}'")

    def _cleanup_type_dir(self, banner_type: str):
        """Remove all cached files for a banner type."""
        type_dir = self._get_type_dir(banner_type)
        for f in os.listdir(type_dir):
            fp = os.path.join(type_dir, f)
            try:
                os.remove(fp)
            except Exception as e:
                logger.error(f"Failed to clean up {fp}: {e}")
