import json
import os
from typing import Any, Dict, List, Optional

from PySide6.QtCore import QObject, Property, QUrl, QUrlQuery, Signal, Slot
from PySide6.QtCore import QTimer
from PySide6.QtNetwork import (
    QNetworkAccessManager,
    QNetworkRequest,
    QNetworkReply,
)


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


class RankingsService(QObject):
    """Fetch rankings data from the PoolArena backend and expose it to QML."""

    rankingsLoaded = Signal(str, int, "QVariantList", "QVariantMap")
    requestFailed = Signal(str, int, str)
    loadingChanged = Signal(bool)

    # Request timeout in milliseconds
    REQUEST_TIMEOUT_MS = 15000

    def __init__(self, parent: Optional[QObject] = None) -> None:
        super().__init__(parent)
        # Use the same env var as other services. Set POOLARENA_API_BASE_URL in .env
        # - Production server: https://cms.poolarena.vn (set in .env)
        # - Local dev fallback: http://localhost:8000
        self._base_url = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
        self._network = QNetworkAccessManager(self)
        self._pending_replies: Dict[QNetworkReply, Any] = {}  # reply -> metadata
        self._loading = False

    @Property(bool, notify=loadingChanged)
    def loading(self) -> bool:
        return self._loading

    def _update_loading(self) -> None:
        new_state = bool(self._pending_replies)
        if self._loading != new_state:
            self._loading = new_state
            self.loadingChanged.emit(self._loading)

    def _cleanup_reply(self, reply: QNetworkReply) -> None:
        """Clean up a reply and its associated timer."""
        if reply in self._pending_replies:
            timer = self._pending_replies.pop(reply, None)
            if timer and isinstance(timer, QTimer):
                timer.stop()
                timer.deleteLater()
        reply.deleteLater()
        self._update_loading()

    def _on_reply_finished(self, reply: QNetworkReply) -> None:
        """Handle reply completion (slot-based, no closure)."""
        try:
            self._handle_reply(reply)
        finally:
            self._cleanup_reply(reply)

    @Slot(str, int, int)
    def fetchRankings(self, rank_filter: str = "all", page: int = 1, limit: int = 20) -> None:
        """Fetch rankings list from backend."""
        params: Dict[str, Any] = {
            "include": "player,rank",
            "sort": "-points",
            "page": page,
            "limit": limit,
        }
        if rank_filter and rank_filter != "all":
            params["filter[rank_id]"] = rank_filter

        url = QUrl(f"{self._base_url}/api/rankings")
        query = QUrlQuery()
        for key, value in params.items():
            query.addQueryItem(str(key), str(value))
        url.setQuery(query)

        request = QNetworkRequest(url)
        request.setRawHeader(b"Accept", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        # Set transfer timeout (Qt 6.2+)
        try:
            request.setTransferTimeout(self.REQUEST_TIMEOUT_MS)
        except AttributeError:
            pass  # Qt < 6.2

        reply = self._network.get(request)
        reply.setProperty("filter", rank_filter)
        reply.setProperty("page", page)
        reply.setProperty("limit", limit)

        # Create timeout timer as fallback for older Qt versions
        timeout_timer = QTimer(self)
        timeout_timer.setSingleShot(True)
        timeout_timer.timeout.connect(lambda: self._on_timeout(reply))

        self._pending_replies[reply] = timeout_timer
        self._update_loading()

        # Connect finished signal using lambda to capture reply reference
        reply.finished.connect(lambda r=reply: self._on_reply_finished(r))

        # Start timeout timer
        timeout_timer.start(self.REQUEST_TIMEOUT_MS)

    def _on_timeout(self, reply: QNetworkReply) -> None:
        """Handle request timeout."""
        if reply in self._pending_replies:
            rank_filter = reply.property("filter") or "all"
            page = _to_int(reply.property("page"), 1)
            reply.abort()
            self.requestFailed.emit(rank_filter, page, "Request timeout")
            self._cleanup_reply(reply)

    def _handle_reply(self, reply) -> None:
        rank_filter = reply.property("filter") or "all"
        page = _to_int(reply.property("page"), 1)
        limit = _to_int(reply.property("limit"), 20)

        status_code = reply.attribute(QNetworkRequest.HttpStatusCodeAttribute)
        status_code = _to_int(status_code, 0)

        error_enum = reply.error()
        has_error = (
            error_enum is not None
            and error_enum != QNetworkReply.NetworkError.NoError
        )

        if has_error:
            error_raw = reply.error()
            if isinstance(error_raw, (int, float)):
                error_code = int(error_raw)
            else:
                value_attr = getattr(error_raw, "value", None)
                if isinstance(value_attr, (int, float)):
                    error_code = int(value_attr)
                else:
                    try:
                        error_code = int(error_raw)  # type: ignore[arg-type]
                    except (TypeError, ValueError):
                        error_code = 0
            error_message = reply.errorString() or ""
            if not error_message or error_message.lower() == "unknown error":
                details = []
                if status_code:
                    details.append(f"HTTP {status_code}")
                details.append(f"Qt error {error_code}")
                error_message = ", ".join(details) if details else f"Qt error {error_code}"
            self.requestFailed.emit(rank_filter, page, error_message)
            return

        raw_bytes = bytes(reply.readAll())
        try:
            payload = json.loads(raw_bytes.decode("utf-8")) if raw_bytes else {}
        except json.JSONDecodeError as exc:
            self.requestFailed.emit(rank_filter, page, f"JSON decode error: {exc}")
            return

        data_section = payload.get("data")
        if not isinstance(data_section, list):
            self.requestFailed.emit(rank_filter, page, "Invalid data format")
            return

        processed_items: List[Dict[str, Any]] = []
        for item in data_section:
            if not isinstance(item, dict):
                continue

            player_info = item.get("player") or {}
            if isinstance(player_info, dict):
                player = {
                    "id": player_info.get("id"),
                    "name": player_info.get("name", ""),
                    "avatar_url": player_info.get("avatar_url")
                    or player_info.get("avatarUrl")
                    or "",
                }
            else:
                player = {"name": "", "avatar_url": ""}

            rank_info = item.get("rank") or {}
            rank_name = item.get("rank_name")
            if not rank_name and isinstance(rank_info, dict):
                rank_name = rank_info.get("name")

            try:
                points = int(item.get("points", 0))
            except (TypeError, ValueError):
                points = 0

            processed_items.append(
                {
                    "id": str(item.get("id", "")),
                    "points": points,
                    "rank_id": item.get("rank_id")
                    or (rank_info.get("id") if isinstance(rank_info, dict) else None),
                    "rank_name": rank_name or "",
                    "player": player,
                }
            )

        meta_section = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}
        meta = {
            "current_page": _to_int(meta_section.get("current_page"), page),
            "total_pages": _to_int(meta_section.get("total_pages"), 0),
            "total": _to_int(meta_section.get("total"), len(processed_items)),
            "per_page": _to_int(meta_section.get("per_page"), limit),
        }

        self.rankingsLoaded.emit(rank_filter, meta["current_page"], processed_items, meta)
