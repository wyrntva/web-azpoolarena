"""
Image Cache Service - Downloads and caches ANY remote image locally.
Provides a generic mechanism for QML to resolve remote URLs → local file:// URLs.
Automatically deletes stale images when they're no longer referenced.
"""
import os
import json
import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Optional
from PySide6.QtCore import QObject, Signal, Slot, QUrl
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply

logger = logging.getLogger(__name__)


class ImageCacheService(QObject):
    """Generic image cache: download remote images → local files."""

    # Signal: emitted when a single image finishes downloading
    # Args: (remote_url, local_file_url)  — local_file_url is "" on failure
    imageCached = Signal(str, str)

    # Signal: emitted when a batch of images finishes downloading
    # Args: (category, remote_urls_list, local_urls_list)
    batchCached = Signal(str, list, list)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._network = QNetworkAccessManager(self)
        self._api_base_url = os.getenv('POOLARENA_API_BASE_URL', 'http://localhost:8000')

        # cache dir: <app_dir>/cache/images/<category>/
        app_dir = Path(__file__).resolve().parent.parent
        self._cache_dir = str(app_dir / "cache" / "images")
        os.makedirs(self._cache_dir, exist_ok=True)

        # In-memory lookup: remote_url → local file:// URL
        self._url_map: Dict[str, str] = {}

        # Pending download tracking per category
        self._pending: Dict[str, Dict[str, str]] = {}    # cat → {url: local_path}
        self._pending_ctx: Dict[str, dict] = {}           # cat → context

        # Load manifests from disk
        self._load_all_manifests()

    # ── helpers ──────────────────────────────────────────────

    def _cat_dir(self, category: str) -> str:
        d = os.path.join(self._cache_dir, category)
        os.makedirs(d, exist_ok=True)
        return d

    @staticmethod
    def _url_to_filename(url: str) -> str:
        path = url.split('?')[0]
        ext = os.path.splitext(path)[1] or '.png'
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        base = os.path.splitext(os.path.basename(path))[0][:30]
        return f"{base}_{url_hash}{ext}"

    def _manifest_path(self, category: str) -> str:
        return os.path.join(self._cat_dir(category), "manifest.json")

    def _full_url(self, url: str) -> str:
        """Resolve relative backend URL to absolute."""
        if not url:
            return ""
        if url.startswith("http") or url.startswith("file:"):
            return url
        if url.startswith("/"):
            return f"{self._api_base_url}{url}"
        return f"{self._api_base_url}/{url}"

    # ── manifest persistence ─────────────────────────────────

    def _load_all_manifests(self):
        """Load all category manifests from disk on startup."""
        if not os.path.isdir(self._cache_dir):
            return
        for cat_name in os.listdir(self._cache_dir):
            cat_path = os.path.join(self._cache_dir, cat_name)
            if not os.path.isdir(cat_path):
                continue
            manifest_file = os.path.join(cat_path, "manifest.json")
            if not os.path.exists(manifest_file):
                continue
            try:
                with open(manifest_file, 'r') as f:
                    manifest = json.load(f)
                for entry in manifest.get("files", []):
                    remote_url = entry.get("url", "")
                    filename = entry.get("filename", "")
                    local_path = os.path.join(cat_path, filename)
                    if remote_url and os.path.exists(local_path):
                        self._url_map[remote_url] = QUrl.fromLocalFile(local_path).toString()
                logger.info(f"ImageCache: loaded {len(manifest.get('files', []))} entries for '{cat_name}'")
            except Exception as e:
                logger.error(f"ImageCache: failed to load manifest for '{cat_name}': {e}")

    def _save_manifest(self, category: str, files: List[dict]):
        try:
            with open(self._manifest_path(category), 'w') as f:
                json.dump({"files": files}, f, indent=2)
        except Exception as e:
            logger.error(f"ImageCache: failed to save manifest for '{category}': {e}")

    # ── public API ───────────────────────────────────────────

    @Slot(str, result=str)
    def resolve(self, remote_url: str) -> str:
        """
        Resolve a remote URL to a local file URL if cached.
        Returns the local file:// URL, or "" if not cached yet.
        """
        full = self._full_url(remote_url)
        return self._url_map.get(full, "")

    @Slot(str, str)
    def ensureCached(self, remote_url: str, category: str = "general"):
        """
        Ensure a single image is downloaded and cached.
        Emits imageCached(remote_url, local_url) when done.
        """
        full = self._full_url(remote_url)
        if not full:
            return

        # Already cached?
        if full in self._url_map:
            self.imageCached.emit(full, self._url_map[full])
            return

        cat_dir = self._cat_dir(category)
        filename = self._url_to_filename(full)
        local_path = os.path.join(cat_dir, filename)

        if os.path.exists(local_path):
            local_url = QUrl.fromLocalFile(local_path).toString()
            self._url_map[full] = local_url
            self.imageCached.emit(full, local_url)
            return

        # Download
        self._download_one(full, local_path, category)

    @Slot(str, list)
    def cacheCategory(self, category: str, remote_urls: list):
        """
        Cache a batch of images for a category.
        Downloads new images, deletes stale ones.
        Emits batchCached(category, remote_urls, local_urls) when all done.
        """
        cat_dir = self._cat_dir(category)

        # Resolve all URLs to absolute
        full_urls = [self._full_url(u) for u in remote_urls if u]
        full_urls = [u for u in full_urls if u]  # filter empties

        if not full_urls:
            self._cleanup_category(category)
            self.batchCached.emit(category, [], [])
            return

        already: Dict[str, str] = {}
        need: Dict[str, str] = {}

        for url in full_urls:
            filename = self._url_to_filename(url)
            local_path = os.path.join(cat_dir, filename)
            if os.path.exists(local_path):
                already[url] = local_path
            else:
                need[url] = local_path

        if not need:
            self._finalize_batch(category, full_urls, already)
            return

        self._pending[category] = dict(need)
        self._pending_ctx[category] = {
            'urls': full_urls,
            'already': already,
        }

        for url, local_path in need.items():
            self._download_one(url, local_path, category, batch=True)

    # ── download ─────────────────────────────────────────────

    def _download_one(self, url: str, local_path: str, category: str, batch: bool = False):
        try:
            request = QNetworkRequest(QUrl(url))
            reply = self._network.get(request)
            reply.finished.connect(
                lambda u=url, lp=local_path, cat=category, b=batch, r=reply:
                    self._on_downloaded(r, u, lp, cat, b)
            )
        except Exception as e:
            logger.error(f"ImageCache: failed to start download {url}: {e}")
            if batch:
                self._on_batch_item_done(category, url)

    def _on_downloaded(self, reply: QNetworkReply, url: str, local_path: str,
                       category: str, batch: bool):
        try:
            if reply.error() != QNetworkReply.NetworkError.NoError:
                logger.error(f"ImageCache: download failed {url}: {reply.errorString()}")
                if not batch:
                    self.imageCached.emit(url, "")
                return

            data = bytes(reply.readAll())
            if not data:
                logger.error(f"ImageCache: empty response for {url}")
                if not batch:
                    self.imageCached.emit(url, "")
                return

            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, 'wb') as f:
                f.write(data)

            local_url = QUrl.fromLocalFile(local_path).toString()
            self._url_map[url] = local_url
            logger.info(f"ImageCache: downloaded {url} → {local_path} ({len(data)} bytes)")

            if not batch:
                self.imageCached.emit(url, local_url)
                # Update manifest for single downloads
                self._update_single_manifest(category, url, os.path.basename(local_path))

        except Exception as e:
            logger.error(f"ImageCache: failed to save {url}: {e}")
            if not batch:
                self.imageCached.emit(url, "")
        finally:
            reply.deleteLater()
            if batch:
                self._on_batch_item_done(category, url)

    def _on_batch_item_done(self, category: str, url: str):
        pending = self._pending.get(category)
        if pending is None:
            return
        pending.pop(url, None)
        if pending:
            return

        ctx = self._pending_ctx.pop(category, {})
        full_urls = ctx.get('urls', [])
        already = ctx.get('already', {})
        self._pending.pop(category, None)

        url_to_path = dict(already)
        cat_dir = self._cat_dir(category)
        for u in full_urls:
            if u not in url_to_path:
                lp = os.path.join(cat_dir, self._url_to_filename(u))
                if os.path.exists(lp):
                    url_to_path[u] = lp

        self._finalize_batch(category, full_urls, url_to_path)

    # ── finalize ─────────────────────────────────────────────

    def _finalize_batch(self, category: str, remote_urls: List[str],
                        url_to_path: Dict[str, str]):
        cat_dir = self._cat_dir(category)
        local_urls: List[str] = []
        manifest_files: List[dict] = []
        valid_filenames = {"manifest.json"}

        for url in remote_urls:
            lp = url_to_path.get(url)
            if lp and os.path.exists(lp):
                local_url = QUrl.fromLocalFile(lp).toString()
                local_urls.append(local_url)
                self._url_map[url] = local_url
                fn = os.path.basename(lp)
                manifest_files.append({"url": url, "filename": fn})
                valid_filenames.add(fn)

        # Delete stale files
        for existing in os.listdir(cat_dir):
            if existing not in valid_filenames:
                old = os.path.join(cat_dir, existing)
                try:
                    os.remove(old)
                    # Remove from url_map
                    stale_keys = [k for k, v in self._url_map.items()
                                  if v == QUrl.fromLocalFile(old).toString()]
                    for k in stale_keys:
                        del self._url_map[k]
                    logger.info(f"ImageCache: deleted stale {old}")
                except Exception as e:
                    logger.error(f"ImageCache: failed to delete {old}: {e}")

        self._save_manifest(category, manifest_files)
        self.batchCached.emit(category, remote_urls, local_urls)
        logger.info(f"ImageCache: finalized {len(local_urls)} image(s) for '{category}'")

    def _update_single_manifest(self, category: str, url: str, filename: str):
        """Append a single entry to the manifest (for non-batch downloads)."""
        manifest_file = self._manifest_path(category)
        files = []
        if os.path.exists(manifest_file):
            try:
                with open(manifest_file, 'r') as f:
                    files = json.load(f).get("files", [])
            except Exception:
                pass
        # Check if already present
        if not any(e.get("url") == url for e in files):
            files.append({"url": url, "filename": filename})
            self._save_manifest(category, files)

    def _cleanup_category(self, category: str):
        cat_dir = self._cat_dir(category)
        for f in os.listdir(cat_dir):
            fp = os.path.join(cat_dir, f)
            try:
                os.remove(fp)
            except Exception as e:
                logger.error(f"ImageCache: failed to clean {fp}: {e}")
