import os
import sys
import math
import urllib.request
import urllib.error
import json
import time

# Ép buộc Qt6 sử dụng công cụ dựng hình bằng phần mềm (Software Rendering)
# Giúp OBS dễ dàng bắt hình ảnh (Window Capture) mà không bị lỗi màn hình đen do tăng tốc phần cứng GPU.
os.environ["QT_RHI_BACKEND"] = "software"

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QLabel, QLineEdit, QPushButton,
    QComboBox, QFileDialog, QHBoxLayout, QVBoxLayout, QGridLayout,
    QGroupBox, QSpinBox, QColorDialog, QRadioButton, QButtonGroup, QFrame,
    QCheckBox, QSlider, QKeySequenceEdit, QScrollArea, QDialog, QTabWidget
)
from PyQt6.QtGui import QPixmap, QPainter, QColor, QFont, QPen, QBrush, QIcon, QShortcut, QKeySequence
from PyQt6.QtCore import Qt, QPoint, pyqtSignal, QSize, QRect, QThread, QTimer

PLAYER_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e"]

# Thư mục chứa tài nguyên
ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")

def generate_default_assets():
    """Tự động tạo các tệp tài nguyên mặc định nếu chưa tồn tại."""
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)

    # Khởi tạo một ứng dụng QApplication tạm thời nếu chưa có để tránh lỗi QPaintDevice
    from PyQt6.QtWidgets import QApplication
    app = QApplication.instance()
    if not app:
        app = QApplication([])

    # 1. Cờ Việt Nam mặc định
    flag_vn_path = os.path.join(ASSETS_DIR, "flag_vn.png")
    if not os.path.exists(flag_vn_path):
        pixmap = QPixmap(60, 40)
        pixmap.fill(QColor("#da251d"))  # Màu đỏ cờ Việt Nam
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # Vẽ ngôi sao vàng ở giữa
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#ffff00")))
        
        # Công thức vẽ sao vàng 5 cánh
        center_x, center_y = 30, 20
        r_outer = 12
        r_inner = 4.5
        points = []
        for i in range(10):
            r = r_outer if i % 2 == 0 else r_inner
            angle = i * 36 * 3.14159 / 180 - 3.14159 / 2
            x = center_x + r * math.cos(angle)
            y = center_y + r * math.sin(angle)
            points.append(QPoint(int(x), int(y)))
        
        painter.drawPolygon(points)
        painter.end()
        pixmap.save(flag_vn_path)

    # 2. Ảnh đại diện mặc định
    avatar_path = os.path.join(ASSETS_DIR, "default_avatar.png")
    if not os.path.exists(avatar_path):
        pixmap = QPixmap(100, 100)
        pixmap.fill(QColor("#2c3e50"))
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # Vẽ biểu tượng bóng người đơn giản
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#7f8c8d")))
        # Đầu
        painter.drawEllipse(35, 20, 30, 30)
        # Thân
        painter.drawEllipse(15, 60, 70, 60)
        painter.end()
        pixmap.save(avatar_path)

    # 3. Logo giải đấu mặc định
    logo_path = os.path.join(ASSETS_DIR, "default_logo.png")
    if not os.path.exists(logo_path):
        pixmap = QPixmap(120, 120)
        pixmap.fill(Qt.GlobalColor.transparent)
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # Vẽ quả bóng bi-a số 8 cách điệu
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#1e272e")))
        painter.drawEllipse(10, 10, 100, 100)
        
        painter.setBrush(QBrush(QColor("#ffffff")))
        painter.drawEllipse(30, 30, 60, 60)
        
        painter.setPen(QPen(QColor("#1e272e"), 4))
        font = QFont("Arial", 28, QFont.Weight.Bold)
        painter.setFont(font)
        painter.drawText(pixmap.rect(), Qt.AlignmentFlag.AlignCenter, "8")
        painter.end()
        pixmap.save(logo_path)


class LiveScoreReceiver(QThread):
    """Thread nền poll API backend để nhận tỉ số realtime từ bảng điểm."""
    score_received = pyqtSignal(dict)
    status_changed = pyqtSignal(str)  # "connected", "error: ...", "stopped"

    def __init__(self, api_url: str, table_name: str, interval: int = 2):
        super().__init__()
        self.api_url = api_url.rstrip("/")
        self.table_name = table_name
        self.interval = interval
        self._running = False
        self._last_updated_at = None

    def run(self):
        self._running = True
        self.status_changed.emit("Đang kết nối...")
        while self._running:
            try:
                encoded_name = urllib.request.quote(self.table_name, safe="")
                url = f"{self.api_url}/api/tournaments/device/live-score?table_name={encoded_name}"
                req = urllib.request.Request(url, headers={"User-Agent": "LiveScore-OBS/1.0"})
                with urllib.request.urlopen(req, timeout=4) as resp:
                    raw = resp.read().decode("utf-8")
                    data = json.loads(raw)

                # API trả về dict {table_name: {...}} hoặc list hoặc single object
                if isinstance(data, dict) and "table_name" not in data:
                    data = data.get(self.table_name)
                elif isinstance(data, list):
                    data = next((d for d in data if d.get("table_name") == self.table_name), None)

                if data and isinstance(data, dict):
                    players = data.get("players") or []
                    if len(players) >= 2:
                        updated_at = data.get("updated_at", "")
                        if updated_at != self._last_updated_at:
                            self._last_updated_at = updated_at
                            self.score_received.emit(data)
                        self.status_changed.emit("Đã kết nối")
                    else:
                        self.status_changed.emit("Bàn chưa có trận đang chơi")
                else:
                    self.status_changed.emit("Không nhận được dữ liệu từ bàn này")

            except urllib.error.URLError as e:
                self.status_changed.emit(f"Lỗi: {e.reason}")
            except Exception as e:
                self.status_changed.emit(f"Lỗi: {str(e)[:60]}")

            # Ngủ theo từng 100ms để có thể dừng nhanh
            for _ in range(self.interval * 10):
                if not self._running:
                    break
                QThread.msleep(100)

    def stop(self):
        self._running = False


