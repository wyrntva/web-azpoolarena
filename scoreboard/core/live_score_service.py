from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

from PySide6.QtCore import QObject, QTimer, QUrl, Slot
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply


class LiveScoreService(QObject):
    """Gửi tỉ số tự do (ScorePage / MultiScorePage) về backend theo thời gian thực."""

    def __init__(self, device_settings: Optional[QObject] = None, parent: Optional[QObject] = None) -> None:
        super().__init__(parent)
        self._base_url = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
        self._network = QNetworkAccessManager(self)
        self._device_settings = device_settings

        self._pending: Optional[Dict[str, Any]] = None
        self._debounce = QTimer(self)
        self._debounce.setSingleShot(True)
        self._debounce.setInterval(400)
        self._debounce.timeout.connect(self._flush)

    def _table_name(self) -> str:
        if self._device_settings is not None:
            try:
                return str(self._device_settings.getTableName() or "")
            except Exception:
                pass
        return ""

    @Slot(str, str)
    def reportScore(self, mode: str, players_json: str) -> None:
        """QML gọi khi điểm thay đổi. mode = 'two' | 'multi' | 'cards' | 'multiQuick'."""
        try:
            players = json.loads(players_json)
        except Exception:
            return
        self._pending = {
            "table_name": self._table_name(),
            "mode": mode,
            "players": players,
        }
        self._debounce.start()

    @Slot()
    def clearScore(self) -> None:
        """QML gọi khi rời ScorePage/MultiScorePage để xóa tỉ số khỏi backend."""
        table = self._table_name()
        if not table:
            return
        self._debounce.stop()
        self._pending = None
        from PySide6.QtCore import QUrlQuery
        url = QUrl(f"{self._base_url}/api/tournaments/device/live-score")
        query = QUrlQuery()
        query.addQueryItem("table_name", table)
        url.setQuery(query)
        request = QNetworkRequest(url)
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        print(f"[LiveScoreService] clearScore {table}")
        reply = self._network.deleteResource(request)
        reply.finished.connect(reply.deleteLater)

    def _flush(self) -> None:
        if not self._pending:
            return
        payload = self._pending
        self._pending = None

        if not payload.get("table_name"):
            return

        url_str = f"{self._base_url}/api/tournaments/device/live-score"
        request = QNetworkRequest(QUrl(url_str))
        request.setRawHeader(b"Content-Type", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        body = json.dumps(payload).encode("utf-8")
        print(f"[LiveScoreService] {payload['table_name']} mode={payload['mode']} players={len(payload['players'])}")
        reply = self._network.put(request, body)
        reply.finished.connect(reply.deleteLater)
