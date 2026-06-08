import os
import sys
import math
import json
import threading
import urllib.request
import urllib.parse

# Ép buộc Qt6 sử dụng công cụ dựng hình bằng phần mềm (Software Rendering)
# Giúp OBS dễ dàng bắt hình ảnh (Window Capture) mà không bị lỗi màn hình đen do tăng tốc phần cứng GPU.
os.environ["QT_RHI_BACKEND"] = "software"

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QLabel, QLineEdit, QPushButton,
    QComboBox, QFileDialog, QHBoxLayout, QVBoxLayout, QGridLayout,
    QGroupBox, QSpinBox, QColorDialog, QCheckBox, QSlider, QKeySequenceEdit,
    QDialog, QTabWidget
)
from PyQt6.QtGui import QPixmap, QPainter, QColor, QFont, QPen, QBrush, QShortcut, QKeySequence
from PyQt6.QtCore import Qt, QPoint, QRect, QTimer, pyqtSignal, QObject

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


class WorkerSignals(QObject):
    match_data = pyqtSignal(dict)
    error = pyqtSignal(str)
    tables_loaded = pyqtSignal(list)


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
        p1_box = QRect(x_start + 10, y_start + 7, 280, 36)
        painter.setPen(QPen(theme_color, 1.5))
        painter.setBrush(QBrush(QColor(30, 32, 34, 150)))
        painter.drawRoundedRect(p1_box, 4, 4)

        # Vẽ Quốc kỳ Player 1
        flag_rect_1 = QRect(x_start + 18, y_start + 15, 30, 20)
        flag_pix_1 = QPixmap(cfg["p1_flag"])
        if not flag_pix_1.isNull():
            painter.drawPixmap(flag_rect_1, flag_pix_1)

        # Vẽ Tên + Rank Player 1
        painter.setPen(QPen(QColor("#ffffff")))
        p1_rank = cfg.get("p1_rank", "")
        p1_display = f"{cfg['p1_name']}  {p1_rank}" if p1_rank else cfg["p1_name"]
        painter.setFont(font_name)
        painter.drawText(QRect(x_start + 55, y_start + 7, 175, 36), Qt.AlignmentFlag.AlignCenter, p1_display)

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

        # Vẽ Tên + Rank Player 2
        p2_rank = cfg.get("p2_rank", "")
        p2_display = f"{cfg['p2_name']}  {p2_rank}" if p2_rank else cfg["p2_name"]
        painter.setFont(font_name)
        painter.setPen(QPen(QColor("#ffffff")))
        painter.drawText(QRect(x_start + 670, y_start + 7, 175, 36), Qt.AlignmentFlag.AlignCenter, p2_display)

        # Vẽ Quốc kỳ Player 2
        flag_rect_2 = QRect(x_start + 852, y_start + 15, 30, 20)
        flag_pix_2 = QPixmap(cfg["p2_flag"])
        if not flag_pix_2.isNull():
            painter.drawPixmap(flag_rect_2, flag_pix_2)

        # Mũi tên chỉ lượt cơ bên trái Player 2
        if cfg["active_player"] == 2:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#ffffff")))
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
        
        font_name = QFont("Segoe UI", 14, QFont.Weight.Bold)
        font_score = QFont("Montserrat", 18, QFont.Weight.Bold)
        font_race = QFont("Segoe UI", 12, QFont.Weight.Bold)
        p1_rank = cfg.get("p1_rank", "")
        p2_rank = cfg.get("p2_rank", "")

        # --- LEFT BLOCK (P1) - Đỏ đậm ---
        rect_p1 = QRect(x_start, y_start, side_width, height)
        painter.fillRect(rect_p1, QBrush(QColor("#8B0000")))

        painter.setPen(QColor("#ffffff"))
        p1_display = f"{cfg['p1_name']}  {p1_rank}" if p1_rank else cfg["p1_name"]
        painter.setFont(font_name)
        painter.drawText(QRect(x_start + 10, y_start, side_width - 70, height),
                         Qt.AlignmentFlag.AlignCenter, p1_display)

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

        # P2 Name + Rank
        p2_display = f"{cfg['p2_name']}  {p2_rank}" if p2_rank else cfg["p2_name"]
        painter.setFont(font_name)
        painter.drawText(QRect(x_start + side_width + center_width + 60, y_start, side_width - 70, height),
                         Qt.AlignmentFlag.AlignCenter, p2_display)



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

        layout_style.addWidget(QLabel("Nền (Chroma Key):"), 2, 0)
        self.combo_bg = QComboBox()
        self.combo_bg.addItems(["Trong suốt", "Green Screen", "Blue Screen"])
        self.combo_bg.setCurrentText(self.main_window.config.get("bg_type", "Trong suốt"))
        self.combo_bg.currentTextChanged.connect(self.update_config)
        layout_style.addWidget(self.combo_bg, 2, 1)

        layout_style.addWidget(QLabel("Màu chủ đạo (Neon Accent):"), 3, 0)
        self.btn_color = QPushButton("Chọn màu")
        self.btn_color.setStyleSheet(f"background-color: {self.main_window.config['theme_color']}; color: white; font-weight: bold;")
        self.btn_color.clicked.connect(self.choose_color)
        layout_style.addWidget(self.btn_color, 3, 1)

        self.chk_borderless = QCheckBox("Ẩn viền bảng điểm (Không viền)")
        self.chk_borderless.setChecked(self.main_window.config["borderless"])
        self.chk_borderless.toggled.connect(self.update_borderless)
        layout_style.addWidget(self.chk_borderless, 4, 0, 1, 2)

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

        # Tự động tải danh sách bàn khi khởi động
        self.fetch_tables()

    def init_variables(self):
        # Thiết lập các tài nguyên và đường dẫn mặc định
        self.default_avatar = os.path.join(ASSETS_DIR, "default_avatar.png")
        self.default_flag = os.path.join(ASSETS_DIR, "flag_vn.png")
        self.default_logo = os.path.join(ASSETS_DIR, "default_logo.png")

        # API polling
        self.api_signals = WorkerSignals()
        self.api_signals.match_data.connect(self.apply_match_data)
        self.api_signals.error.connect(self.on_api_error)
        self.api_signals.tables_loaded.connect(self.on_tables_loaded)
        self.api_timer = QTimer()
        self.api_timer.timeout.connect(self.poll_active_match)
        self.avatar_cache = {}  # {cache_key: local_path}

        # Khởi tạo các giá trị cấu hình mặc định
        self.config = {
            "p1_name": "Player 1",
            "p1_avatar": self.default_avatar,
            "p1_flag": self.default_flag,
            "p1_score": 0,
            "p2_name": "Player 2",
            "p2_avatar": self.default_avatar,
            "p2_flag": self.default_flag,
            "p2_score": 0,
            "p1_rank": "",
            "p2_rank": "",
            "active_player": 1, # 1: P1, 2: P2, 0: Không ai cả
            "tour_name": "PoolArena.vn Championship",
            "round_name": "Chung Kết (Final)",
            "race_to": 9,
            "style_1": "Ngang cao cấp",
            "style_2": "Không hiển thị",
            "theme_color": "#d35400",  # Cam mặc định
            "bg_type": "Transparent",  # Kính trong suốt
            "borderless": True,
            "opacity": 1.0,
            "show_flag": True,
            "show_avatar": True,
            "show_tour": True
        }

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
        
        # Giao diện chính chia làm Grid gồm thông tin Người chơi và Giải đấu
        grid = QGridLayout()

        # ---------------- GROUP PLAYER 1 ----------------
        self.group_p1 = QGroupBox("Người chơi 1 (Trái / Trên)")
        layout_p1 = QGridLayout()
        
        layout_p1.addWidget(QLabel("Tên:"), 0, 0)
        self.input_p1_name = QLineEdit(self.config["p1_name"])
        self.input_p1_name.textChanged.connect(self.update_data)
        layout_p1.addWidget(self.input_p1_name, 0, 1, 1, 2)

        # Điểm số
        lbl_p1_score = QLabel("Điểm:")
        lbl_p1_score.setStyleSheet("font-weight: bold; font-size: 14px;")
        layout_p1.addWidget(lbl_p1_score, 1, 0)
        
        self.spin_p1_score = QSpinBox()
        self.spin_p1_score.setValue(self.config["p1_score"])
        self.spin_p1_score.setStyleSheet("font-size: 18px; font-weight: bold; padding: 5px;")
        self.spin_p1_score.valueChanged.connect(self.update_data)
        layout_p1.addWidget(self.spin_p1_score, 1, 1)

        # Nút +/- điểm nhanh
        btn_p1_up = QPushButton("▲")
        btn_p1_up.setStyleSheet("background-color: #27ae60; color: white; font-size: 20px; font-weight: bold; padding: 5px 10px; border-radius: 5px;")
        btn_p1_up.clicked.connect(lambda: self.spin_p1_score.setValue(self.spin_p1_score.value() + 1))
        
        btn_p1_down = QPushButton("▼")
        btn_p1_down.setStyleSheet("background-color: #e74c3c; color: white; font-size: 20px; font-weight: bold; padding: 5px 10px; border-radius: 5px;")
        btn_p1_down.clicked.connect(lambda: self.spin_p1_score.setValue(max(0, self.spin_p1_score.value() - 1)))
        layout_p1.addWidget(btn_p1_up, 1, 2)
        layout_p1.addWidget(btn_p1_down, 1, 3)

        # Chọn ảnh đại diện và Quốc kỳ
        btn_p1_avatar = QPushButton("Đổi Avatar")
        btn_p1_avatar.clicked.connect(lambda: self.choose_file("p1_avatar"))
        layout_p1.addWidget(btn_p1_avatar, 3, 0, 1, 2)

        btn_p1_flag = QPushButton("Đổi Quốc Kỳ")
        btn_p1_flag.clicked.connect(lambda: self.choose_file("p1_flag"))
        layout_p1.addWidget(btn_p1_flag, 3, 2, 1, 2)

        self.group_p1.setLayout(layout_p1)
        grid.addWidget(self.group_p1, 0, 0)

        # ---------------- GROUP PLAYER 2 ----------------
        self.group_p2 = QGroupBox("Người chơi 2 (Phải / Dưới)")
        layout_p2 = QGridLayout()

        layout_p2.addWidget(QLabel("Tên:"), 0, 0)
        self.input_p2_name = QLineEdit(self.config["p2_name"])
        self.input_p2_name.textChanged.connect(self.update_data)
        layout_p2.addWidget(self.input_p2_name, 0, 1, 1, 2)

        # Điểm số
        lbl_p2_score = QLabel("Điểm:")
        lbl_p2_score.setStyleSheet("font-weight: bold; font-size: 14px;")
        layout_p2.addWidget(lbl_p2_score, 1, 0)
        
        self.spin_p2_score = QSpinBox()
        self.spin_p2_score.setValue(self.config["p2_score"])
        self.spin_p2_score.setStyleSheet("font-size: 18px; font-weight: bold; padding: 5px;")
        self.spin_p2_score.valueChanged.connect(self.update_data)
        layout_p2.addWidget(self.spin_p2_score, 1, 1)

        # Nút +/- điểm nhanh
        btn_p2_up = QPushButton("▲")
        btn_p2_up.setStyleSheet("background-color: #27ae60; color: white; font-size: 20px; font-weight: bold; padding: 5px 10px; border-radius: 5px;")
        btn_p2_up.clicked.connect(lambda: self.spin_p2_score.setValue(self.spin_p2_score.value() + 1))
        
        btn_p2_down = QPushButton("▼")
        btn_p2_down.setStyleSheet("background-color: #e74c3c; color: white; font-size: 20px; font-weight: bold; padding: 5px 10px; border-radius: 5px;")
        btn_p2_down.clicked.connect(lambda: self.spin_p2_score.setValue(max(0, self.spin_p2_score.value() - 1)))
        layout_p2.addWidget(btn_p2_up, 1, 2)
        layout_p2.addWidget(btn_p2_down, 1, 3)

        # Chọn ảnh đại diện và Quốc kỳ
        btn_p2_avatar = QPushButton("Đổi Avatar")
        btn_p2_avatar.clicked.connect(lambda: self.choose_file("p2_avatar"))
        layout_p2.addWidget(btn_p2_avatar, 3, 0, 1, 2)

        btn_p2_flag = QPushButton("Đổi Quốc Kỳ")
        btn_p2_flag.clicked.connect(lambda: self.choose_file("p2_flag"))
        layout_p2.addWidget(btn_p2_flag, 3, 2, 1, 2)

        self.group_p2.setLayout(layout_p2)
        
        # ---------------- KHU VỰC CHÍNH GIỮA (Cột 1) ----------------
        layout_center = QVBoxLayout()
        layout_center.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Nút Swap
        btn_swap = QPushButton("🔄")
        btn_swap.setToolTip("Đổi chỗ P1 <-> P2")
        btn_swap.setStyleSheet("font-size: 36px; background-color: transparent; border: none; padding: 10px;")
        btn_swap.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_swap.clicked.connect(self.swap_players)
        layout_center.addWidget(btn_swap, alignment=Qt.AlignmentFlag.AlignCenter)
        
        layout_center.addSpacing(50)
        
        # 3 Nút Chọn Lượt (Active Player)
        layout_arrows = QHBoxLayout()
        layout_arrows.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout_arrows.setSpacing(15)
        self.btn_active_p1 = QPushButton("◀")
        self.btn_active_p1.setToolTip("Lượt Người chơi 1")
        self.btn_active_none = QPushButton("■")
        self.btn_active_none.setToolTip("Không hiển thị lượt")
        self.btn_active_p2 = QPushButton("▶")
        self.btn_active_p2.setToolTip("Lượt Người chơi 2")
        
        font_arrow = QFont("Arial", 20, QFont.Weight.Bold)
        for btn in (self.btn_active_p1, self.btn_active_none, self.btn_active_p2):
            btn.setFont(font_arrow)
            btn.setFixedSize(50, 50)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            layout_arrows.addWidget(btn)
            
        self.btn_active_p1.clicked.connect(lambda: self.set_active_player(1))
        self.btn_active_none.clicked.connect(lambda: self.set_active_player(0))
        self.btn_active_p2.clicked.connect(lambda: self.set_active_player(2))
        
        layout_center.addLayout(layout_arrows)
        
        grid.addLayout(layout_center, 0, 1)
        grid.addWidget(self.group_p2, 0, 2)

        main_layout.addLayout(grid)
        self.set_active_player(1)
        
        main_layout.addSpacing(10)

        # ---------------- KẾT NỐI API / CHỌN BÀN ----------------
        group_api = QGroupBox("Kết nối API – Chọn Bàn")
        layout_api = QGridLayout()
        layout_api.setSpacing(6)

        self.input_api_url = QLineEdit("https://cms.poolarena.vn")

        self.btn_load_tables = QPushButton("Tải Bàn Đang Thi Đấu")
        self.btn_load_tables.setStyleSheet("background-color: #2980b9; color: white; font-weight: bold; padding: 5px 10px;")
        self.btn_load_tables.clicked.connect(self.fetch_tables)
        layout_api.addWidget(self.btn_load_tables, 0, 3)

        layout_api.addWidget(QLabel("Chọn Bàn:"), 0, 0)
        self.combo_table = QComboBox()
        self.combo_table.setMinimumWidth(160)
        self.combo_table.currentTextChanged.connect(self.on_table_changed)
        layout_api.addWidget(self.combo_table, 0, 1, 1, 2)

        self.btn_connect = QPushButton("Kết Nối")
        self.btn_connect.setStyleSheet("background-color: #27ae60; color: white; font-weight: bold; padding: 5px 10px;")
        self.btn_connect.clicked.connect(self.toggle_connection)
        layout_api.addWidget(self.btn_connect, 0, 3)

        self.lbl_api_status = QLabel("● Chưa kết nối")
        self.lbl_api_status.setStyleSheet("color: #7f8c8d; font-weight: bold;")
        layout_api.addWidget(self.lbl_api_status, 1, 0, 1, 4)

        group_api.setLayout(layout_api)
        main_layout.addWidget(group_api)

        main_layout.addSpacing(6)

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

    def choose_file(self, config_key):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Chọn hình ảnh", "", "Hình ảnh (*.png *.jpg *.jpeg *.webp *.bmp)"
        )
        if file_path:
            self.config[config_key] = file_path
            self.update_overlay()

    def swap_players(self):
        t_name = self.input_p1_name.text()
        self.input_p1_name.setText(self.input_p2_name.text())
        self.input_p2_name.setText(t_name)
        
        t_score = self.spin_p1_score.value()
        self.spin_p1_score.setValue(self.spin_p2_score.value())
        self.spin_p2_score.setValue(t_score)
        
        t_avatar = self.config["p1_avatar"]
        self.config["p1_avatar"] = self.config["p2_avatar"]
        self.config["p2_avatar"] = t_avatar
        
        t_flag = self.config["p1_flag"]
        self.config["p1_flag"] = self.config["p2_flag"]
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
        self.config["p1_name"] = self.input_p1_name.text()
        self.config["p2_name"] = self.input_p2_name.text()
        self.config["p1_score"] = self.spin_p1_score.value()
        self.config["p2_score"] = self.spin_p2_score.value()
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
        return self.config

    def open_settings(self):
        dialog = SettingsDialog(self)
        dialog.exec()

    def reset_match(self):
        self.spin_p1_score.setValue(0)
        self.spin_p2_score.setValue(0)
        self.set_active_player(1)
        self.update_data()

    def update_window_title(self, text):
        if text.strip() == "":
            text = "OBS Live Scoreboard Overlay"
        if hasattr(self, 'overlay1'): self.overlay1.setWindowTitle(text + " - Bảng 1")
        if hasattr(self, 'overlay2'): self.overlay2.setWindowTitle(text + " - Bảng 2")

    # ---------------- API / TABLE METHODS ----------------

    def fetch_tables(self):
        base_url = self.input_api_url.text().rstrip('/')
        self.lbl_api_status.setText("● Đang tải danh sách bàn...")
        self.lbl_api_status.setStyleSheet("color: #f39c12; font-weight: bold;")
        thread = threading.Thread(target=self._fetch_tables_worker, args=(base_url,), daemon=True)
        thread.start()

    def _fetch_tables_worker(self, base_url):
        try:
            req = urllib.request.urlopen(f"{base_url}/api/tournaments", timeout=8)
            raw = json.loads(req.read().decode())
            tournaments = raw if isinstance(raw, list) else raw.get("data", raw.get("items", []))

            active_tour_statuses = {"ongoing", "active", "in_progress", "started", "running"}
            active_tours = [t for t in tournaments if (t.get("status") or "").lower() in active_tour_statuses]
            if not active_tours:
                # fallback: tất cả chưa kết thúc
                active_tours = [t for t in tournaments if (t.get("status") or "").lower() not in {"completed", "cancelled", "canceled", "finished"}]

            active_match_statuses = {"in_progress", "ongoing", "active", "playing", "started", "running"}
            seen = set()
            table_names = []

            for tour in active_tours:
                tid = tour.get("id")
                if not tid:
                    continue
                try:
                    req2 = urllib.request.urlopen(f"{base_url}/api/tournaments/{tid}/matches", timeout=8)
                    matches_raw = json.loads(req2.read().decode())
                    matches = matches_raw if isinstance(matches_raw, list) else matches_raw.get("data", matches_raw.get("items", []))
                    for match in matches:
                        status = (match.get("status") or "").lower()
                        table_no = match.get("table_no") or match.get("table_name") or match.get("table")
                        if table_no and status in active_match_statuses and table_no not in seen:
                            seen.add(table_no)
                            table_names.append(table_no)
                except Exception:
                    continue

            self.api_signals.tables_loaded.emit(table_names)
        except Exception as e:
            self.api_signals.error.emit(f"Tải bàn thất bại: {str(e)[:60]}")

    def on_tables_loaded(self, tables):
        self.combo_table.clear()
        if tables:
            self.combo_table.addItems(tables)
            self.lbl_api_status.setText(f"● Tìm thấy {len(tables)} bàn đang thi đấu")
            self.lbl_api_status.setStyleSheet("color: #27ae60; font-weight: bold;")
            # Tự động kết nối nếu chưa đang kết nối
            if not self.api_timer.isActive():
                self.toggle_connection()
        else:
            self.lbl_api_status.setText("● Không có bàn nào đang thi đấu")
            self.lbl_api_status.setStyleSheet("color: #e74c3c; font-weight: bold;")

    def on_table_changed(self, table_name):
        if self.api_timer.isActive() and table_name:
            self.poll_active_match()

    def toggle_connection(self):
        if self.api_timer.isActive():
            self.api_timer.stop()
            self.btn_connect.setText("Kết Nối")
            self.btn_connect.setStyleSheet("background-color: #27ae60; color: white; font-weight: bold; padding: 5px 10px;")
            self.lbl_api_status.setText("● Đã ngắt kết nối")
            self.lbl_api_status.setStyleSheet("color: #7f8c8d; font-weight: bold;")
        else:
            table_name = self.combo_table.currentText()
            if not table_name:
                self.lbl_api_status.setText("● Vui lòng tải và chọn bàn trước!")
                self.lbl_api_status.setStyleSheet("color: #e74c3c; font-weight: bold;")
                return
            self.poll_active_match()
            self.api_timer.start(3000)
            self.btn_connect.setText("Ngắt Kết Nối")
            self.btn_connect.setStyleSheet("background-color: #e74c3c; color: white; font-weight: bold; padding: 5px 10px;")
            self.lbl_api_status.setText(f"● Đang kết nối bàn: {table_name}...")
            self.lbl_api_status.setStyleSheet("color: #f39c12; font-weight: bold;")

    def poll_active_match(self):
        table_name = self.combo_table.currentText()
        if not table_name:
            return
        base_url = self.input_api_url.text().rstrip('/')
        thread = threading.Thread(
            target=self._fetch_match_worker,
            args=(base_url, table_name),
            daemon=True
        )
        thread.start()

    def _fetch_match_worker(self, base_url, table_name):
        try:
            encoded = urllib.parse.quote(table_name)
            url = f"{base_url}/api/tournaments/device/active-match?table_name={encoded}"
            req = urllib.request.urlopen(url, timeout=5)
            data = json.loads(req.read().decode())

            # Download avatars (flat fields: player1_avatar, player2_avatar)
            for num in ("1", "2"):
                avatar_url = data.get(f"player{num}_avatar") or ""
                player_id = data.get(f"player{num}_id") or f"player{num}"
                if not avatar_url:
                    continue
                if avatar_url.startswith("/"):
                    avatar_url = base_url + avatar_url
                local = self._download_avatar(avatar_url, player_id)
                if local:
                    data[f"player{num}_local_avatar"] = local

            self.api_signals.match_data.emit(data)
        except Exception as e:
            self.api_signals.error.emit(str(e)[:80])

    def _download_avatar(self, url, player_id):
        cache_key = f"{player_id}_{url}"
        if cache_key in self.avatar_cache:
            cached = self.avatar_cache[cache_key]
            if os.path.exists(cached):
                return cached

        cache_dir = os.path.join(ASSETS_DIR, "cache")
        os.makedirs(cache_dir, exist_ok=True)

        ext = url.rsplit(".", 1)[-1].split("?")[0].lower()
        if ext not in ("png", "jpg", "jpeg", "webp"):
            ext = "png"
        local_path = os.path.join(cache_dir, f"avatar_{player_id}.{ext}")

        try:
            urllib.request.urlretrieve(url, local_path)
            self.avatar_cache[cache_key] = local_path
            return local_path
        except Exception:
            return None

    def apply_match_data(self, data):
        # API trả về flat fields: player1_name, player1_rank, player1_avatar, ...
        p1_name = data.get("player1_name") or "Player 1"
        p2_name = data.get("player2_name") or "Player 2"
        p1_score = int(data.get("player1_score") or 0)
        p2_score = int(data.get("player2_score") or 0)
        p1_rank = data.get("player1_rank") or ""
        p2_rank = data.get("player2_rank") or ""

        if self.input_p1_name.text() != p1_name:
            self.input_p1_name.blockSignals(True)
            self.input_p1_name.setText(p1_name)
            self.input_p1_name.blockSignals(False)

        if self.input_p2_name.text() != p2_name:
            self.input_p2_name.blockSignals(True)
            self.input_p2_name.setText(p2_name)
            self.input_p2_name.blockSignals(False)

        if self.spin_p1_score.value() != p1_score:
            self.spin_p1_score.blockSignals(True)
            self.spin_p1_score.setValue(p1_score)
            self.spin_p1_score.blockSignals(False)

        if self.spin_p2_score.value() != p2_score:
            self.spin_p2_score.blockSignals(True)
            self.spin_p2_score.setValue(p2_score)
            self.spin_p2_score.blockSignals(False)

        self.config["p1_name"] = p1_name
        self.config["p2_name"] = p2_name
        self.config["p1_score"] = p1_score
        self.config["p2_score"] = p2_score
        self.config["p1_rank"] = p1_rank
        self.config["p2_rank"] = p2_rank

        # Race to & tên vòng đấu từ backend (đã tính sẵn)
        race_to = data.get("race_to")
        if race_to is not None:
            self.config["race_to"] = int(race_to)

        round_name = (data.get("round_name") or "").strip()
        if round_name:
            self.config["round_name"] = round_name

        # Avatar từ server (đã download local)
        self.config["p1_avatar"] = data.get("player1_local_avatar") or self.default_avatar
        self.config["p2_avatar"] = data.get("player2_local_avatar") or self.default_avatar

        table = self.combo_table.currentText()
        self.lbl_api_status.setText(f"● Live: {table}  |  {p1_name} {p1_score} – {p2_score} {p2_name}")
        self.lbl_api_status.setStyleSheet("color: #27ae60; font-weight: bold;")

        self.update_overlay()

    def on_api_error(self, msg):
        self.lbl_api_status.setText(f"● Lỗi: {msg}")
        self.lbl_api_status.setStyleSheet("color: #e74c3c; font-weight: bold;")

    def closeEvent(self, event):
        # Đóng cả cửa sổ phụ khi tắt bộ điều khiển chính
        self.api_timer.stop()
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
