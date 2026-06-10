# app.py
import os
import sys
from pathlib import Path

# ===== Load .env file if exists =====
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.is_file():
    with open(_env_path, "r", encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                _key, _val = _key.strip(), _val.strip()
                if _key and _key not in os.environ:
                    os.environ[_key] = _val

# ===== Safe env cho Wayland/X11 + GStreamer =====
session_type = os.environ.get("XDG_SESSION_TYPE", "").lower()
display_env = os.environ.get("DISPLAY")
wayland_env = os.environ.get("WAYLAND_DISPLAY")

# Provide a local font directory so Qt doesn't look for its own bundled fonts
if not os.environ.get("QT_QPA_FONTDIR"):
    font_dir = Path(__file__).resolve().parent / "assets" / "fonts"
    if font_dir.is_dir():
        os.environ["QT_QPA_FONTDIR"] = str(font_dir)

# Chỉ đặt QT_QPA_PLATFORM khi chưa có
if not os.environ.get("QT_QPA_PLATFORM"):
    if session_type == "wayland" or wayland_env:
        os.environ["QT_QPA_PLATFORM"] = "wayland"
    elif display_env:
        os.environ["QT_QPA_PLATFORM"] = "xcb"
    else:
        # Không có desktop -> offscreen (vẫn cho phép render/headless)
        os.environ["QT_QPA_PLATFORM"] = "offscreen"

# Render loop / RHI
os.environ.setdefault("QSG_RENDER_LOOP", "threaded")
os.environ.setdefault("QSG_RHI_BACKEND", "opengl")  # Qt 6 valid: vulkan, opengl, null

# Controls style + HiDPI
os.environ.setdefault("QT_QUICK_CONTROLS_STYLE", "Material")
os.environ.setdefault("QT_ENABLE_HIGHDPI_SCALING", "1")
os.environ.setdefault("QT_AUTO_SCREEN_SCALE_FACTOR", "1")

# Qt Virtual Keyboard - bắt buộc để InputPanel hoạt động
os.environ.setdefault("QT_IM_MODULE", "qtvirtualkeyboard")
# Đảm bảo bàn phím ảo sử dụng đúng font hỗ trợ tiếng Việt
os.environ.setdefault("QT_VIRTUALKEYBOARD_FONT_FAMILY", "Montserrat")

# Multimedia backend (FFmpeg - bundled with PySide6)
os.environ.setdefault("QT_MEDIA_BACKEND", "ffmpeg")

# Disable VAAPI hardware video decoding for Qt FFmpeg backend
# Prevents SIGSEGV 139 ("Cannot map a video frame in ReadOnly mode!")
# Driver incompatibility with Qt's FFmpeg VAAPI implementation on Intel iGPU
# This only affects QML video player; GStreamer relay/recording are separate processes
os.environ["LIBVA_DRIVER_NAME"] = "null"

from PySide6.QtCore import QLocale, QUrl, Qt, QEvent, QObject
from PySide6.QtGui import QGuiApplication, QCursor
from PySide6.QtQml import QQmlApplicationEngine


class KioskEventFilter(QObject):
    """Filter để chặn các phím tắt hệ thống ở mức thấp."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._exit_count = 0
        self._exit_timer = None

    def eventFilter(self, obj, event):
        if event.type() == QEvent.KeyPress:
            key = event.key()
            mods = event.modifiers()

            # Admin exit: Ctrl+Shift+Q nhấn 3 lần liên tiếp trong 2 giây
            if (mods & Qt.ControlModifier) and (mods & Qt.ShiftModifier) and key == Qt.Key_Q:
                self._exit_count += 1
                if self._exit_count >= 3:
                    QGuiApplication.quit()
                    return True
                # Reset counter sau 2 giây
                if self._exit_timer is None:
                    from PySide6.QtCore import QTimer
                    self._exit_timer = QTimer(self)
                    self._exit_timer.setSingleShot(True)
                    self._exit_timer.timeout.connect(self._reset_exit_count)
                self._exit_timer.start(2000)
                return True

            # Chặn Alt+F4, Alt+Tab, Super key, etc.
            if mods & Qt.AltModifier:
                if key in (Qt.Key_F4, Qt.Key_Tab, Qt.Key_Escape):
                    return True  # Block
            if mods & Qt.MetaModifier:  # Super/Windows key
                return True  # Block tất cả Super+*
            if key == Qt.Key_Super_L or key == Qt.Key_Super_R:
                return True  # Block Super key đơn

        # Chặn close event
        if event.type() == QEvent.Close:
            event.ignore()
            return True

        return super().eventFilter(obj, event)

    def _reset_exit_count(self):
        self._exit_count = 0


try:
    from PySide6.QtQuickControls2 import QQuickStyle
    QQuickStyle.setStyle("Material")
except Exception:
    pass

from core.controller import Controller
from core.rankings_service import RankingsService
from core.camera_controller import CameraController
from core.dvr_controller import DVRController
from core.clip_controller import ClipController
from core.device_settings import DeviceSettings
from core.banner_service import BannerService
from core.orders_service import OrdersService
from core.image_cache_service import ImageCacheService
from core.tournament_service import TournamentService

def resource_path(*parts: str) -> str:
    base = Path(__file__).resolve().parent
    return str((base / Path(*parts)).resolve())

def main():
    # Locale mặc định tiếng Việt
    QLocale.setDefault(QLocale(QLocale.Vietnamese, QLocale.Vietnam))

    # Chính sách HiDPI (gọi trước khi tạo app)
    QGuiApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )

    # Tạo app
    app = QGuiApplication(sys.argv)
    app.setApplicationName("AZ Scoreboard")
    app.setOrganizationName("AZ Team")

    # Cài đặt font mặc định cho toàn bộ ứng dụng (đặc biệt quan trọng cho bàn phím ảo và tiếng Việt)
    from PySide6.QtGui import QFont, QFontDatabase
    font_path = resource_path("assets", "fonts", "Montserrat-Regular.otf")
    font_id = QFontDatabase.addApplicationFont(font_path)
    if font_id != -1:
        font_family = QFontDatabase.applicationFontFamilies(font_id)[0]
        app.setFont(QFont(font_family, 12))
        print(f"[App] Default font set to: {font_family}")
    else:
        print("[App] WARNING: Failed to load Montserrat for global font")

    # Kiosk Event Filter chỉ bật ở production (/opt/) — dev mode cho phép Alt+Tab, Alt+F4, etc.
    is_production = "/opt/" in os.path.abspath(__file__)
    if is_production:
        kiosk_filter = KioskEventFilter(app)
        app.installEventFilter(kiosk_filter)

    # CWD là thư mục app để QML tìm đường dẫn tương đối đúng
    os.chdir(Path(__file__).resolve().parent)

    # Engine + import path
    engine = QQmlApplicationEngine()
    engine.addImportPath(resource_path("qml"))

    # Expose production flag to QML — dev mode disables kiosk window behaviors
    is_production = "/opt/" in os.path.abspath(__file__)
    engine.rootContext().setContextProperty("IsProduction", is_production)

    # Context singletons
    ctrl = Controller()
    engine.rootContext().setContextProperty("Controller", ctrl)

    api_base_url = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
    engine.rootContext().setContextProperty("ApiBaseUrl", api_base_url)

    device_settings = DeviceSettings()
    engine.rootContext().setContextProperty("DeviceSettings", device_settings)

    rankings_service = RankingsService()
    engine.rootContext().setContextProperty("RankingsService", rankings_service)

    orders_service = OrdersService(device_settings)
    engine.rootContext().setContextProperty("OrdersService", orders_service)

    tournament_service = TournamentService(device_settings)
    engine.rootContext().setContextProperty("TournamentService", tournament_service)

    from core.device_activation_service import DeviceActivationService
    activation_service = DeviceActivationService()
    engine.rootContext().setContextProperty("DeviceActivationService", activation_service)

    camera_controller = CameraController()
    engine.rootContext().setContextProperty("CameraController", camera_controller)

    # Connect: when backend sends new camera URLs → auto-update camera config
    activation_service.cameraUrlsReceived.connect(camera_controller.updateFromServer)

    dvr_controller = DVRController()
    engine.rootContext().setContextProperty("DVRController", dvr_controller)

    clip_controller = ClipController()
    engine.rootContext().setContextProperty("ClipController", clip_controller)

    banner_service = BannerService()
    engine.rootContext().setContextProperty("BannerService", banner_service)

    image_cache = ImageCacheService()
    engine.rootContext().setContextProperty("ImageCache", image_cache)
    # Note: Don't fetch yet - wait for QML to load first

    # Load UI chính
    main_qml = QUrl.fromLocalFile(resource_path("qml", "Main.qml"))
    engine.load(main_qml)

    if not engine.rootObjects():
        sys.exit("Failed to load QML.")
    
    # NOW fetch banners after QML is loaded and HomePage is ready to listen
    banner_service.fetch_banners("tournament")
    banner_service.start_auto_refresh()

    # Ẩn chuột khi chạy dạng production (.deb) từ /opt/
    try:
        if "/opt/" in os.path.abspath(__file__):
            QGuiApplication.setOverrideCursor(QCursor(Qt.BlankCursor))
        else:
            print("[DEV MODE] Mouse cursor is VISIBLE.")
    except Exception:
        pass

    # Lắng nghe lệnh Shutdown từ xa qua ESP32 (Chạy ngầm ở UDP 5555)
    from core.shutdown_listener import ShutdownListener
    shutdown_listener = ShutdownListener(5555, app)
    engine.rootContext().setContextProperty("ShutdownListener", shutdown_listener)
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