class ScoreboardOverlay(QWidget):
    """Cửa sổ hiển thị bảng điểm không viền dành cho OBS."""
    def __init__(self, parent_control, index=1):
        super().__init__()
        self.control = parent_control
        self.index = index
        self.init_ui()
        self.drag_position = QPoint()

    def init_ui(self):
        # Thiết lập thuộc tính cửa sổ không viền, luôn ở trên và nền trong suốt
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Window)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setWindowTitle(f"OBS Live Scoreboard Overlay - Bảng {self.index}")
        self.resize(1000, 200)
        self.update_view()

    def apply_window_flags(self, borderless):
        # Lưu lại vị trí trước khi đổi flags để tránh cửa sổ nhảy sang góc khác
        pos = self.pos()
        if borderless:
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Window)
        else:
            self.setWindowFlags(Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Window)
        self.show()
        self.move(pos)

    def update_view(self):
        cfg = self.control.get_config()
        
        opacity = cfg.get("opacity", 1.0)
        self.setWindowOpacity(opacity)
        
        self.resize(1000, 200)
        
        self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_position = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self.drag_position)
            event.accept()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        original_cfg = self.control.get_config()
        cfg = original_cfg.copy()
        
        if not cfg.get("show_flag", True):
            cfg["p1_flag"] = ""
            cfg["p2_flag"] = ""
        if not cfg.get("show_avatar", True):
            cfg["p1_avatar"] = ""
            cfg["p2_avatar"] = ""
        if not cfg.get("show_tour", True):
            cfg["tour_name"] = ""
            
        if cfg["bg_type"] == "Green Screen":
            painter.fillRect(self.rect(), QBrush(QColor("#00ff00")))
        elif cfg["bg_type"] == "Blue Screen":
            painter.fillRect(self.rect(), QBrush(QColor("#0000ff")))
        else:
            painter.fillRect(self.rect(), QBrush(Qt.GlobalColor.transparent))

        # Nếu có nhiều hơn 2 người chơi → dùng layout đa người chơi
        players = cfg.get("players", [])
        if len(players) > 2:
            self.draw_multi_players(painter, cfg, players)
            return

        style = cfg.get(f"style_{self.index}", "Không hiển thị")
        if style == "Không hiển thị":
            return

        if style == "Ngang cao cấp":
            self.draw_premium_horizontal(painter, cfg)
        elif style == "Ngang hiện đại (Có Avatar)":
            self.draw_modern_horizontal_avatar(painter, cfg)
        elif style == "Dọc cao cấp":
            self.draw_premium_vertical(painter, cfg)
        elif style == "Tối giản":
            self.draw_minimalist(painter, cfg)
        elif style == "Ngang đơn giản":
            self.draw_simple_horizontal(painter, cfg)
        elif style == "Thanh ngang phẳng":
            self.draw_flat_bar(painter, cfg)
        else:
            self.draw_simple_vertical(painter, cfg)

    def draw_premium_horizontal(self, painter, cfg):
        # Kích thước khung tổng thể: 900x50 (Thanh mảnh và hiện đại)
        x_start = 50
        y_start = 60
        width = 900
        height = 50

        theme_color = QColor(cfg["theme_color"])

        # 1. Vẽ khung nền chính màu đen mờ (Dark Slate) với viền trắng mảnh
        bg_brush = QBrush(QColor(20, 22, 24, 250))
        border_pen = QPen(QColor(255, 255, 255, 200), 1.5)
        painter.setPen(border_pen)
        painter.setBrush(bg_brush)
        painter.drawRoundedRect(x_start, y_start, width, height, 8, 8)

        # 2. Định nghĩa các font chữ
        font_name = QFont("Segoe UI", 12, QFont.Weight.Bold)
        font_score = QFont("Montserrat", 14, QFont.Weight.Bold)
        font_tour = QFont("Segoe UI", 10, QFont.Weight.Bold)
        font_round = QFont("Segoe UI", 7, QFont.Weight.Bold)

        # ---------------- NGƯỜI CHƠI 1 (Bên trái) ----------------
        # Khung viền cam bao quanh Flag + Name + Score của P1
        p1_box = QRect(x_start + 10, y_start + 7, 280, 36)
        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(QColor(30, 32, 34, 150)))
        painter.drawRoundedRect(p1_box, 4, 4)

        # Vẽ Quốc kỳ Player 1
        flag_rect_1 = QRect(x_start + 18, y_start + 15, 30, 20)
        flag_pix_1 = QPixmap(cfg["p1_flag"])
        if not flag_pix_1.isNull():
            painter.drawPixmap(flag_rect_1, flag_pix_1)

        # Vẽ Tên Player 1
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_name)
        name_rect_1 = QRect(x_start + 55, y_start + 7, 175, 36)
        painter.drawText(name_rect_1, Qt.AlignmentFlag.AlignCenter, cfg["p1_name"])

        # Vẽ Điểm số Player 1
        painter.setFont(font_score)
        score_rect_1 = QRect(x_start + 235, y_start + 7, 50, 36)
        painter.drawText(score_rect_1, Qt.AlignmentFlag.AlignCenter, str(cfg["p1_score"]))

        # Mũi tên chỉ lượt cơ bên phải Player 1 (vẽ hình tam giác hướng sang trái chỉ vào điểm số P1)
        if cfg["active_player"] == 1:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            # Vẽ tam giác hướng sang trái ◀ (chỉ vào điểm P1)
            arrow_x = x_start + 298
            arrow_y = y_start + 20
            points = [
                QPoint(arrow_x + 8, arrow_y),
                QPoint(arrow_x, arrow_y + 5),
                QPoint(arrow_x + 8, arrow_y + 10)
            ]
            painter.drawPolygon(points)

        # ---------------- KHU VỰC GIỮA (Thông tin giải đấu) ----------------
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_tour)
        tour_rect = QRect(x_start + 320, y_start + 8, 260, 20)
        painter.drawText(tour_rect, Qt.AlignmentFlag.AlignCenter, cfg["tour_name"])

        painter.setPen(QPen(QColor("#bdc3c7")))
        painter.setFont(font_round)
        round_rect = QRect(x_start + 320, y_start + 28, 260, 16)
        info_text = f"RACE TO {cfg['race_to']} | {cfg['round_name']}" if cfg.get("show_tour", True) else ""
        painter.drawText(round_rect, Qt.AlignmentFlag.AlignCenter, info_text)

        # ---------------- NGƯỜI CHƠI 2 (Bên phải) ----------------
        # Khung viền cam bao quanh Score + Name + Flag của P2
        p2_box = QRect(x_start + 610, y_start + 7, 280, 36)
        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(QColor(30, 32, 34, 150)))
        painter.drawRoundedRect(p2_box, 4, 4)

        # Vẽ Điểm số Player 2
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_score)
        score_rect_2 = QRect(x_start + 615, y_start + 7, 50, 36)
        painter.drawText(score_rect_2, Qt.AlignmentFlag.AlignCenter, str(cfg["p2_score"]))

        # Vẽ Tên Player 2
        painter.setFont(font_name)
        name_rect_2 = QRect(x_start + 670, y_start + 7, 175, 36)
        painter.drawText(name_rect_2, Qt.AlignmentFlag.AlignCenter, cfg["p2_name"])

        # Vẽ Quốc kỳ Player 2
        flag_rect_2 = QRect(x_start + 852, y_start + 15, 30, 20)
        flag_pix_2 = QPixmap(cfg["p2_flag"])
        if not flag_pix_2.isNull():
            painter.drawPixmap(flag_rect_2, flag_pix_2)

        # Mũi tên chỉ lượt cơ bên trái Player 2 (vẽ hình tam giác hướng sang phải chỉ vào điểm số P2)
        if cfg["active_player"] == 2:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            # Vẽ tam giác hướng sang phải ▶ (chỉ vào điểm P2)
            arrow_x = x_start + 594
            arrow_y = y_start + 20
            points = [
                QPoint(arrow_x - 8, arrow_y),
                QPoint(arrow_x, arrow_y + 5),
                QPoint(arrow_x - 8, arrow_y + 10)
            ]
            painter.drawPolygon(points)

    def draw_modern_horizontal_avatar(self, painter, cfg):
        # Kích thước khung tổng thể: 900x60 (Ngang hiện đại có Avatar)
        x_start = 50
        y_start = 55
        width = 900
        height = 60

        theme_color = QColor(cfg["theme_color"])

        # 1. Vẽ khung nền chính
        bg_brush = QBrush(QColor(20, 22, 24, 250))
        border_pen = QPen(QColor(255, 255, 255, 200), 1.5)
        painter.setPen(border_pen)
        painter.setBrush(bg_brush)
        painter.drawRoundedRect(x_start, y_start, width, height, 10, 10)

        font_name = QFont("Segoe UI", 11, QFont.Weight.Bold)
        font_score = QFont("Montserrat", 15, QFont.Weight.Bold)
        font_tour = QFont("Segoe UI", 10, QFont.Weight.Bold)
        font_round = QFont("Segoe UI", 7, QFont.Weight.Bold)

        # ---------------- NGƯỜI CHƠI 1 (Bên trái) ----------------
        # Khung viền cam bao quanh P1
        p1_box = QRect(x_start + 10, y_start + 8, 305, 44)
        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(QColor(30, 32, 34, 150)))
        painter.drawRoundedRect(p1_box, 5, 5)

        # Avatar Player 1
        avatar_rect_1 = QRect(x_start + 16, y_start + 12, 36, 36)
        avatar_pix_1 = QPixmap(cfg["p1_avatar"])
        if not avatar_pix_1.isNull():
            painter.setPen(QPen(QColor(100, 100, 100), 1))
            painter.setBrush(QBrush(avatar_pix_1.scaled(36, 36, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)))
            painter.drawRoundedRect(avatar_rect_1, 18, 18)  # Tròn

        # Vẽ Quốc kỳ Player 1
        flag_rect_1 = QRect(x_start + 58, y_start + 21, 25, 18)
        flag_pix_1 = QPixmap(cfg["p1_flag"])
        if not flag_pix_1.isNull():
            painter.drawPixmap(flag_rect_1, flag_pix_1)

        # Vẽ Tên Player 1 (Căn giữa)
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_name)
        name_rect_1 = QRect(x_start + 90, y_start + 8, 160, 44)
        painter.drawText(name_rect_1, Qt.AlignmentFlag.AlignCenter, cfg["p1_name"])

        # Vẽ Điểm số Player 1
        painter.setFont(font_score)
        score_rect_1 = QRect(x_start + 255, y_start + 8, 50, 44)
        painter.drawText(score_rect_1, Qt.AlignmentFlag.AlignCenter, str(cfg["p1_score"]))

        # Mũi tên chỉ lượt cơ P1 ◀
        if cfg["active_player"] == 1:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            arrow_x = x_start + 322
            arrow_y = y_start + 25
            points = [
                QPoint(arrow_x + 8, arrow_y),
                QPoint(arrow_x, arrow_y + 5),
                QPoint(arrow_x + 8, arrow_y + 10)
            ]
            painter.drawPolygon(points)

        # ---------------- KHU VỰC GIỮA (Thông tin giải đấu) ----------------
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_tour)
        tour_rect = QRect(x_start + 330, y_start + 10, 240, 20)
        painter.drawText(tour_rect, Qt.AlignmentFlag.AlignCenter, cfg["tour_name"])

        painter.setPen(QPen(QColor("#bdc3c7")))
        painter.setFont(font_round)
        round_rect = QRect(x_start + 330, y_start + 32, 240, 16)
        info_text = f"RACE TO {cfg['race_to']} | {cfg['round_name']}" if cfg.get("show_tour", True) else ""
        painter.drawText(round_rect, Qt.AlignmentFlag.AlignCenter, info_text)

        # ---------------- NGƯỜI CHƠI 2 (Bên phải) ----------------
        # Khung viền cam bao quanh P2
        p2_box = QRect(x_start + 585, y_start + 8, 305, 44)
        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(QColor(30, 32, 34, 150)))
        painter.drawRoundedRect(p2_box, 5, 5)

        # Vẽ Điểm số Player 2
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_score)
        score_rect_2 = QRect(x_start + 590, y_start + 8, 50, 44)
        painter.drawText(score_rect_2, Qt.AlignmentFlag.AlignCenter, str(cfg["p2_score"]))

        # Vẽ Tên Player 2 (Căn giữa)
        painter.setFont(font_name)
        name_rect_2 = QRect(x_start + 650, y_start + 8, 160, 44)
        painter.drawText(name_rect_2, Qt.AlignmentFlag.AlignCenter, cfg["p2_name"])

        # Vẽ Quốc kỳ Player 2
        flag_rect_2 = QRect(x_start + 817, y_start + 21, 25, 18)
        flag_pix_2 = QPixmap(cfg["p2_flag"])
        if not flag_pix_2.isNull():
            painter.drawPixmap(flag_rect_2, flag_pix_2)

        # Avatar Player 2
        avatar_rect_2 = QRect(x_start + 848, y_start + 12, 36, 36)
        avatar_pix_2 = QPixmap(cfg["p2_avatar"])
        if not avatar_pix_2.isNull():
            painter.setPen(QPen(QColor(100, 100, 100), 1))
            painter.setBrush(QBrush(avatar_pix_2.scaled(36, 36, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)))
            painter.drawRoundedRect(avatar_rect_2, 18, 18)  # Tròn

        # Mũi tên chỉ lượt cơ P2 ▶
        if cfg["active_player"] == 2:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            arrow_x = x_start + 570
            arrow_y = y_start + 25
            points = [
                QPoint(arrow_x - 8, arrow_y),
                QPoint(arrow_x, arrow_y + 5),
                QPoint(arrow_x - 8, arrow_y + 10)
            ]
            painter.drawPolygon(points)

    def draw_premium_vertical(self, painter, cfg):
        # Kích thước khung tổng thể: 280x160 (Dọc cao cấp)
        x_start = 360
        y_start = 20
        width = 280
        height = 160

        theme_color = QColor(cfg["theme_color"])

        # Vẽ khung nền chính bóng bẩy (Dark Glassmorphism)
        bg_brush = QBrush(QColor(24, 26, 27, 245))
        border_pen = QPen(theme_color, 2)
        painter.setPen(border_pen)
        painter.setBrush(bg_brush)
        painter.drawRoundedRect(x_start, y_start, width, height, 12, 12)

        # Header: Giải đấu
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        header_rect = QRect(x_start + 10, y_start + 10, 260, 20)
        painter.drawText(header_rect, Qt.AlignmentFlag.AlignCenter, cfg["tour_name"])

        # Sub-header: Race to (ở ngay dưới giải đấu)
        painter.setPen(QPen(QColor("#bdc3c7")))
        painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
        info_rect = QRect(x_start + 10, y_start + 28, 260, 16)
        painter.drawText(info_rect, Qt.AlignmentFlag.AlignCenter, (f"RACE TO {cfg['race_to']} | {cfg['round_name']}" if cfg.get("show_tour", True) else ""))

        # Người chơi 1
        p1_box = QRect(x_start + 10, y_start + 50, 260, 36)
        painter.setPen(QPen(QColor(80, 80, 80), 1))
        painter.setBrush(QBrush(QColor(30, 32, 34, 150)))
        painter.drawRoundedRect(p1_box, 4, 4)

        flag_rect_1 = QRect(x_start + 22, y_start + 59, 24, 16)
        flag_pix_1 = QPixmap(cfg["p1_flag"])
        if not flag_pix_1.isNull():
            painter.drawPixmap(flag_rect_1, flag_pix_1)

        painter.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        painter.setPen(QPen(QColor("#ffffff")))
        name_rect_1 = QRect(x_start + 55, y_start + 50, 150, 36)
        painter.drawText(name_rect_1, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, cfg["p1_name"])

        # Ô điểm P1 màu cam/chủ đạo
        score_box_1 = QRect(x_start + 215, y_start + 53, 40, 30)
        painter.setPen(QPen(theme_color, 1))
        painter.setBrush(QBrush(theme_color.darker(150)))
        painter.drawRoundedRect(score_box_1, 3, 3)
        painter.setFont(QFont("Montserrat", 13, QFont.Weight.Bold))
        painter.setPen(QPen(QColor("#ffffff")))
        painter.drawText(score_box_1, Qt.AlignmentFlag.AlignCenter, str(cfg["p1_score"]))

        # Lượt cơ P1 (Mũi tên hoặc chấm tròn)
        if cfg["active_player"] == 1:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            arrow_x = x_start + 14
            arrow_y = y_start + 63
            points = [
                QPoint(arrow_x, arrow_y),
                QPoint(arrow_x + 5, arrow_y + 4),
                QPoint(arrow_x, arrow_y + 8)
            ]
            painter.drawPolygon(points)

        # Người chơi 2
        p2_box = QRect(x_start + 10, y_start + 94, 260, 36)
        painter.setPen(QPen(QColor(80, 80, 80), 1))
        painter.setBrush(QBrush(QColor(30, 32, 34, 150)))
        painter.drawRoundedRect(p2_box, 4, 4)

        flag_rect_2 = QRect(x_start + 22, y_start + 103, 24, 16)
        flag_pix_2 = QPixmap(cfg["p2_flag"])
        if not flag_pix_2.isNull():
            painter.drawPixmap(flag_rect_2, flag_pix_2)

        painter.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        painter.setPen(QPen(QColor("#ffffff")))
        name_rect_2 = QRect(x_start + 55, y_start + 94, 150, 36)
        painter.drawText(name_rect_2, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, cfg["p2_name"])

        # Ô điểm P2
        score_box_2 = QRect(x_start + 215, y_start + 97, 40, 30)
        painter.setPen(QPen(theme_color, 1))
        painter.setBrush(QBrush(theme_color.darker(150)))
        painter.drawRoundedRect(score_box_2, 3, 3)
        painter.setFont(QFont("Montserrat", 13, QFont.Weight.Bold))
        painter.setPen(QPen(QColor("#ffffff")))
        painter.drawText(score_box_2, Qt.AlignmentFlag.AlignCenter, str(cfg["p2_score"]))

        # Lượt cơ P2
        if cfg["active_player"] == 2:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            arrow_x = x_start + 14
            arrow_y = y_start + 107
            points = [
                QPoint(arrow_x, arrow_y),
                QPoint(arrow_x + 5, arrow_y + 4),
                QPoint(arrow_x, arrow_y + 8)
            ]
            painter.drawPolygon(points)

    def draw_minimalist(self, painter, cfg):
        # Thiết kế tối giản dẹt nổi, không có khung nền chính
        x_start = 50
        y_start = 65
        width = 900
        height = 40

        theme_color = QColor(cfg["theme_color"])

        font_name = QFont("Segoe UI", 12, QFont.Weight.Bold)
        font_score = QFont("Montserrat", 15, QFont.Weight.Bold)
        font_vs = QFont("Impact", 13)

        # ---------------- NGƯỜI CHƠI 1 (Bên trái) ----------------
        # Vẽ Tên Player 1 (Căn phải để sát vào cờ)
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_name)
        name_rect_1 = QRect(x_start + 10, y_start, 220, height)
        painter.drawText(name_rect_1, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, cfg["p1_name"])

        # Quốc kỳ 1
        flag_rect_1 = QRect(x_start + 242, y_start + 10, 30, 20)
        flag_pix_1 = QPixmap(cfg["p1_flag"])
        if not flag_pix_1.isNull():
            painter.drawPixmap(flag_rect_1, flag_pix_1)

        # Ô điểm 1 (Khung vuông bo góc màu cam nổi bật)
        score_box_1 = QRect(x_start + 285, y_start + 4, 55, 32)
        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(theme_color))
        painter.drawRoundedRect(score_box_1, 4, 4)
        painter.setFont(font_score)
        painter.setPen(QPen(QColor("#ffffff")))
        painter.drawText(score_box_1, Qt.AlignmentFlag.AlignCenter, str(cfg["p1_score"]))

        # Mũi tên chỉ lượt cơ P1 ◀
        if cfg["active_player"] == 1:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            arrow_x = x_start + 348
            arrow_y = y_start + 15
            points = [
                QPoint(arrow_x + 8, arrow_y),
                QPoint(arrow_x, arrow_y + 5),
                QPoint(arrow_x + 8, arrow_y + 10)
            ]
            painter.drawPolygon(points)

        # ---------------- GIỮA ----------------
        # Chữ VS hoặc Tên giải đấu nhỏ ở giữa
        painter.setFont(font_vs)
        painter.setPen(QPen(QColor("#bdc3c7")))
        vs_rect = QRect(x_start + 370, y_start, 160, height)
        painter.drawText(vs_rect, Qt.AlignmentFlag.AlignCenter, "VS")

        # ---------------- NGƯỜI CHƠI 2 (Bên phải) ----------------
        # Mũi tên chỉ lượt cơ P2 ▶
        if cfg["active_player"] == 2:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
            arrow_x = x_start + 544
            arrow_y = y_start + 15
            points = [
                QPoint(arrow_x - 8, arrow_y),
                QPoint(arrow_x, arrow_y + 5),
                QPoint(arrow_x - 8, arrow_y + 10)
            ]
            painter.drawPolygon(points)

        # Ô điểm 2
        score_box_2 = QRect(x_start + 560, y_start + 4, 55, 32)
        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(theme_color))
        painter.drawRoundedRect(score_box_2, 4, 4)
        painter.setFont(font_score)
        painter.setPen(QPen(QColor("#ffffff")))
        painter.drawText(score_box_2, Qt.AlignmentFlag.AlignCenter, str(cfg["p2_score"]))

        # Quốc kỳ 2
        flag_rect_2 = QRect(x_start + 628, y_start + 10, 30, 20)
        flag_pix_2 = QPixmap(cfg["p2_flag"])
        if not flag_pix_2.isNull():
            painter.drawPixmap(flag_rect_2, flag_pix_2)

        # Vẽ Tên Player 2
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(font_name)
        name_rect_2 = QRect(x_start + 670, y_start, 220, height)
        painter.drawText(name_rect_2, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, cfg["p2_name"])

    def draw_simple_horizontal(self, painter, cfg):
        # Thiết kế dạng ngang đơn giản, kích thước 500x70
        x_start = 250
        y_start = 50
        width = 500
        height = 70

        theme_color = QColor(cfg["theme_color"])

        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(QColor(30, 32, 34, 245)))
        painter.drawRoundedRect(x_start, y_start, width, height, 10, 10)

        # Avatar đơn giản Player 1
        avatar_rect_1 = QRect(x_start + 10, y_start + 10, 50, 50)
        avatar_pix_1 = QPixmap(cfg["p1_avatar"])
        if not avatar_pix_1.isNull():
            painter.setBrush(QBrush(avatar_pix_1.scaled(50, 50, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)))
            painter.drawRoundedRect(avatar_rect_1, 5, 5)

        # Tên Player 1
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        painter.drawText(x_start + 70, y_start + 30, cfg["p1_name"])
        # Cờ P1
        flag_rect_1 = QRect(x_start + 70, y_start + 38, 20, 13)
        flag_pix_1 = QPixmap(cfg["p1_flag"])
        if not flag_pix_1.isNull():
            painter.drawPixmap(flag_rect_1, flag_pix_1)

        # Điểm số Player 1
        score_rect_1 = QRect(x_start + 180, y_start + 10, 50, 50)
        painter.setFont(QFont("Impact", 24))
        painter.drawText(score_rect_1, Qt.AlignmentFlag.AlignCenter, str(cfg["p1_score"]))

        # Ngăn cách giữa
        painter.setPen(QPen(theme_color, 1))
        painter.drawLine(x_start + 250, y_start + 10, x_start + 250, y_start + 60)

        # Điểm số Player 2
        score_rect_2 = QRect(x_start + 270, y_start + 10, 50, 50)
        painter.setFont(QFont("Impact", 24))
        painter.setPen(QPen(QColor("#ffffff")))
        painter.drawText(score_rect_2, Qt.AlignmentFlag.AlignCenter, str(cfg["p2_score"]))

        # Tên Player 2
        painter.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        painter.drawText(x_start + 330, y_start + 30, cfg["p2_name"])
        # Cờ P2
        flag_rect_2 = QRect(x_start + 330, y_start + 38, 20, 13)
        flag_pix_2 = QPixmap(cfg["p2_flag"])
        if not flag_pix_2.isNull():
            painter.drawPixmap(flag_rect_2, flag_pix_2)

        # Avatar Player 2
        avatar_rect_2 = QRect(x_start + 440, y_start + 10, 50, 50)
        avatar_pix_2 = QPixmap(cfg["p2_avatar"])
        if not avatar_pix_2.isNull():
            painter.setBrush(QBrush(avatar_pix_2.scaled(50, 50, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)))
            painter.drawRoundedRect(avatar_rect_2, 5, 5)

        # Chỉ báo lượt bắn
        if cfg["active_player"] == 1:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#e74c3c")))
            painter.drawEllipse(x_start + 5, y_start + 5, 10, 10)
        elif cfg["active_player"] == 2:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#e74c3c")))
            painter.drawEllipse(x_start + width - 15, y_start + 5, 10, 10)

    def draw_simple_vertical(self, painter, cfg):
        # Thiết kế dạng dọc đơn giản, kích thước 260x140
        x_start = 370
        y_start = 20
        width = 260
        height = 160

        theme_color = QColor(cfg["theme_color"])

        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(QColor(30, 32, 34, 245)))
        painter.drawRoundedRect(x_start, y_start, width, height, 12, 12)

        # Player 1 Row
        # Avatar P1
        avatar_rect_1 = QRect(x_start + 10, y_start + 10, 45, 45)
        avatar_pix_1 = QPixmap(cfg["p1_avatar"])
        if not avatar_pix_1.isNull():
            painter.setBrush(QBrush(avatar_pix_1.scaled(45, 45, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)))
            painter.drawRoundedRect(avatar_rect_1, 5, 5)

        # Tên & Cờ P1
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        painter.drawText(x_start + 65, y_start + 28, cfg["p1_name"])
        
        flag_rect_1 = QRect(x_start + 65, y_start + 34, 18, 12)
        flag_pix_1 = QPixmap(cfg["p1_flag"])
        if not flag_pix_1.isNull():
            painter.drawPixmap(flag_rect_1, flag_pix_1)

        # Điểm P1
        painter.setFont(QFont("Impact", 22))
        painter.drawText(QRect(x_start + 195, y_start + 10, 50, 45), Qt.AlignmentFlag.AlignCenter, str(cfg["p1_score"]))

        # Đường ngăn giữa 2 hàng
        painter.setPen(QPen(QColor(80, 80, 80), 1))
        painter.drawLine(x_start + 10, y_start + 65, x_start + width - 10, y_start + 65)

        # Player 2 Row
        # Avatar P2
        avatar_rect_2 = QRect(x_start + 10, y_start + 75, 45, 45)
        avatar_pix_2 = QPixmap(cfg["p2_avatar"])
        if not avatar_pix_2.isNull():
            painter.setBrush(QBrush(avatar_pix_2.scaled(45, 45, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)))
            painter.drawRoundedRect(avatar_rect_2, 5, 5)

        # Tên & Cờ P2
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        painter.drawText(x_start + 65, y_start + 93, cfg["p2_name"])
        
        flag_rect_2 = QRect(x_start + 65, y_start + 99, 18, 12)
        flag_pix_2 = QPixmap(cfg["p2_flag"])
        if not flag_pix_2.isNull():
            painter.drawPixmap(flag_rect_2, flag_pix_2)

        # Điểm P2
        painter.setFont(QFont("Impact", 22))
        painter.drawText(QRect(x_start + 195, y_start + 75, 50, 45), Qt.AlignmentFlag.AlignCenter, str(cfg["p2_score"]))

        # Thông tin giải đấu ở dưới cùng
        painter.setPen(QPen(QColor("#95a5a6")))
        painter.setFont(QFont("Segoe UI", 8))
        painter.drawText(QRect(x_start + 10, y_start + 130, width - 20, 20), Qt.AlignmentFlag.AlignCenter, f"{cfg['round_name']}  |  RACE TO {cfg['race_to']}" if cfg.get("show_tour", True) else "")

        # Lượt cơ
        if cfg["active_player"] == 1:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#e74c3c")))
            painter.drawEllipse(x_start + 5, y_start + 5, 8, 8)
        elif cfg["active_player"] == 2:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#e74c3c")))
            painter.drawEllipse(x_start + 5, y_start + 70, 8, 8)

    def draw_flat_bar(self, painter, cfg):
        # Kích thước khung tổng thể
        x_start = 120
        y_start = 80
        height = 40
        
        center_width = 160
        side_width = 300
        
        font_name = QFont("Segoe UI", 16, QFont.Weight.Bold)
        font_score = QFont("Montserrat", 18, QFont.Weight.Bold)
        font_race = QFont("Segoe UI", 12, QFont.Weight.Bold)
        
        # --- LEFT BLOCK (P1) - Đỏ đậm ---
        rect_p1 = QRect(x_start, y_start, side_width, height)
        painter.fillRect(rect_p1, QBrush(QColor("#8B0000")))
        
        painter.setPen(QColor("#ffffff"))
        
        # P1 Name
        rect_p1_name = QRect(x_start + 10, y_start, side_width - 70, height)
        painter.setFont(font_name)
        painter.drawText(rect_p1_name, Qt.AlignmentFlag.AlignCenter, cfg["p1_name"])
        
        # P1 Score
        rect_p1_score = QRect(x_start + side_width - 50, y_start, 40, height)
        painter.setFont(font_score)
        painter.drawText(rect_p1_score, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, str(cfg["p1_score"]))
        
        # --- CENTER BLOCK (RACE TO) - Đen ---
        rect_center = QRect(x_start + side_width, y_start, center_width, height)
        painter.fillRect(rect_center, QBrush(QColor("#000000")))
        
        info_text = f"RACE TO {cfg['race_to']}" if cfg.get("show_tour", True) else ""
        painter.setPen(QColor("#ffffff"))
        painter.setFont(font_race)
        painter.drawText(rect_center, Qt.AlignmentFlag.AlignCenter, info_text)
        
        # --- RIGHT BLOCK (P2) - Xanh đậm ---
        rect_p2 = QRect(x_start + side_width + center_width, y_start, side_width, height)
        painter.fillRect(rect_p2, QBrush(QColor("#0047AB")))
        
        painter.setPen(QColor("#ffffff"))
        # P2 Score
        rect_p2_score = QRect(x_start + side_width + center_width + 10, y_start, 40, height)
        painter.setFont(font_score)
        painter.drawText(rect_p2_score, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, str(cfg["p2_score"]))
        
        # P2 Name
        rect_p2_name = QRect(x_start + side_width + center_width + 60, y_start, side_width - 70, height)
        painter.setFont(font_name)
        painter.drawText(rect_p2_name, Qt.AlignmentFlag.AlignCenter, cfg["p2_name"])



    def draw_multi_players(self, painter, cfg, players):
        """Hiển thị bảng điểm dọc cho nhiều người chơi (3+)."""
        n = len(players)
        row_h = 46
        header_h = 44
        w = 700
        total_h = header_h + n * row_h + 8

        # Căn giữa theo chiều dọc trong widget 200px
        x = (1000 - w) // 2
        y = max(6, (200 - total_h) // 2)

        theme_color = QColor(cfg["theme_color"])

        # Nền chính
        painter.setPen(QPen(QColor(255, 255, 255, 160), 1.5))
        painter.setBrush(QBrush(QColor(18, 20, 22, 248)))
        painter.drawRoundedRect(x, y, w, total_h, 12, 12)

        # Header: tên giải + race to
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        painter.drawText(QRect(x + 10, y + 4, w - 20, 22), Qt.AlignmentFlag.AlignCenter, cfg.get("tour_name", ""))
        if cfg.get("show_tour", True):
            painter.setFont(QFont("Segoe UI", 8))
            painter.setPen(QPen(QColor("#bdc3c7")))
            painter.drawText(
                QRect(x + 10, y + 24, w - 20, 16), Qt.AlignmentFlag.AlignCenter,
                f"RACE TO {cfg.get('race_to', '')}  |  {cfg.get('round_name', '')}"
            )

        # Đường kẻ ngang dưới header
        painter.setPen(QPen(theme_color, 1))
        painter.drawLine(x + 12, y + header_h - 2, x + w - 12, y + header_h - 2)

        active_idx = cfg.get("active_player", 0) - 1  # convert 1-based → 0-based

        for i, player in enumerate(players):
            ry = y + header_h + i * row_h
            is_active = (i == active_idx)

            # Nền xen kẽ
            painter.setPen(Qt.PenStyle.NoPen)
            if i % 2 == 0:
                painter.setBrush(QBrush(QColor(30, 33, 36, 90)))
                painter.drawRect(x + 1, ry, w - 2, row_h)

            # Highlight người đang chơi
            if is_active:
                painter.setBrush(QBrush(QColor(theme_color.red(), theme_color.green(), theme_color.blue(), 45)))
                painter.drawRect(x + 1, ry, w - 2, row_h)
                # Thanh bên trái
                painter.setBrush(QBrush(theme_color))
                painter.drawRect(x + 1, ry, 4, row_h)

            # Badge màu + số thứ tự
            p_color = QColor(player.get("color", PLAYER_COLORS[i % len(PLAYER_COLORS)]))
            painter.setBrush(QBrush(p_color))
            painter.setPen(Qt.PenStyle.NoPen)
            badge_rect = QRect(x + 14, ry + (row_h - 28) // 2, 28, 28)
            painter.drawRoundedRect(badge_rect, 5, 5)
            painter.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            painter.setPen(QPen(QColor("#ffffff")))
            painter.drawText(badge_rect, Qt.AlignmentFlag.AlignCenter, str(i + 1))

            # Tên người chơi
            painter.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
            painter.setPen(QPen(QColor("#ffffff") if not is_active else QColor("#ffffff")))
            painter.drawText(
                QRect(x + 50, ry, w - 160, row_h),
                Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft,
                player.get("name", "")
            )

            # Ô điểm bên phải
            score_box = QRect(x + w - 86, ry + (row_h - 32) // 2, 72, 32)
            painter.setPen(QPen(theme_color, 1.5))
            painter.setBrush(QBrush(QColor(theme_color.red(), theme_color.green(), theme_color.blue(), 55)))
            painter.drawRoundedRect(score_box, 6, 6)
            painter.setFont(QFont("Montserrat", 14, QFont.Weight.Bold))
            painter.setPen(QPen(QColor("#ffffff")))
            painter.drawText(score_box, Qt.AlignmentFlag.AlignCenter, str(player.get("score", 0)))


class SettingsDialog(QDialog):
    def __init__(self, main_window):
        super().__init__(main_window)
        self.main_window = main_window
        self.setWindowTitle("Cài đặt (Settings)")
        self.setMinimumSize(550, 450)
        
        layout = QVBoxLayout(self)
        self.tabs = QTabWidget()
        
        self.tab_tour = QWidget()
        self.tab_appearance = QWidget()
        self.tab_hotkeys = QWidget()
        
        self.tabs.addTab(self.tab_tour, "Giải đấu")
        self.tabs.addTab(self.tab_appearance, "Giao diện")
        self.tabs.addTab(self.tab_hotkeys, "Phím tắt")
        
        self.setup_tour_tab()
        self.setup_appearance_tab()
        self.setup_hotkeys_tab()
        
        layout.addWidget(self.tabs)
        
        btn_close = QPushButton("Đóng")
        btn_close.clicked.connect(self.accept)
        layout.addWidget(btn_close)

    def update_config(self):
        # Push all UI values to config
        c = self.main_window.config
        c["tour_name"] = self.input_tour.text()
        c["round_name"] = self.input_round.text()
        c["race_to"] = self.spin_race.value()
        
        c["style_1"] = self.combo_style_1.currentText()
        c["style_2"] = self.combo_style_2.currentText()
        c["premium_substyle"] = self.combo_substyle.currentText()
        c["bg_type"] = self.combo_bg.currentText()
        
        c["opacity"] = self.slider_opacity.value() / 100.0
        c["show_flag"] = self.chk_flag.isChecked()
        c["show_avatar"] = self.chk_avatar.isChecked()
        c["show_tour"] = self.chk_tour.isChecked()
        
        self.main_window.update_overlay()

    def update_borderless(self):
        self.main_window.config["borderless"] = self.chk_borderless.isChecked()
        self.main_window.update_borderless()

    def update_window_title(self, text):
        self.main_window.update_window_title(text)

    def choose_file(self, key):
        self.main_window.choose_file(key)

    def choose_color(self):
        color = QColorDialog.getColor(QColor(self.main_window.config["theme_color"]), self, "Chọn màu chủ đạo")
        if color.isValid():
            self.main_window.config["theme_color"] = color.name()
            self.btn_color.setStyleSheet(f"background-color: {color.name()}; color: white; font-weight: bold;")
            self.main_window.update_overlay()

    def update_style_change(self):
        s1 = self.combo_style_1.currentText()
        s2 = self.combo_style_2.currentText()
        self.combo_substyle.setEnabled(s1 == "Ngang cao cấp" or s2 == "Ngang cao cấp")
        self.update_config()

    def setup_tour_tab(self):
        layout = QVBoxLayout(self.tab_tour)
        group_match = QGroupBox("Thông tin trận đấu & Cấu hình giải")
        layout_match = QGridLayout()

        layout_match.addWidget(QLabel("Tên Giải:"), 0, 0)
        self.input_tour = QLineEdit(self.main_window.config["tour_name"])
        self.input_tour.textChanged.connect(self.update_config)
        layout_match.addWidget(self.input_tour, 0, 1)

        layout_match.addWidget(QLabel("Vòng đấu:"), 1, 0)
        self.input_round = QLineEdit(self.main_window.config["round_name"])
        self.input_round.textChanged.connect(self.update_config)
        layout_match.addWidget(self.input_round, 1, 1)

        layout_match.addWidget(QLabel("Race to (Chạm):"), 2, 0)
        self.spin_race = QSpinBox()
        self.spin_race.setValue(self.main_window.config["race_to"])
        self.spin_race.valueChanged.connect(self.update_config)
        layout_match.addWidget(self.spin_race, 2, 1)

        btn_logo = QPushButton("Đổi Logo Giải Đấu")
        btn_logo.clicked.connect(lambda: self.choose_file("logo_path"))
        layout_match.addWidget(btn_logo, 3, 0, 1, 2)

        group_match.setLayout(layout_match)
        layout.addWidget(group_match)
        layout.addStretch()

    def setup_appearance_tab(self):
        layout = QVBoxLayout(self.tab_appearance)
        
        group_style = QGroupBox("Tùy chọn giao diện hiển thị")
        layout_style = QGridLayout()

        layout_style.addWidget(QLabel("Kiểu bảng 1 (Chính):"), 0, 0)
        self.combo_style_1 = QComboBox()
        self.combo_style_1.addItems(["Ngang cao cấp", "Ngang hiện đại (Có Avatar)", "Dọc cao cấp", "Tối giản", "Ngang đơn giản", "Dọc đơn giản", "Thanh ngang phẳng"])
        self.combo_style_1.setCurrentText(self.main_window.config.get("style_1", "Ngang cao cấp"))
        self.combo_style_1.currentTextChanged.connect(self.update_style_change)
        layout_style.addWidget(self.combo_style_1, 0, 1)

        layout_style.addWidget(QLabel("Kiểu bảng 2 (Phụ):"), 1, 0)
        self.combo_style_2 = QComboBox()
        self.combo_style_2.addItems(["Không hiển thị", "Ngang cao cấp", "Ngang hiện đại (Có Avatar)", "Dọc cao cấp", "Tối giản", "Ngang đơn giản", "Dọc đơn giản", "Thanh ngang phẳng"])
        self.combo_style_2.setCurrentText(self.main_window.config.get("style_2", "Không hiển thị"))
        self.combo_style_2.currentTextChanged.connect(self.update_style_change)
        layout_style.addWidget(self.combo_style_2, 1, 1)

        layout_style.addWidget(QLabel("Mẫu phụ (Ngang cao cấp):"), 2, 0)
        self.combo_substyle = QComboBox()
        self.combo_substyle.addItems(["Mặc định", "Không thông tin giải (Compact)", "Khung độc lập (Floating)", "Dải màu Gradients", "Phong cách Cổ điển"])
        self.combo_substyle.setCurrentText(self.main_window.config.get("premium_substyle", "Mặc định"))
        self.combo_substyle.currentTextChanged.connect(self.update_config)
        layout_style.addWidget(self.combo_substyle, 2, 1)

        layout_style.addWidget(QLabel("Nền (Chroma Key):"), 3, 0)
        self.combo_bg = QComboBox()
        self.combo_bg.addItems(["Trong suốt", "Green Screen", "Blue Screen"])
        self.combo_bg.setCurrentText(self.main_window.config.get("bg_type", "Trong suốt"))
        self.combo_bg.currentTextChanged.connect(self.update_config)
        layout_style.addWidget(self.combo_bg, 3, 1)

        layout_style.addWidget(QLabel("Màu chủ đạo (Neon Accent):"), 4, 0)
        self.btn_color = QPushButton("Chọn màu")
        self.btn_color.setStyleSheet(f"background-color: {self.main_window.config['theme_color']}; color: white; font-weight: bold;")
        self.btn_color.clicked.connect(self.choose_color)
        layout_style.addWidget(self.btn_color, 4, 1)

        self.chk_borderless = QCheckBox("Ẩn viền bảng điểm (Không viền)")
        self.chk_borderless.setChecked(self.main_window.config["borderless"])
        self.chk_borderless.toggled.connect(self.update_borderless)
        layout_style.addWidget(self.chk_borderless, 5, 0, 1, 2)

        group_style.setLayout(layout_style)
        layout.addWidget(group_style)

        group_advanced = QGroupBox("Tùy chỉnh Nâng cao (Opacity, Hiện/Ẩn)")
        layout_advanced = QGridLayout()
        
        layout_advanced.addWidget(QLabel("Độ mờ (Opacity):"), 0, 0)
        self.slider_opacity = QSlider(Qt.Orientation.Horizontal)
        self.slider_opacity.setRange(20, 100)
        self.slider_opacity.setValue(int(self.main_window.config.get("opacity", 1.0) * 100))
        self.slider_opacity.valueChanged.connect(self.update_config)
        layout_advanced.addWidget(self.slider_opacity, 0, 1, 1, 3)

        self.chk_flag = QCheckBox("Hiện Cờ")
        self.chk_flag.setChecked(self.main_window.config.get("show_flag", True))
        self.chk_flag.toggled.connect(self.update_config)
        
        self.chk_avatar = QCheckBox("Hiện Avatar")
        self.chk_avatar.setChecked(self.main_window.config.get("show_avatar", True))
        self.chk_avatar.toggled.connect(self.update_config)
        
        self.chk_tour = QCheckBox("Hiện Giải đấu")
        self.chk_tour.setChecked(self.main_window.config.get("show_tour", True))
        self.chk_tour.toggled.connect(self.update_config)
        
        layout_advanced.addWidget(self.chk_flag, 1, 0)
        layout_advanced.addWidget(self.chk_avatar, 1, 1)
        layout_advanced.addWidget(self.chk_tour, 1, 2, 1, 2)
        
        layout_advanced.addWidget(QLabel("Tên cửa sổ (Đổi để bắt hình nhiều bảng):"), 2, 0)
        self.input_window_title = QLineEdit(self.main_window.overlay1.windowTitle().replace(" - Bảng 1", "") if hasattr(self.main_window, 'overlay1') else "OBS Live Scoreboard Overlay")
        self.input_window_title.textChanged.connect(self.update_window_title)
        layout_advanced.addWidget(self.input_window_title, 2, 1, 1, 3)
        
        group_advanced.setLayout(layout_advanced)
        layout.addWidget(group_advanced)
        layout.addStretch()

    def setup_hotkeys_tab(self):
        layout = QVBoxLayout(self.tab_hotkeys)
        group_hotkeys = QGroupBox("Cài đặt Phím tắt (Nhấp vào ô và bấm phím để gán)")
        layout_hotkeys = QGridLayout()
        
        layout_hotkeys.addWidget(QLabel("Tăng điểm P1:"), 0, 0)
        self.key_p1_up = QKeySequenceEdit(self.main_window.shortcut_p1_up.key())
        self.key_p1_up.keySequenceChanged.connect(self.main_window.shortcut_p1_up.setKey)
        layout_hotkeys.addWidget(self.key_p1_up, 0, 1)
        
        layout_hotkeys.addWidget(QLabel("Giảm điểm P1:"), 0, 2)
        self.key_p1_down = QKeySequenceEdit(self.main_window.shortcut_p1_down.key())
        self.key_p1_down.keySequenceChanged.connect(self.main_window.shortcut_p1_down.setKey)
        layout_hotkeys.addWidget(self.key_p1_down, 0, 3)
        
        layout_hotkeys.addWidget(QLabel("Tăng điểm P2:"), 1, 0)
        self.key_p2_up = QKeySequenceEdit(self.main_window.shortcut_p2_up.key())
        self.key_p2_up.keySequenceChanged.connect(self.main_window.shortcut_p2_up.setKey)
        layout_hotkeys.addWidget(self.key_p2_up, 1, 1)
        
        layout_hotkeys.addWidget(QLabel("Giảm điểm P2:"), 1, 2)
        self.key_p2_down = QKeySequenceEdit(self.main_window.shortcut_p2_down.key())
        self.key_p2_down.keySequenceChanged.connect(self.main_window.shortcut_p2_down.setKey)
        layout_hotkeys.addWidget(self.key_p2_down, 1, 3)
        
        layout_hotkeys.addWidget(QLabel("Đổi chỗ P1/P2:"), 2, 0)
        self.key_swap = QKeySequenceEdit(self.main_window.shortcut_swap.key())
        self.key_swap.keySequenceChanged.connect(self.main_window.shortcut_swap.setKey)
        layout_hotkeys.addWidget(self.key_swap, 2, 1)
        
        layout_hotkeys.addWidget(QLabel("Đổi lượt cơ:"), 2, 2)
        self.key_active = QKeySequenceEdit(self.main_window.shortcut_active.key())
        self.key_active.keySequenceChanged.connect(self.main_window.shortcut_active.setKey)
        layout_hotkeys.addWidget(self.key_active, 2, 3)
        
        group_hotkeys.setLayout(layout_hotkeys)
        layout.addWidget(group_hotkeys)
        layout.addStretch()


class ControlPanel(QMainWindow):
    """Cửa sổ Điều khiển chính của ứng dụng Bảng điểm."""
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Bộ điều khiển Bảng điểm OBS")
        self.setMinimumWidth(650)
        self.init_variables()
        self.setup_hotkeys()
        self.init_ui()
        
        # Khởi chạy 2 cửa sổ overlay hiển thị
        self.overlay1 = ScoreboardOverlay(self, index=1)
        self.overlay1.show()
        
        self.overlay2 = ScoreboardOverlay(self, index=2)
        self.overlay2.move(self.overlay1.x(), self.overlay1.y() + 250)
        self.overlay2.hide()

    def init_variables(self):
        self.receiver = None
        self._receiving = False
        self.player_rows = []  # list of {widget, name_input, score_spin, color}

        self.default_avatar = os.path.join(ASSETS_DIR, "default_avatar.png")
        self.default_flag = os.path.join(ASSETS_DIR, "flag_vn.png")
        self.default_logo = os.path.join(ASSETS_DIR, "default_logo.png")

        self.config = {
            "p1_name": "Player 1",
            "p1_avatar": self.default_avatar,
            "p1_flag": self.default_flag,
            "p1_score": 0,
            "p2_name": "Player 2",
            "p2_avatar": self.default_avatar,
            "p2_flag": self.default_flag,
            "p2_score": 0,
            "players": [
                {"name": "Player 1", "score": 0, "color": PLAYER_COLORS[0]},
                {"name": "Player 2", "score": 0, "color": PLAYER_COLORS[1]},
            ],
            "active_player": 1,
            "logo_path": self.default_logo,
            "tour_name": "PoolArena.vn Championship",
            "round_name": "Chung Kết (Final)",
            "race_to": 9,
            "style_1": "Ngang cao cấp",
            "style_2": "Không hiển thị",
            "premium_substyle": "Mặc định",
            "theme_color": "#d35400",
            "bg_type": "Transparent",
            "borderless": True,
            "opacity": 1.0,
            "show_flag": True,
            "show_avatar": True,
            "show_tour": True
        }

    # Properties để hotkeys và SettingsDialog vẫn hoạt động
    @property
    def spin_p1_score(self):
        return self.player_rows[0]["score_spin"] if self.player_rows else None

    @property
    def spin_p2_score(self):
        return self.player_rows[1]["score_spin"] if len(self.player_rows) > 1 else None

    @property
    def input_p1_name(self):
        return self.player_rows[0]["name_input"] if self.player_rows else None

    @property
    def input_p2_name(self):
        return self.player_rows[1]["name_input"] if len(self.player_rows) > 1 else None

    def setup_hotkeys(self):
        self.shortcut_p1_up = QShortcut(QKeySequence("F1"), self)
        self.shortcut_p1_up.activated.connect(lambda: self.spin_p1_score.setValue(self.spin_p1_score.value() + 1))
        
        self.shortcut_p1_down = QShortcut(QKeySequence("F2"), self)
        self.shortcut_p1_down.activated.connect(lambda: self.spin_p1_score.setValue(max(0, self.spin_p1_score.value() - 1)))
        
        self.shortcut_p2_up = QShortcut(QKeySequence("F3"), self)
        self.shortcut_p2_up.activated.connect(lambda: self.spin_p2_score.setValue(self.spin_p2_score.value() + 1))
        
        self.shortcut_p2_down = QShortcut(QKeySequence("F4"), self)
        self.shortcut_p2_down.activated.connect(lambda: self.spin_p2_score.setValue(max(0, self.spin_p2_score.value() - 1)))
        
        self.shortcut_swap = QShortcut(QKeySequence("F5"), self)
        self.shortcut_swap.activated.connect(self.swap_players)
        
        def toggle_active():
            if self.config.get("active_player") == 1: self.set_active_player(2)
            else: self.set_active_player(1)
        self.shortcut_active = QShortcut(QKeySequence("F6"), self)
        self.shortcut_active.activated.connect(toggle_active)

    def init_ui(self):
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        main_layout = QVBoxLayout(main_widget)
        main_layout.setSpacing(8)

        # ---------------- DANH SÁCH NGƯỜI CHƠI (ĐỘNG) ----------------
        group_players = QGroupBox("Người chơi")
        group_players.setStyleSheet("QGroupBox { font-weight: bold; }")
        group_players_layout = QVBoxLayout(group_players)
        group_players_layout.setContentsMargins(6, 14, 6, 6)
        group_players_layout.setSpacing(0)

        # Scroll area để chứa nhiều người chơi
        self.players_scroll = QScrollArea()
        self.players_scroll.setWidgetResizable(True)
        self.players_scroll.setFrameShape(QFrame.Shape.NoFrame)
        self.players_scroll.setMinimumHeight(100)
        self.players_scroll.setMaximumHeight(260)

        self.players_container = QWidget()
        self.players_container_layout = QVBoxLayout(self.players_container)
        self.players_container_layout.setContentsMargins(0, 0, 0, 0)
        self.players_container_layout.setSpacing(3)
        self.players_scroll.setWidget(self.players_container)

        group_players_layout.addWidget(self.players_scroll)
        main_layout.addWidget(group_players)

        # Khởi tạo 2 người chơi mặc định
        self.rebuild_player_widgets(2)

        # ---------------- LƯỢT CƠ + SWAP ----------------
        layout_controls = QHBoxLayout()
        layout_controls.setSpacing(8)

        lbl_active = QLabel("Lượt cơ:")
        lbl_active.setStyleSheet("font-weight: bold;")
        layout_controls.addWidget(lbl_active)

        self.btn_active_p1 = QPushButton("◀ P1")
        self.btn_active_none = QPushButton("■")
        self.btn_active_p2 = QPushButton("P2 ▶")

        self.btn_active_p1.setToolTip("Lượt Người chơi 1")
        self.btn_active_none.setToolTip("Không hiển thị lượt")
        self.btn_active_p2.setToolTip("Lượt Người chơi 2")

        for btn in (self.btn_active_p1, self.btn_active_none, self.btn_active_p2):
            btn.setFixedHeight(34)
            btn.setFont(QFont("Arial", 11, QFont.Weight.Bold))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            layout_controls.addWidget(btn)

        self.btn_active_p1.clicked.connect(lambda: self.set_active_player(1))
        self.btn_active_none.clicked.connect(lambda: self.set_active_player(0))
        self.btn_active_p2.clicked.connect(lambda: self.set_active_player(2))

        layout_controls.addStretch()

        btn_swap = QPushButton("🔄 Đổi chỗ P1/P2")
        btn_swap.setStyleSheet("font-size: 13px; padding: 5px 12px;")
        btn_swap.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_swap.clicked.connect(self.swap_players)
        layout_controls.addWidget(btn_swap)

        main_layout.addLayout(layout_controls)
        self.set_active_player(1)

        # ---------------- NÚT CÀI ĐẶT VÀ RESET ----------------
        layout_buttons = QHBoxLayout()
        btn_settings = QPushButton("⚙ Cài đặt (Settings)")
        btn_settings.setStyleSheet("background-color: #34495e; color: white; font-weight: bold; font-size: 14px; padding: 8px;")
        btn_settings.clicked.connect(self.open_settings)
        layout_buttons.addWidget(btn_settings)

        btn_reset = QPushButton("Reset Toàn Bộ Trận Đấu")
        btn_reset.setStyleSheet("background-color: #c0392b; color: white; font-weight: bold; font-size: 14px; padding: 8px;")
        btn_reset.clicked.connect(self.reset_match)
        layout_buttons.addWidget(btn_reset)

        main_layout.addLayout(layout_buttons)

        # ---------------- NHẬN TỈ SỐ TỪ HỆ THỐNG (PoolArena API) ----------------
        group_receive = QGroupBox("Nhận tỉ số từ hệ thống (PoolArena API)")
        group_receive.setStyleSheet("QGroupBox { font-weight: bold; color: #2980b9; border: 1.5px solid #2980b9; border-radius: 6px; margin-top: 6px; padding-top: 4px; } QGroupBox::title { subcontrol-origin: margin; left: 10px; }")
        layout_receive = QGridLayout()
        layout_receive.setSpacing(6)

        self.input_api_url = QLineEdit("https://cms.poolarena.vn")

        layout_receive.addWidget(QLabel("Bàn đang hoạt động:"), 0, 0)
        self.combo_table = QComboBox()
        self.combo_table.setPlaceholderText("-- Nhấn 🔄 để tải danh sách --")
        self.combo_table.setSizePolicy(self.combo_table.sizePolicy().horizontalPolicy(), self.combo_table.sizePolicy().verticalPolicy())
        layout_receive.addWidget(self.combo_table, 0, 1)

        self.btn_refresh_tables = QPushButton("🔄")
        self.btn_refresh_tables.setToolTip("Tải lại danh sách bàn đang hoạt động")
        self.btn_refresh_tables.setFixedWidth(36)
        self.btn_refresh_tables.clicked.connect(self.fetch_active_tables)
        layout_receive.addWidget(self.btn_refresh_tables, 0, 2)

        layout_receive.addWidget(QLabel("Cập nhật mỗi (giây):"), 0, 3)
        self.spin_interval = QSpinBox()
        self.spin_interval.setRange(1, 30)
        self.spin_interval.setValue(2)
        layout_receive.addWidget(self.spin_interval, 0, 4)

        self.chk_auto_name = QCheckBox("Tự động cập nhật tên người chơi")
        self.chk_auto_name.setChecked(True)
        layout_receive.addWidget(self.chk_auto_name, 1, 0, 1, 3)

        self.btn_toggle_receive = QPushButton("▶ Bắt đầu nhận tỉ số")
        self.btn_toggle_receive.setStyleSheet("background-color: #27ae60; color: white; font-weight: bold; padding: 7px 14px; border-radius: 5px;")
        self.btn_toggle_receive.clicked.connect(self.toggle_live_receive)
        layout_receive.addWidget(self.btn_toggle_receive, 1, 3, 1, 2)

        self.lbl_receive_status = QLabel("Trạng thái: Nhấn 🔄 để tải danh sách bàn")
        self.lbl_receive_status.setStyleSheet("color: #7f8c8d; font-style: italic;")
        layout_receive.addWidget(self.lbl_receive_status, 2, 0, 1, 5)

        group_receive.setLayout(layout_receive)
        main_layout.addWidget(group_receive)

        # Tự động fetch danh sách bàn khi khởi động
        QTimer.singleShot(1000, self.fetch_active_tables)

    def rebuild_player_widgets(self, n: int):
        """Tạo lại danh sách widget người chơi với n người."""
        # Lưu dữ liệu hiện tại trước khi xóa
        old_data = [
            {"name": r["name_input"].text(), "score": r["score_spin"].value(), "color": r["color"]}
            for r in self.player_rows
        ]

        # Xóa các row cũ
        for row in self.player_rows:
            row["widget"].setParent(None)
            row["widget"].deleteLater()
        self.player_rows.clear()

        # Đảm bảo config players có đủ dữ liệu
        saved = self.config.get("players", [])

        for i in range(n):
            color = PLAYER_COLORS[i % len(PLAYER_COLORS)]

            # Lấy tên/điểm từ old_data → saved → mặc định
            if i < len(old_data):
                init_name = old_data[i]["name"]
                init_score = old_data[i]["score"]
            elif i < len(saved):
                init_name = saved[i].get("name", f"Player {i+1}")
                init_score = saved[i].get("score", 0)
            else:
                init_name = f"Player {i+1}"
                init_score = 0

            row_widget = QWidget()
            row_layout = QHBoxLayout(row_widget)
            row_layout.setContentsMargins(4, 3, 4, 3)
            row_layout.setSpacing(6)

            # Badge màu P1, P2...
            lbl_badge = QLabel(f"P{i+1}")
            lbl_badge.setFixedSize(30, 30)
            lbl_badge.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl_badge.setStyleSheet(
                f"background-color: {color}; color: white; font-weight: bold; "
                f"border-radius: 6px; font-size: 12px;"
            )
            row_layout.addWidget(lbl_badge)

            # Ô nhập tên
            name_input = QLineEdit(init_name)
            name_input.setPlaceholderText(f"Tên người chơi {i+1}")
            name_input.setStyleSheet("font-size: 13px; padding: 4px;")
            name_input.textChanged.connect(self.update_data)
            row_layout.addWidget(name_input, stretch=1)

            # Nút -
            btn_minus = QPushButton("−")
            btn_minus.setFixedSize(32, 32)
            btn_minus.setStyleSheet(
                "background-color: #e74c3c; color: white; font-size: 18px; "
                "font-weight: bold; border-radius: 5px;"
            )

            # Điểm spinbox
            score_spin = QSpinBox()
            score_spin.setRange(0, 999)
            score_spin.setValue(init_score)
            score_spin.setFixedWidth(64)
            score_spin.setStyleSheet("font-size: 17px; font-weight: bold; padding: 2px;")
            score_spin.setAlignment(Qt.AlignmentFlag.AlignCenter)
            score_spin.valueChanged.connect(self.update_data)

            # Nút +
            btn_plus = QPushButton("+")
            btn_plus.setFixedSize(32, 32)
            btn_plus.setStyleSheet(
                "background-color: #27ae60; color: white; font-size: 18px; "
                "font-weight: bold; border-radius: 5px;"
            )

            btn_minus.clicked.connect(lambda _, s=score_spin: s.setValue(max(0, s.value() - 1)))
            btn_plus.clicked.connect(lambda _, s=score_spin: s.setValue(s.value() + 1))

            row_layout.addWidget(btn_minus)
            row_layout.addWidget(score_spin)
            row_layout.addWidget(btn_plus)

            self.players_container_layout.addWidget(row_widget)
            self.player_rows.append({
                "widget": row_widget,
                "name_input": name_input,
                "score_spin": score_spin,
                "badge": lbl_badge,
                "color": color,
            })

        self.update_data()

    def choose_file(self, config_key):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Chọn hình ảnh", "", "Hình ảnh (*.png *.jpg *.jpeg *.webp *.bmp)"
        )
        if file_path:
            self.config[config_key] = file_path
            self.update_overlay()

    def swap_players(self):
        if len(self.player_rows) < 2:
            return
        r0, r1 = self.player_rows[0], self.player_rows[1]

        t_name = r0["name_input"].text()
        r0["name_input"].setText(r1["name_input"].text())
        r1["name_input"].setText(t_name)

        t_score = r0["score_spin"].value()
        r0["score_spin"].setValue(r1["score_spin"].value())
        r1["score_spin"].setValue(t_score)

        t_avatar = self.config.get("p1_avatar", "")
        self.config["p1_avatar"] = self.config.get("p2_avatar", "")
        self.config["p2_avatar"] = t_avatar

        t_flag = self.config.get("p1_flag", "")
        self.config["p1_flag"] = self.config.get("p2_flag", "")
        self.config["p2_flag"] = t_flag

        if self.config.get("active_player") == 1:
            self.set_active_player(2)
        elif self.config.get("active_player") == 2:
            self.set_active_player(1)

        self.update_data()

    def set_active_player(self, player_id):
        self.config["active_player"] = player_id
        
        active_style = "background-color: #27ae60; color: white; border: 2px solid #2ecc71; border-radius: 8px; padding: 0px;"
        inactive_style = "background-color: #ecf0f1; color: #7f8c8d; border: 2px solid #bdc3c7; border-radius: 8px; padding: 0px;"
        
        self.btn_active_p1.setStyleSheet(active_style if player_id == 1 else inactive_style)
        self.btn_active_none.setStyleSheet(active_style if player_id == 0 else inactive_style)
        self.btn_active_p2.setStyleSheet(active_style if player_id == 2 else inactive_style)
        
        self.update_overlay()

    def update_data(self):
        players = []
        for i, row in enumerate(self.player_rows):
            players.append({
                "name": row["name_input"].text(),
                "score": row["score_spin"].value(),
                "color": row["color"],
            })
        self.config["players"] = players
        # Sync p1/p2 cho các style cũ
        if players:
            self.config["p1_name"] = players[0]["name"]
            self.config["p1_score"] = players[0]["score"]
        if len(players) > 1:
            self.config["p2_name"] = players[1]["name"]
            self.config["p2_score"] = players[1]["score"]
        self.update_overlay()

    def update_overlay(self):
        if hasattr(self, 'overlay1') and self.overlay1:
            self.overlay1.update_view()
        if hasattr(self, 'overlay2') and self.overlay2:
            cfg = self.get_config()
            if cfg.get("style_2") == "Không hiển thị":
                self.overlay2.hide()
            else:
                self.overlay2.show()
                self.overlay2.update_view()

    def update_borderless(self):
        if hasattr(self, 'overlay1') and self.overlay1:
            self.overlay1.apply_window_flags(self.config["borderless"])
        if hasattr(self, 'overlay2') and self.overlay2:
            self.overlay2.apply_window_flags(self.config["borderless"])

    def get_config(self):
        cfg = self.config.copy()
        # Rebuild players từ widget thực tế (luôn mới nhất)
        cfg["players"] = [
            {"name": r["name_input"].text(), "score": r["score_spin"].value(), "color": r["color"]}
            for r in self.player_rows
        ]
        if cfg["players"]:
            cfg["p1_name"] = cfg["players"][0]["name"]
            cfg["p1_score"] = cfg["players"][0]["score"]
        if len(cfg["players"]) > 1:
            cfg["p2_name"] = cfg["players"][1]["name"]
            cfg["p2_score"] = cfg["players"][1]["score"]
        return cfg

    def open_settings(self):
        dialog = SettingsDialog(self)
        dialog.exec()

    def reset_match(self):
        for row in self.player_rows:
            row["score_spin"].setValue(0)
        self.set_active_player(1)
        self.update_data()

    def update_window_title(self, text):
        if text.strip() == "":
            text = "OBS Live Scoreboard Overlay"
        if hasattr(self, 'overlay1'): self.overlay1.setWindowTitle(text + " - Bảng 1")
        if hasattr(self, 'overlay2'): self.overlay2.setWindowTitle(text + " - Bảng 2")

    def toggle_live_receive(self):
        if self._receiving:
            self.stop_live_receive()
        else:
            self.start_live_receive()

    def fetch_active_tables(self):
        """Lấy danh sách bàn đang có tỉ số từ backend, cập nhật vào dropdown."""
        api_url = self.input_api_url.text().strip()
        self.btn_refresh_tables.setEnabled(False)
        self.lbl_receive_status.setText("Trạng thái: Đang tải danh sách bàn...")
        self.lbl_receive_status.setStyleSheet("color: #f39c12; font-style: italic;")

        def do_fetch():
            try:
                url = f"{api_url}/api/tournaments/device/live-score"
                req = urllib.request.Request(url, headers={"User-Agent": "LiveScore-OBS/1.0"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                return data
            except Exception as e:
                return e

        class FetchWorker(QThread):
            done = pyqtSignal(object)
            def __init__(self, fn):
                super().__init__()
                self._fn = fn
            def run(self):
                self.done.emit(self._fn())

        self._fetch_worker = FetchWorker(do_fetch)

        def on_done(result):
            self.btn_refresh_tables.setEnabled(True)
            if isinstance(result, Exception):
                self.lbl_receive_status.setStyleSheet("color: #e74c3c; font-style: italic;")
                self.lbl_receive_status.setText(f"Trạng thái: Lỗi kết nối — {str(result)[:80]}")
                return

            tables = []
            if isinstance(result, dict):
                # Response là {table_name: {table_name, mode, players, ...}}
                if "table_name" in result:
                    # Single table object
                    tables = [result["table_name"]]
                else:
                    # Dict of tables keyed by table_name
                    for entry in result.values():
                        if isinstance(entry, dict) and entry.get("table_name") and entry.get("device_code"):
                            tables.append(entry["table_name"])
            elif isinstance(result, list):
                tables = [d.get("table_name", "") for d in result if d.get("table_name")]

            current = self.combo_table.currentText()
            self.combo_table.clear()
            if tables:
                self.combo_table.addItems(tables)
                if current in tables:
                    self.combo_table.setCurrentText(current)
                self.lbl_receive_status.setStyleSheet("color: #27ae60; font-style: italic;")
                self.lbl_receive_status.setText(f"Trạng thái: Tìm thấy {len(tables)} bàn đang hoạt động")
            else:
                self.lbl_receive_status.setStyleSheet("color: #f39c12; font-style: italic;")
                self.lbl_receive_status.setText("Trạng thái: Không có bàn nào đang hoạt động")

        self._fetch_worker.done.connect(on_done)
        self._fetch_worker.start()

    def start_live_receive(self):
        api_url = self.input_api_url.text().strip()
        table_name = self.combo_table.currentText().strip()
        if not table_name:
            self.lbl_receive_status.setText("Trạng thái: Chưa có bàn — nhấn 🔄 để tải danh sách")
            self.lbl_receive_status.setStyleSheet("color: #e74c3c; font-style: italic;")
            self.btn_toggle_receive.setChecked(False)
            return

        self.stop_live_receive()

        self.receiver = LiveScoreReceiver(api_url, table_name, self.spin_interval.value())
        self.receiver.score_received.connect(self.on_score_received)
        self.receiver.status_changed.connect(self.on_receive_status)
        self.receiver.start()
        self._receiving = True

        self.btn_toggle_receive.setText("■ Dừng nhận tỉ số")
        self.btn_toggle_receive.setStyleSheet("background-color: #e74c3c; color: white; font-weight: bold; padding: 7px 14px; border-radius: 5px;")
        self.combo_table.setEnabled(False)
        self.btn_refresh_tables.setEnabled(False)
        self.spin_interval.setEnabled(False)

    def stop_live_receive(self):
        self._receiving = False
        if self.receiver is not None:
            self.receiver.stop()
            self.receiver = None

        self.btn_toggle_receive.setText("▶ Bắt đầu nhận tỉ số")
        self.btn_toggle_receive.setStyleSheet("background-color: #27ae60; color: white; font-weight: bold; padding: 7px 14px; border-radius: 5px;")
        self.combo_table.setEnabled(True)
        self.btn_refresh_tables.setEnabled(True)
        self.spin_interval.setEnabled(True)
        self.lbl_receive_status.setStyleSheet("color: #7f8c8d; font-style: italic;")
        self.lbl_receive_status.setText("Trạng thái: Đã dừng")

    def on_score_received(self, data: dict):
        players = data.get("players", [])
        if not players:
            return

        # Rebuild widget nếu số người chơi thay đổi
        if len(players) != len(self.player_rows):
            self.config["players"] = [
                {"name": p.get("name", f"Player {i+1}"), "score": p.get("score", 0),
                 "color": p.get("color", PLAYER_COLORS[i % len(PLAYER_COLORS)])}
                for i, p in enumerate(players)
            ]
            self.rebuild_player_widgets(len(players))
            return  # rebuild_player_widgets đã gọi update_data

        # Cập nhật từng người chơi
        for i, p in enumerate(players):
            if i >= len(self.player_rows):
                break
            row = self.player_rows[i]
            row["score_spin"].blockSignals(True)
            row["name_input"].blockSignals(True)

            row["score_spin"].setValue(int(p.get("score", 0)))
            if self.chk_auto_name.isChecked():
                name = p.get("name", "").strip()
                if name:
                    row["name_input"].setText(name)

            row["score_spin"].blockSignals(False)
            row["name_input"].blockSignals(False)

        self.update_data()

    def on_receive_status(self, status: str):
        if status == "Đã kết nối":
            self.lbl_receive_status.setStyleSheet("color: #27ae60; font-weight: bold;")
        elif status.startswith("Lỗi"):
            self.lbl_receive_status.setStyleSheet("color: #e74c3c; font-style: italic;")
        else:
            self.lbl_receive_status.setStyleSheet("color: #f39c12; font-style: italic;")
        self.lbl_receive_status.setText(f"Trạng thái: {status}")

    def closeEvent(self, event):
        self.stop_live_receive()
        # Đóng cả cửa sổ phụ khi tắt bộ điều khiển chính
        if hasattr(self, 'overlay1'): self.overlay1.close()
        if hasattr(self, 'overlay2'): self.overlay2.close()
        event.accept()


if __name__ == "__main__":
    # Đảm bảo các tài nguyên mặc định đã được chuẩn bị sẵn sàng
    generate_default_assets()

    app = QApplication(sys.argv)
    
    # Thiết lập giao diện điều khiển chính của Windows được trực quan và đẹp hơn
    app.setStyle('Fusion')
    
    # Chạy bảng điều khiển chính
    control_panel = ControlPanel()
    control_panel.show()
    
    sys.exit(app.exec())
