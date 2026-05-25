import sys
import os
import json
import requests
import threading
import hashlib
from PySide6.QtGui import QGuiApplication, QScreen
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtCore import QUrl, Property, QObject, Signal, Slot, QTimer

# Cấu hình API — ưu tiên biến môi trường, fallback sang hardcode
API_BASE_URL = os.environ.get("API_BASE_URL", "http://192.168.1.188:8000").rstrip("/")
API_SETTINGS_URL = f"{API_BASE_URL}/api/store-settings/public"

class ImageProvider(QObject):
    bannerListChanged = Signal()

    def __init__(self, banners):
        super().__init__()
        self._banners = banners

    @Property(list, notify=bannerListChanged)
    def banners(self):
        return self._banners

    @Slot(list)
    def update_banners(self, new_banners):
        if self._banners != new_banners:
            print(f"Server cập nhật banner mới: {len(new_banners)} ảnh. Đang làm mới giao diện...")
            self._banners = new_banners
            self.bannerListChanged.emit()

class BannerPoller(QObject):
    bannersFetched = Signal(list)

    def __init__(self, interval=10000):
        super().__init__()
        self.interval = interval
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.check_api)
        
    def start(self):
        print(f"Bắt đầu theo dõi cập nhật banner (Mỗi {self.interval/1000}s)...")
        self.timer.start(self.interval)

    def check_api(self):
        # Chạy trong luồng riêng để không đơ màn hình
        t = threading.Thread(target=self._fetch_task)
        t.daemon = True
        t.start()

    def _fetch_task(self):
        try:
            new_list = fetch_banner_urls(silent=True)
            if new_list:
                self.bannersFetched.emit(new_list)
        except Exception:
            pass

CACHE_DIR = os.path.expanduser("~/.azpool_banners")

def get_local_path(url):
    ext = os.path.splitext(url.split('?')[0])[1]
    if not ext: ext = ".png"
    filename = hashlib.md5(url.encode('utf-8')).hexdigest() + ext
    return os.path.join(CACHE_DIR, filename)

def cache_banners(url_list, silent=False):
    os.makedirs(CACHE_DIR, exist_ok=True)
    local_urls = []
    
    for url in url_list:
        local_path = get_local_path(url)
        local_url = "file://" + local_path
        
        if os.path.exists(local_path):
            local_urls.append(local_url)
            continue
            
        try:
            if not silent: print(f"Đang tải ảnh: {url}")
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            with open(local_path, "wb") as f:
                f.write(r.content)
            local_urls.append(local_url)
        except Exception as e:
            if not silent: print(f"Lỗi tải ảnh {url}: {e}")
            local_urls.append(url) # Fallback to network URL
            
    # Cleanup old images
    valid_paths = [get_local_path(u) for u in url_list]
    for filename in os.listdir(CACHE_DIR):
        p = os.path.join(CACHE_DIR, filename)
        if p not in valid_paths:
            try:
                os.remove(p)
                if not silent: print(f"Đã xóa ảnh cũ: {p}")
            except Exception:
                pass
                
    return local_urls

def fetch_banner_urls(silent=False):
    """
    Kết nối API Backend để lấy danh sách URL của banner scoreboard.
    Tải ảnh về local disk và trả về list URL dạng file://
    Trả về: List[str]
    """
    try:
        if not silent:
            print(f"Đang tải thông tin từ API: {API_SETTINGS_URL}...")
        
        response = requests.get(API_SETTINGS_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        banner_data = data.get("banner_scoreboard")
        
        if not banner_data:
            if not silent: print("Không tìm thấy dữ liệu 'banner_scoreboard'.")
            return []
            
        if not silent: print(f"Dữ liệu banner tìm thấy")
        
        url_list = []
        
        try:
            parsed = json.loads(banner_data)
            if isinstance(parsed, list):
                url_list = parsed
            elif isinstance(parsed, str):
                url_list = [parsed]
        except (json.JSONDecodeError, TypeError):
            url_list = [banner_data]
            
        final_list = []
        for url in url_list:
            if url:
                if url.startswith("/"):
                    final_list.append(f"{API_BASE_URL}{url}")
                else:
                    final_list.append(url)
                    
        # Download to local drive
        return cache_banners(final_list, silent=silent)
            
    except Exception as e:
        if not silent: print(f"Lỗi khi tải banner từ API: {e}")
        return []

def main():
    # RPi5 Wayland/X11 auto-detect
    if not os.environ.get("QT_QPA_PLATFORM"):
        # Nếu có WAYLAND_DISPLAY → dùng wayland, ngược lại dùng xcb
        if os.environ.get("WAYLAND_DISPLAY"):
            os.environ["QT_QPA_PLATFORM"] = "wayland"
        elif os.environ.get("DISPLAY"):
            os.environ["QT_QPA_PLATFORM"] = "xcb"
        else:
            # Fallback: thử eglfs (direct framebuffer, phổ biến trên RPi)
            os.environ["QT_QPA_PLATFORM"] = "eglfs"

    app = QGuiApplication(sys.argv)
    
    # ====== Log thông tin màn hình để debug TV ======
    screen = app.primaryScreen()
    if screen:
        geo = screen.geometry()
        avail = screen.availableGeometry()
        print(f"=== SCREEN INFO ===")
        print(f"  Name: {screen.name()}")
        print(f"  Geometry: {geo.width()}x{geo.height()}")
        print(f"  Available: {avail.width()}x{avail.height()}")
        print(f"  DPR: {screen.devicePixelRatio()}")
        print(f"  Refresh: {screen.refreshRate()} Hz")
        print(f"  Depth: {screen.depth()} bit")
        print(f"===================")
    else:
        print("CẢNH BÁO: Không phát hiện được màn hình! Kiểm tra kết nối HDMI.")
    
    engine = QQmlApplicationEngine()
    
    banners = []
    
    # 1. Ưu tiên tham số dòng lệnh
    is_local_file = False
    if len(sys.argv) > 1:
        potential_path = sys.argv[1]
        if os.path.exists(potential_path):
             banners = ["file://" + os.path.abspath(potential_path)]
             is_local_file = True
        else:
            banners = [potential_path]
    else:
        # 2. Lấy từ API
        banners = fetch_banner_urls()
        
    # 3. Fallback mặc định
    if not banners:
        banners = ["https://via.placeholder.com/1920x1080?text=AZ+Poolarena+Default"]
        print("Sử dụng ảnh mặc định.")

    print(f"API_BASE_URL: {API_BASE_URL}")
    print(f"Danh sách banner ban đầu: {banners}")

    provider = ImageProvider(banners)
    engine.rootContext().setContextProperty("imageProvider", provider)
    
    # Kích hoạt chế độ kiểm tra tự động nếu không phải đang xem file local
    if not is_local_file:
        poller = BannerPoller(interval=10000) # 10 giây check 1 lần
        poller.bannersFetched.connect(provider.update_banners)
        poller.start()
        # Giữ reference để không bị Garbage Collected
        engine.poller = poller
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    qml_file = os.path.join(current_dir, "main.qml")
    
    engine.load(QUrl.fromLocalFile(qml_file))
    
    if not engine.rootObjects():
        sys.exit(-1)
        
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
