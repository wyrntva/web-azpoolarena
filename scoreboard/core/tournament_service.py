from __future__ import annotations

import json
import os
import urllib.parse
from typing import Any, Dict, Optional

from PySide6.QtCore import QObject, Property, QTimer, QUrl, Signal, Slot
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply

def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

class TournamentService(QObject):
    """Fetch active tournament match from backend and expose it to QML."""

    matchChanged = Signal()

    def __init__(self, device_settings: Optional[QObject] = None, parent: Optional[QObject] = None) -> None:
        super().__init__(parent)
        self._base_url = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
        self._network = QNetworkAccessManager(self)
        self._refresh_timer = QTimer(self)
        self._refresh_timer.setInterval(10000)  # poll every 10s
        self._refresh_timer.timeout.connect(self.fetchActiveMatch)
        
        self._match: Dict[str, Any] = {}
        self._table_name = ""
        self._device_settings = device_settings

        if device_settings is not None:
            try:
                self._table_name = str(device_settings.getTableName() or "")
                device_settings.tableNameChanged.connect(self._on_table_name_changed)
            except Exception:
                pass

    @Property("QVariantMap", notify=matchChanged)
    def activeMatch(self) -> Dict[str, Any]:
        return self._match

    def _set_match(self, match_data: Dict[str, Any]) -> None:
        if self._match == match_data:
            return
        self._match = match_data
        self.matchChanged.emit()

    def _on_table_name_changed(self, value: str) -> None:
        self._table_name = str(value or "")
        self.fetchActiveMatch()

    @Slot()
    def startAutoRefresh(self) -> None:
        if not self._refresh_timer.isActive():
            self._refresh_timer.start()
            self.fetchActiveMatch()

    @Slot()
    def stopAutoRefresh(self) -> None:
        if self._refresh_timer.isActive():
            self._refresh_timer.stop()

    @Slot()
    def fetchActiveMatch(self) -> None:
        if not self._table_name:
            print("[TournamentService] fetchActiveMatch() -> _table_name is empty!")
            return
            
        encoded_table = urllib.parse.quote(self._table_name)
        url_str = f"{self._base_url}/api/tournaments/device/active-match?table_name={encoded_table}"
        print(f"[TournamentService] Fetching active match: {url_str}")
        url = QUrl(url_str)
        request = QNetworkRequest(url)
        request.setRawHeader(b"Accept", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")

        reply = self._network.get(request)
        reply.finished.connect(lambda r=reply: self._on_reply_finished(r))

    def _on_reply_finished(self, reply: QNetworkReply) -> None:
        try:
            if reply.error() != QNetworkReply.NetworkError.NoError:
                print(f"[TournamentService] Reply error: {reply.error()} - {reply.errorString()}")
                return

            raw_bytes = bytes(reply.readAll())
            try:
                payload = json.loads(raw_bytes.decode("utf-8")) if raw_bytes else None
            except json.JSONDecodeError:
                payload = None

            print(f"[TournamentService] Payload received: {payload}")
            if isinstance(payload, dict):
                # If match status is cancelled/completed, treat as no active match
                status = payload.get("status", "")
                if status in ("cancelled", "completed"):
                    print(f"[TournamentService] Match status is '{status}', treating as no active match")
                    self._set_match({})
                else:
                    self._set_match(payload)
            else:
                self._set_match({})
        finally:
            reply.deleteLater()

    @Slot(int, int, int, int)
    def updateScore(self, match_id: int, p1_score: int, p2_score: int, winner_id: int) -> None:
        """Called directly from QML to update match score immediately."""
        url_str = f"{self._base_url}/api/tournaments/device/active-match/{match_id}/score"
        request = QNetworkRequest(QUrl(url_str))
        request.setRawHeader(b"Content-Type", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        
        payload = {
            "player1_score": p1_score,
            "player2_score": p2_score,
            "status": "ongoing",
            "winner_id": winner_id if winner_id > 0 else None
        }
        
        # If winner is decided, update status
        if winner_id > 0:
            payload["status"] = "completed"
            
        print(f"[TournamentService] Updating score REALTIME -> Match {match_id}: p1={p1_score}, p2={p2_score}, winner={winner_id}")
        
        body = json.dumps(payload).encode("utf-8")
        reply = self._network.put(request, body)
        reply.finished.connect(reply.deleteLater)

    @Slot(int, str, str)
    def updateCheckIn(self, match_id: int, p1_check_in: str, p2_check_in: str) -> None:
        """Called from QML to update player check-in status."""
        url_str = f"{self._base_url}/api/tournaments/device/active-match/{match_id}/check-in"
        request = QNetworkRequest(QUrl(url_str))
        request.setRawHeader(b"Content-Type", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")

        payload: Dict[str, Any] = {}
        if p1_check_in:
            payload["player1_check_in"] = p1_check_in
        if p2_check_in:
            payload["player2_check_in"] = p2_check_in

        if not payload:
            return

        print(f"[TournamentService] Updating check-in -> Match {match_id}: {payload}")

        body_bytes = json.dumps(payload).encode("utf-8")
        reply = self._network.put(request, body_bytes)
        reply.finished.connect(reply.deleteLater)
