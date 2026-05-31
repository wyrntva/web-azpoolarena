from __future__ import annotations

from PySide6.QtCore import QObject, Signal, Slot, Property, QSettings


class DeviceSettings(QObject):
    activatedChanged = Signal(bool)
    deviceCodeChanged = Signal(str)
    deviceIdChanged = Signal(str)
    tableIdChanged = Signal(int)
    areaIdChanged = Signal(int)
    tableNameChanged = Signal(str)

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._settings = QSettings("AZ Team", "AZ Scoreboard")

    def _get_str(self, key: str, default: str = "") -> str:
        val = self._settings.value(key, defaultValue=default)
        return str(val) if val is not None else default

    def _get_int(self, key: str, default: int = 0) -> int:
        try:
            return int(self._settings.value(key, defaultValue=default))
        except Exception:
            return default

    def _set_value(self, key: str, value) -> None:
        self._settings.setValue(key, value)

    def getActivated(self) -> bool:
        return self._get_int("device/activated", 0) == 1

    def setActivated(self, v: bool) -> None:
        new_v = 1 if bool(v) else 0
        if new_v != self._get_int("device/activated", 0):
            self._set_value("device/activated", new_v)
            self.activatedChanged.emit(bool(new_v))

    activated = Property(bool, getActivated, setActivated, notify=activatedChanged)

    def getDeviceCode(self) -> str:
        return self._get_str("device/code", "")

    def setDeviceCode(self, code: str) -> None:
        code = (code or "").strip().upper()
        if code != self.getDeviceCode():
            self._set_value("device/code", code)
            self.deviceCodeChanged.emit(code)

    deviceCode = Property(str, getDeviceCode, setDeviceCode, notify=deviceCodeChanged)

    def getTableId(self) -> int:
        return self._get_int("device/table_id", 0)

    def setTableId(self, v: int) -> None:
        try:
            v_int = int(v)
        except Exception:
            v_int = 0
        if v_int != self.getTableId():
            self._set_value("device/table_id", v_int)
            self.tableIdChanged.emit(v_int)

    tableId = Property(int, getTableId, setTableId, notify=tableIdChanged)

    def getAreaId(self) -> int:
        return self._get_int("device/area_id", 0)

    def setAreaId(self, v: int) -> None:
        try:
            v_int = int(v)
        except Exception:
            v_int = 0
        if v_int != self.getAreaId():
            self._set_value("device/area_id", v_int)
            self.areaIdChanged.emit(v_int)

    areaId = Property(int, getAreaId, setAreaId, notify=areaIdChanged)

    def getTableName(self) -> str:
        return self._get_str("device/table_name", "")

    @Slot(str)
    def setTableName(self, v: str) -> None:
        v = (v or "").strip()
        if v != self.getTableName():
            self._set_value("device/table_name", v)
            self.tableNameChanged.emit(v)

    tableName = Property(str, getTableName, setTableName, notify=tableNameChanged)

    def getDeviceId(self) -> str:
        return self._get_str("device/device_id", "")

    def setDeviceId(self, v: str) -> None:
        v = (v or "").strip()
        if v != self.getDeviceId():
            self._set_value("device/device_id", v)
            self.deviceIdChanged.emit(v)

    deviceId = Property(str, getDeviceId, setDeviceId, notify=deviceIdChanged)

    @Slot(str, int, int, str, str)
    def saveActivation(self, device_code: str, table_id: int, area_id: int, device_id: str = "", table_name: str = "") -> None:
        self.setDeviceCode(device_code)
        self.setTableId(table_id)
        self.setAreaId(area_id)
        if device_id:
            self.setDeviceId(device_id)
        if table_name:
            self.setTableName(table_name)
        self.setActivated(True)

    @Slot()
    def clearActivation(self) -> None:
        self.setActivated(False)
        self.setDeviceCode("")
        self.setDeviceId("")
        self.setTableId(0)
        self.setAreaId(0)
        self.setTableName("")
