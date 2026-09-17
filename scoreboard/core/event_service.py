import json
import os
import urllib.parse
from typing import Any, Dict, Optional

from PySide6.QtCore import QObject, Property, QUrl, QUrlQuery, Signal, Slot, QTimer, QByteArray
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply

RANK_ORDER = ["I", "H", "G", "F", "E", "D", "C", "B", "A", "S"]

class EventService(QObject):
    activeEventChanged = Signal()
    playerChecked = Signal(int, bool, "QVariantMap", str)  # slot_index (1 or 2), success, player_data, error_msg
    matchCreated = Signal(bool, "QVariantMap", str)        # success, match_data, error_msg

    def __init__(self, device_settings: Optional[QObject] = None, parent: Optional[QObject] = None) -> None:
        super().__init__(parent)
        self._base_url = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
        self._network = QNetworkAccessManager(self)
        self._device_settings = device_settings
        self._active_event: Dict[str, Any] = {}

    @Property("QVariantMap", notify=activeEventChanged)
    def activeEvent(self) -> Dict[str, Any]:
        return self._active_event

    @Slot()
    def fetchActiveEvent(self) -> None:
        url = QUrl(f"{self._base_url}/api/tournaments/events/active")
        req = QNetworkRequest(url)
        req.setHeader(QNetworkRequest.ContentTypeHeader, "application/json")
        reply = self._network.get(req)
        reply.finished.connect(lambda: self._on_active_event_reply(reply))

    def _on_active_event_reply(self, reply: QNetworkReply) -> None:
        try:
            if reply.error() == QNetworkReply.NoError:
                raw = bytes(reply.readAll()).decode("utf-8")
                data = json.loads(raw) if raw else {}
                if data and isinstance(data, dict) and data.get("id"):
                    self._active_event = data
                    self.activeEventChanged.emit()
                else:
                    self._active_event = {}
                    self.activeEventChanged.emit()
            else:
                self._active_event = {}
                self.activeEventChanged.emit()
        except Exception as e:
            print(f"[EventService] Error fetching active event: {e}")
            self._active_event = {}
            self.activeEventChanged.emit()
        finally:
            reply.deleteLater()

    @Slot(int, str)
    def checkPlayer(self, slot_index: int, phone: str) -> None:
        event_id = self._active_event.get("id")
        if not event_id:
            self.playerChecked.emit(slot_index, False, {}, "Chưa có sự kiện nào đang diễn ra")
            return

        clean_phone = (phone or "").strip()
        if len(clean_phone) < 8:
            self.playerChecked.emit(slot_index, False, {}, "Số điện thoại phải từ 9-11 chữ số")
            return

        encoded_phone = urllib.parse.quote(clean_phone)
        url = QUrl(f"{self._base_url}/api/tournaments/events/check-player?tournament_id={event_id}&phone={encoded_phone}")
        req = QNetworkRequest(url)
        reply = self._network.get(req)
        reply.finished.connect(lambda: self._on_check_player_reply(reply, slot_index))

    def _on_check_player_reply(self, reply: QNetworkReply, slot_index: int) -> None:
        try:
            if reply.error() == QNetworkReply.NoError:
                raw = bytes(reply.readAll()).decode("utf-8")
                data = json.loads(raw) if raw else {}
                if data.get("found"):
                    self.playerChecked.emit(slot_index, True, data.get("player", {}), "")
                else:
                    msg = data.get("message") or "Cơ thủ chưa đăng ký sự kiện này"
                    self.playerChecked.emit(slot_index, False, {}, msg)
            else:
                self.playerChecked.emit(slot_index, False, {}, "Không thể kiểm tra số điện thoại")
        except Exception as e:
            self.playerChecked.emit(slot_index, False, {}, f"Lỗi: {e}")
        finally:
            reply.deleteLater()

    @Slot(int, int, int, int, int, str)
    def createMatch(self, p1_id: int, p2_id: int, race_to: int, p1_score: int, p2_score: int, handicap_desc: str) -> None:
        event_id = self._active_event.get("id")
        if not event_id:
            self.matchCreated.emit(False, {}, "Không tìm thấy sự kiện")
            return

        table_name = "Bàn 1"
        if self._device_settings and hasattr(self._device_settings, "getTableName"):
            table_name = self._device_settings.getTableName() or "Bàn 1"

        payload = {
            "tournament_id": int(event_id),
            "player1_id": int(p1_id),
            "player2_id": int(p2_id),
            "table_name": table_name,
            "race_to": int(race_to),
            "player1_score": int(p1_score),
            "player2_score": int(p2_score),
            "handicap_desc": str(handicap_desc or ""),
        }

        url = QUrl(f"{self._base_url}/api/tournaments/events/create-match")
        req = QNetworkRequest(url)
        req.setHeader(QNetworkRequest.ContentTypeHeader, "application/json")
        body_bytes = QByteArray(json.dumps(payload).encode("utf-8"))
        reply = self._network.post(req, body_bytes)
        reply.finished.connect(lambda: self._on_create_match_reply(reply))

    def _on_create_match_reply(self, reply: QNetworkReply) -> None:
        try:
            if reply.error() == QNetworkReply.NoError:
                raw = bytes(reply.readAll()).decode("utf-8")
                data = json.loads(raw) if raw else {}
                if data.get("success") and data.get("match"):
                    self.matchCreated.emit(True, data.get("match"), "")
                else:
                    self.matchCreated.emit(False, {}, "Không thể tạo trận đấu sự kiện")
            else:
                msg = "Lỗi kết nối máy chủ khi tạo trận đấu"
                try:
                    raw = bytes(reply.readAll()).decode("utf-8")
                    if raw:
                        err_data = json.loads(raw)
                        backend_msg = err_data.get("message")
                        if isinstance(backend_msg, list):
                            backend_msg = backend_msg[0]
                        if backend_msg:
                            msg = str(backend_msg)
                except Exception:
                    pass
                self.matchCreated.emit(False, {}, msg)
        except Exception as e:
            self.matchCreated.emit(False, {}, f"Lỗi: {e}")
        finally:
            reply.deleteLater()
