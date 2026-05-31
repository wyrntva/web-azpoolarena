from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from PySide6.QtCore import QObject, Property, QTimer, QUrl, Signal, Slot
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


class OrdersService(QObject):
    """Fetch POS orders from backend and expose filtered list to QML."""

    ordersChanged = Signal()
    errorChanged = Signal()
    loadingChanged = Signal(bool)

    REQUEST_TIMEOUT_MS = 15000
    AUTO_REFRESH_MS = 5000

    def __init__(self, device_settings: Optional[QObject] = None, parent: Optional[QObject] = None) -> None:
        super().__init__(parent)
        self._base_url = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
        self._network = QNetworkAccessManager(self)
        self._pending_replies: Dict[QNetworkReply, QTimer] = {}
        self._refresh_timer = QTimer(self)
        self._refresh_timer.setInterval(self.AUTO_REFRESH_MS)
        self._refresh_timer.timeout.connect(self._auto_refresh)

        self._orders: List[Dict[str, Any]] = []
        self._all_orders: List[Dict[str, Any]] = []
        self._error = ""
        self._loading = False

        self._table_id = 0
        self._area_id = 0
        self._device_settings = device_settings

        if device_settings is not None:
            try:
                self._table_id = _to_int(device_settings.getTableId(), 0)
                self._area_id = _to_int(device_settings.getAreaId(), 0)
            except Exception:
                self._table_id = 0
                self._area_id = 0

            try:
                device_settings.tableIdChanged.connect(self._on_table_changed)
                device_settings.areaIdChanged.connect(self._on_area_changed)
            except Exception:
                pass

    @Property("QVariantList", notify=ordersChanged)
    def orders(self) -> List[Dict[str, Any]]:
        return self._orders

    @Property(str, notify=errorChanged)
    def error(self) -> str:
        return self._error

    @Property(bool, notify=loadingChanged)
    def loading(self) -> bool:
        return self._loading

    def _set_error(self, message: str) -> None:
        if message != self._error:
            self._error = message
            self.errorChanged.emit()

    def _set_orders(self, orders: List[Dict[str, Any]]) -> None:
        if self._orders == orders:
            return
        self._orders = orders
        self.ordersChanged.emit()

    def _update_loading(self) -> None:
        new_state = bool(self._pending_replies)
        if self._loading != new_state:
            self._loading = new_state
            self.loadingChanged.emit(self._loading)

    def _cleanup_reply(self, reply: QNetworkReply) -> None:
        if reply in self._pending_replies:
            timer = self._pending_replies.pop(reply, None)
            if timer:
                timer.stop()
                timer.deleteLater()
        reply.deleteLater()
        self._update_loading()

    def _on_table_changed(self, value: int) -> None:
        self._table_id = _to_int(value, 0)
        self._apply_filter()

    def _on_area_changed(self, value: int) -> None:
        self._area_id = _to_int(value, 0)
        self._apply_filter()

    def _apply_filter(self) -> None:
        if self._table_id <= 0 or self._area_id <= 0:
            self._set_orders([])
            return

        filtered: List[Dict[str, Any]] = []
        for order in self._all_orders:
            if not isinstance(order, dict):
                continue
            table_id = _to_int(order.get("tableId") or order.get("table_id"), 0)
            area_id = _to_int(order.get("areaId") or order.get("area_id"), 0)
            status = str(order.get("status") or "").lower()
            order_type = str(order.get("orderType") or order.get("order_type") or "").lower()
            
            # Bỏ qua các order đã thanh toán hoặc đã huỷ (chỉ hiển thị bill hiện tại)
            if status in ("completed", "cancelled", "hoàn thành", "đã hoàn thành", "đã hủy"):
                continue
                
            # Bỏ qua các order gọi từ bảng tỉ số đã được thu ngân XÁC NHẬN.
            # Vì khi thu ngân xác nhận, món đó đã được gộp copy sang 1 order chính "dine-in" rồi -> tránh nhân đôi
            if order_type == "scoreboard" and status in ("confirmed", "đã xác nhận"):
                continue
                
            if table_id == self._table_id and area_id == self._area_id:
                filtered.append(order)

        self._set_orders(filtered)

    @Slot()
    def startAutoRefresh(self) -> None:
        if not self._refresh_timer.isActive():
            self._refresh_timer.start()

    @Slot()
    def stopAutoRefresh(self) -> None:
        if self._refresh_timer.isActive():
            self._refresh_timer.stop()

    @Slot()
    def _auto_refresh(self) -> None:
        if self._pending_replies:
            return
        self.fetchOrders()

    @Slot()
    def fetchOrders(self) -> None:
        if self._pending_replies:
            return
            
        # Include table_id and area_id in request so we don't fetch the entire history
        url_str = f"{self._base_url}/api/pos/orders?table_id={self._table_id}&area_id={self._area_id}"
        url = QUrl(url_str)
        request = QNetworkRequest(url)
        request.setRawHeader(b"Accept", b"application/json")
        request.setRawHeader(b"User-Agent", b"PoolArenaScoreboard/1.0")
        try:
            request.setTransferTimeout(self.REQUEST_TIMEOUT_MS)
        except AttributeError:
            pass

        reply = self._network.get(request)
        reply.finished.connect(lambda r=reply: self._on_reply_finished(r))

        timeout_timer = QTimer(self)
        timeout_timer.setSingleShot(True)
        timeout_timer.timeout.connect(lambda r=reply: self._on_timeout(r))
        self._pending_replies[reply] = timeout_timer
        self._update_loading()
        timeout_timer.start(self.REQUEST_TIMEOUT_MS)

    def _on_timeout(self, reply: QNetworkReply) -> None:
        if reply in self._pending_replies:
            reply.abort()
            self._set_error("Request timeout")
            self._cleanup_reply(reply)

    def _on_reply_finished(self, reply: QNetworkReply) -> None:
        try:
            self._handle_reply(reply)
        finally:
            self._cleanup_reply(reply)

    def _handle_reply(self, reply: QNetworkReply) -> None:
        status_code = reply.attribute(QNetworkRequest.HttpStatusCodeAttribute)
        status_code = _to_int(status_code, 0)

        error_enum = reply.error()
        has_error = (
            error_enum is not None
            and error_enum != QNetworkReply.NetworkError.NoError
        )
        if has_error:
            message = reply.errorString() or ""
            if not message or message.lower() == "unknown error":
                details = []
                if status_code:
                    details.append(f"HTTP {status_code}")
                details.append("Network error")
                message = ", ".join(details)
            self._set_error(message)
            return

        raw_bytes = bytes(reply.readAll())
        try:
            payload = json.loads(raw_bytes.decode("utf-8")) if raw_bytes else []
        except json.JSONDecodeError as exc:
            self._set_error(f"JSON decode error: {exc}")
            return

        orders: List[Dict[str, Any]] = []
        if isinstance(payload, list):
            orders = [o for o in payload if isinstance(o, dict)]
        elif isinstance(payload, dict):
            data = payload.get("data")
            if isinstance(data, list):
                orders = [o for o in data if isinstance(o, dict)]
            else:
                self._set_error("Invalid data format")
                return
        else:
            self._set_error("Invalid data format")
            return

        self._set_error("")
        self._all_orders = orders
        self._apply_filter()
