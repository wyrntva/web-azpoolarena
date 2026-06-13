from __future__ import annotations

import json
import os
import time
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
    tableFeePaymentReady = Signal(bool, str, int, str)  # skip, qr_url, amount, code
    tableFeePaymentStatus = Signal(bool)                 # paid

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
        self._start_times: Dict[int, float] = self._load_start_times()

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
        # NOTE: Do NOT call fetchActiveMatch here after score updates.
        # The local Controller already holds the correct score, and calling
        # fetchActiveMatch immediately can cause a race condition where an
        # older server response overwrites the current local score (especially
        # when the user taps quickly). The periodic 10s timer handles sync.
        # Only fetch after a winner is decided (match completed) so the page
        # can detect the completed state and navigate away if needed.
        if winner_id > 0:
            reply.finished.connect(self.fetchActiveMatch)
        reply.finished.connect(reply.deleteLater)

    @Slot(int, int)
    def requestTableFeePayment(self, match_id: int, elapsed_sec: int) -> None:
        """Called from QML when match ends — requests table fee payment info."""
        url_str = f"{self._base_url}/api/tournaments/device/active-match/{match_id}/table-fee-payment"
        request = QNetworkRequest(QUrl(url_str))
        request.setRawHeader(b"Content-Type", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        body = json.dumps({"elapsed_sec": elapsed_sec}).encode("utf-8")
        reply = self._network.post(request, body)
        reply.finished.connect(lambda r=reply: self._on_table_fee_payment_reply(r))

    def _on_table_fee_payment_reply(self, reply: QNetworkReply) -> None:
        try:
            if reply.error() != QNetworkReply.NetworkError.NoError:
                print(f"[TournamentService] Table fee payment error: {reply.errorString()}")
                self.tableFeePaymentReady.emit(True, "", 0, "")
                return
            raw = bytes(reply.readAll())
            data = json.loads(raw.decode("utf-8")) if raw else {}
            if data.get("skip"):
                self.tableFeePaymentReady.emit(True, "", 0, "")
            else:
                self.tableFeePaymentReady.emit(
                    False,
                    str(data.get("qr_url", "")),
                    int(data.get("amount", 0)),
                    str(data.get("payment_code", "")),
                )
        except Exception as e:
            print(f"[TournamentService] Table fee payment reply error: {e}")
            self.tableFeePaymentReady.emit(True, "", 0, "")
        finally:
            reply.deleteLater()

    @Slot(int, str)
    def cancelTableFeePayment(self, match_id: int, code: str) -> None:
        """Called from QML when the user cancels the table fee payment dialog."""
        url_str = f"{self._base_url}/api/tournaments/device/active-match/{match_id}/table-fee-payment/cancel"
        request = QNetworkRequest(QUrl(url_str))
        request.setRawHeader(b"Content-Type", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        body = json.dumps({"code": code}).encode("utf-8")
        reply = self._network.post(request, body)
        reply.finished.connect(reply.deleteLater)

    @Slot(int, str)
    def checkTableFeePayment(self, match_id: int, code: str) -> None:
        """Polls backend for table fee payment status."""
        url_str = f"{self._base_url}/api/tournaments/device/active-match/{match_id}/table-fee-payment/status?code={code}"
        request = QNetworkRequest(QUrl(url_str))
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        reply = self._network.get(request)
        reply.finished.connect(lambda r=reply: self._on_table_fee_status_reply(r))

    def _on_table_fee_status_reply(self, reply: QNetworkReply) -> None:
        try:
            if reply.error() != QNetworkReply.NetworkError.NoError:
                return
            raw = bytes(reply.readAll())
            data = json.loads(raw.decode("utf-8")) if raw else {}
            self.tableFeePaymentStatus.emit(bool(data.get("paid", False)))
        except Exception as e:
            print(f"[TournamentService] Table fee status reply error: {e}")
        finally:
            reply.deleteLater()

    # ==== Match start time persistence ====

    def _start_times_path(self) -> str:
        runtime_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "runtime")
        return os.path.join(runtime_dir, "match_start_times.json")

    def _load_start_times(self) -> Dict[int, float]:
        try:
            path = self._start_times_path()
            if os.path.exists(path):
                data = json.loads(open(path).read())
                return {int(k): float(v) for k, v in data.items()}
        except Exception:
            pass
        return {}

    def _save_start_times(self) -> None:
        try:
            path = self._start_times_path()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w") as f:
                json.dump({str(k): v for k, v in self._start_times.items()}, f)
        except Exception:
            pass

    @Slot(int)
    def recordMatchStart(self, match_id: int) -> None:
        """Called from QML when both players confirm — saves current timestamp."""
        if match_id <= 0:
            return
        if match_id not in self._start_times:
            self._start_times[match_id] = time.time()
            self._save_start_times()
            print(f"[TournamentService] Match {match_id} start time recorded")

    @Slot(int, result=int)
    def getMatchElapsedSec(self, match_id: int) -> int:
        """Returns elapsed seconds since match start was recorded, or 0 if not found."""
        ts = self._start_times.get(match_id)
        if ts is None:
            return 0
        return max(0, int(time.time() - ts))

    @Slot(int)
    def clearMatchStart(self, match_id: int) -> None:
        """Called from QML when match ends — removes the stored start time."""
        if match_id in self._start_times:
            del self._start_times[match_id]
            self._save_start_times()

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
        reply.finished.connect(self.fetchActiveMatch)
        reply.finished.connect(reply.deleteLater)
