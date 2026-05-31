from PySide6.QtCore import QObject, Property, Signal, Slot

class Controller(QObject):
    leftScoreChanged  = Signal(int)
    rightScoreChanged = Signal(int)
    leftNameChanged   = Signal(str)
    rightNameChanged  = Signal(str)
    raceToChanged     = Signal(int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._left = 0
        self._right = 0
        self._left_name = "Player A"
        self._right_name = "Player B"
        self._race_to = 9

    # ===== Getters =====
    def getLeftScore(self):  return self._left
    def getRightScore(self): return self._right
    def getLeftName(self):   return self._left_name
    def getRightName(self):  return self._right_name
    def getRaceTo(self):     return self._race_to

    # ===== Setters (để QML gán trực tiếp) =====
    def setLeftScore(self, v):
        try: v = int(v)
        except Exception: v = self._left
        v = max(0, min(999, v))
        if v != self._left:
            self._left = v
            self.leftScoreChanged.emit(self._left)

    def setRightScore(self, v):
        try: v = int(v)
        except Exception: v = self._right
        v = max(0, min(999, v))
        if v != self._right:
            self._right = v
            self.rightScoreChanged.emit(self._right)

    def setLeftNameProp(self, name: str):
        name = (name or "").strip() or "Player A"
        if name != self._left_name:
            self._left_name = name
            self.leftNameChanged.emit(self._left_name)

    def setRightNameProp(self, name: str):
        name = (name or "").strip() or "Player B"
        if name != self._right_name:
            self._right_name = name
            self.rightNameChanged.emit(self._right_name)

    def setRaceToProp(self, n):
        try: n = int(n) if n is not None else self._race_to
        except Exception: n = self._race_to
        n = max(1, min(50, n))
        if n != self._race_to:
            self._race_to = n
            self.raceToChanged.emit(self._race_to)

    # ===== Properties =====
    leftScore  = Property(int, getLeftScore,  setLeftScore,  notify=leftScoreChanged)
    rightScore = Property(int, getRightScore, setRightScore, notify=rightScoreChanged)
    leftName   = Property(str, getLeftName,   setLeftNameProp,   notify=leftNameChanged)
    rightName  = Property(str, getRightName,  setRightNameProp,  notify=rightNameChanged)
    raceTo     = Property(int, getRaceTo,     setRaceToProp,     notify=raceToChanged)

    # ===== Slots =====
    @Slot()
    def incLeft(self): self.setLeftScore(self._left + 1)

    @Slot()
    def decLeft(self):
        if self._left > 0:
            self.setLeftScore(self._left - 1)

    @Slot()
    def incRight(self): self.setRightScore(self._right + 1)

    @Slot()
    def decRight(self):
        if self._right > 0:
            self.setRightScore(self._right - 1)

    @Slot()
    def resetScores(self):
        self.setLeftScore(0)
        self.setRightScore(0)

    @Slot()
    def reset(self):
        self.resetScores()

    @Slot(str, str)
    def setNames(self, left_name, right_name):
        self.setLeftNameProp(left_name)
        self.setRightNameProp(right_name)

    @Slot(int)
    def setRaceTo(self, n):
        self.setRaceToProp(n)

    @Slot()
    def toggleRaceTo(self):
        self.setRaceToProp(11 if self._race_to == 9 else 9)

    @Slot()
    def resetMatch(self):
        """Đặt lại tên và điểm về mặc định."""
        self.setLeftNameProp("Player A")
        self.setRightNameProp("Player B")
        self.setLeftScore(0)
        self.setRightScore(0)
        # Không đụng tới raceTo; nếu muốn reset luôn thì bỏ comment line dưới:
        # self.setRaceToProp(9)

    @Slot()
    def swapSides(self):
        """(Đổi hành vi) Thay vì hoán đổi, giờ reset toàn bộ trận."""
        self.resetMatch()
