import sys
import os

# Khắc phục lỗi xung đột Qt platform plugin trên Windows/Linux khi có nhiều phiên bản Qt khác nhau
try:
    import PySide6
    pyside_dir = os.path.dirname(PySide6.__file__)
    plugins_dir = os.path.join(pyside_dir, "plugins")
    if os.path.exists(plugins_dir):
        os.environ["QT_QPA_PLATFORM_PLUGIN_PATH"] = os.path.join(plugins_dir, "platforms")
        os.environ["QT_PLUGIN_PATH"] = plugins_dir
        print(f"Cấu hình thành công Qt Plugin Path: {plugins_dir}")
except Exception as e:
    print(f"Cảnh báo cấu hình Qt Plugin Path: {e}")

import json
import requests
import threading
import hashlib
import re
from datetime import datetime, timezone, timedelta
from PySide6.QtGui import QGuiApplication, QScreen
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtCore import QUrl, Property, QObject, Signal, Slot, QTimer

# Cấu hình API — ưu tiên biến môi trường, fallback sang production server
API_BASE_URL = os.environ.get("API_BASE_URL", "https://cms.poolarena.vn").rstrip("/")
API_SETTINGS_URL = f"{API_BASE_URL}/api/store-settings/public"

class ImageProvider(QObject):
    bannerListChanged = Signal()
    activeMatchesChanged = Signal()

    def __init__(self, banners):
        super().__init__()
        self._banners = banners
        self._active_matches = []

    @Property(list, notify=bannerListChanged)
    def banners(self):
        return self._banners

    @Property(list, notify=activeMatchesChanged)
    def activeMatches(self):
        return self._active_matches

    @Property(bool, notify=activeMatchesChanged)
    def hasActiveMatches(self):
        return len(self._active_matches) > 0

    @Property(str, constant=True)
    def apiBaseUrl(self):
        return API_BASE_URL

    @Slot(list)
    def update_banners(self, new_banners):
        if self._banners != new_banners:
            print(f"Server cập nhật banner mới: {len(new_banners)} ảnh. Đang làm mới giao diện...")
            self._banners = new_banners
            self.bannerListChanged.emit()

    @Slot(list)
    def update_matches(self, new_matches):
        if self._active_matches != new_matches:
            self._active_matches = new_matches
            self.activeMatchesChanged.emit()

class BannerPoller(QObject):
    bannersFetched = Signal(list)
    matchesFetched = Signal(list)

    def __init__(self, match_interval=2000, banner_interval=30000):
        super().__init__()
        # Timer riêng cho matches — cập nhật nhanh, không bị block bởi banner fetch
        self.match_timer = QTimer(self)
        self.match_timer.timeout.connect(self._check_matches)
        self.match_interval = match_interval
        # Timer riêng cho banners — ít thay đổi, không cần nhanh
        self.banner_timer = QTimer(self)
        self.banner_timer.timeout.connect(self._check_banners)
        self.banner_interval = banner_interval

    def start(self):
        print(f"Bắt đầu theo dõi: matches mỗi {self.match_interval/1000}s, banners mỗi {self.banner_interval/1000}s...")
        self.match_timer.start(self.match_interval)
        self.banner_timer.start(self.banner_interval)

    def _check_matches(self):
        t = threading.Thread(target=self._fetch_matches)
        t.daemon = True
        t.start()

    def _check_banners(self):
        t = threading.Thread(target=self._fetch_banners)
        t.daemon = True
        t.start()

    def _fetch_matches(self):
        try:
            tournament, new_matches = fetch_active_matches(API_BASE_URL)
            # Always emit — empty list clears display, exception keeps last known data
            self.matchesFetched.emit(new_matches)
        except Exception:
            pass

    def _fetch_banners(self):
        try:
            new_banners = fetch_banner_urls(silent=True)
            if new_banners:
                self.bannersFetched.emit(new_banners)
        except Exception:
            pass

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "banner_cache")

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

# Helper functions for matches data processing
RANK_ORDER = ['K', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S']

def get_rank_index(rank):
    if not rank: return -1
    try:
        return RANK_ORDER.index(rank.upper())
    except ValueError:
        return -1

def compute_race_text(p1_rank, p2_rank, tournament):
    if not tournament or not p1_rank or not p2_rank: return ""
    r1 = get_rank_index(p1_rank)
    r2 = get_rank_index(p2_rank)
    if r1 < 0 or r2 < 0: return ""
    
    diff = abs(r1 - r2)
    race_to = 0
    handicap = 0
    
    if diff == 0:
        race_to = int(tournament.get("draw_touch") or 0)
    elif diff == 1:
        race_to = int(tournament.get("handicap_1_touch") or 0)
        handicap = 1
    else:
        race_to = int(tournament.get("handicap_2_touch") or 0)
        handicap = 2
        
    if not race_to: return ""
    if handicap == 0: return f"chạm {race_to}"
    return f"chạm {race_to} chấp {handicap}"

def format_avatar_url(avatar_url, api_base_url):
    if not avatar_url:
        return ""
    if avatar_url.startswith("http"):
        # Thay thế bất kỳ URL local/dev nào (192.168.x.x:port hoặc localhost:port)
        # bằng API base URL hiện tại để tránh kết nối sai server
        normalized = re.sub(r'https?://(?:localhost|192\.168\.\d+\.\d+|127\.0\.0\.1)(:\d+)?', api_base_url, avatar_url)
        return normalized
    return f"{api_base_url}{avatar_url}"

def format_match_time(match_time):
    if not match_time:
        return "", ""
    try:
        iso_str = match_time.replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso_str)
        # Convert to Vietnam timezone (UTC+7)
        vn_tz = timezone(timedelta(hours=7))
        dt_vn = dt.astimezone(vn_tz)
        time_str = dt_vn.strftime("%H:%M")
        date_str = dt_vn.strftime("%d-%m")
        return time_str, date_str
    except Exception:
        return "", ""

def build_score_string(match, p1_rank=None, p2_rank=None):
    status = match.get("status")
    s1 = match.get("player1_score", 0)
    s2 = match.get("player2_score", 0)
    p1_check_in = match.get("player1_check_in")
    p2_check_in = match.get("player2_check_in")

    p1 = match.get("player1") or {}
    p2 = match.get("player2") or {}
    p1_id = p1.get("id") or match.get("player1_id")
    p2_id = p2.get("id") or match.get("player2_id")

    if status == "pending":
        return " vs "

    if p1_check_in == "absent": return "NS vs -"
    if p2_check_in == "absent": return "- vs NS"

    if status == "completed":
        winner_id = match.get("winner_id")
        if not winner_id and match.get("winner"):
            winner_id = match.get("winner").get("id")
        if not p1_id or not p2_id:
            if p1_id and winner_id == p1_id: return "WO vs -"
            if p2_id and winner_id == p2_id: return "- vs WO"
            return " - vs - "

    # Apply handicap head start when both scores are 0 and match is in progress.
    # Device initialises locally with the head start but only pushes an update after the first ball is potted.
    if s1 == 0 and s2 == 0 and status in ("upcoming", "ongoing") and p1_rank and p2_rank:
        r1 = get_rank_index(p1_rank)
        r2 = get_rank_index(p2_rank)
        if r1 >= 0 and r2 >= 0 and r1 != r2:
            head_start = 1 if abs(r1 - r2) == 1 else 2
            if r1 < r2:
                s1 = head_start  # player1 is weaker → gets the head start
            else:
                s2 = head_start  # player2 is weaker → gets the head start

    return f"{s1} vs {s2}"

def dedupe_matches(matches):
    status_rank = lambda s: 0 if s == 'completed' else 1 if s == 'ongoing' else 2 if s == 'upcoming' else 3
    match_map = {}
    for m in matches:
        match_no = m.get("match_no")
        if match_no is None:
            continue
        existing = match_map.get(match_no)
        if not existing:
            match_map[match_no] = m
            continue
            
        def score(x):
            status = x.get("status")
            p1 = x.get("player1") or {}
            p2 = x.get("player2") or {}
            p1_id = p1.get("id") or x.get("player1_id")
            p2_id = p2.get("id") or x.get("player2_id")
            p1_score = x.get("player1_score", 0)
            p2_score = x.get("player2_score", 0)
            
            return (
                status_rank(status) * -100 +
                (10 if x.get("winner_id") else 0) +
                (5 if p1_id and p2_id else 0) +
                (p1_score + p2_score)
            )
            
        if score(m) > score(existing):
            match_map[match_no] = m
            
    return sorted(list(match_map.values()), key=lambda x: x.get("match_no", 0))

def get_bracket_layout(num_players):
    if num_players > 32:
        return {
            "wr1": {"start": 1, "count": 32},
            "lr1": {"start": 33, "count": 16},
            "wr2": {"start": 49, "count": 16},
            "lr2": {"start": 65, "count": 16},
        }
    elif num_players == 24:
        return {
            "wr1": {"start": 1, "count": 8},
            "lr1": {"start": 17, "count": 8},
            "wr2": {"start": 9, "count": 8},
            "lr2": {"start": 0, "count": 0},
        }
    elif num_players > 16:
        return {
            "wr1": {"start": 1, "count": 16},
            "lr1": {"start": 17, "count": 8},
            "wr2": {"start": 25, "count": 8},
            "lr2": {"start": 33, "count": 8},
        }
    else:
        return {
            "wr1": {"start": 1, "count": 8},
            "lr1": {"start": 9, "count": 4},
            "wr2": {"start": 13, "count": 4},
            "lr2": {"start": 17, "count": 4},
        }

def is_source_match_bye(match_no, matches_map):
    m = matches_map.get(match_no)
    if not m:
        return False
    p1 = m.get("player1") or {}
    p2 = m.get("player2") or {}
    has_p1 = bool(p1.get("id") or m.get("player1_id"))
    has_p2 = bool(p2.get("id") or m.get("player2_id"))
    return (has_p1 != has_p2) and m.get("status") == "completed"

def compute_player_fallbacks(match, num_players, matches_map):
    bracket = match.get("bracket")
    round_val = match.get("round", 1)
    match_no = match.get("match_no", 0)
    
    p1_fallback = "Bye"
    p2_fallback = "Bye"
    
    layout = get_bracket_layout(num_players)
    if not layout:
        return p1_fallback, p2_fallback
        
    bracket_matches = [m for m in matches_map.values() if m.get("bracket") == bracket and m.get("round") == round_val]
    bracket_matches.sort(key=lambda x: x.get("match_no", 0))
    try:
        idx_in_round = [m.get("match_no") for m in bracket_matches].index(match_no)
    except ValueError:
        idx_in_round = 0
        
    wr1_start = layout["wr1"]["start"]
    
    if bracket == "winners" and round_val == 2:
        if num_players == 24:
            p1_fallback = f"Thắng trận {idx_in_round + 1}"
            p2_fallback = "Bye"
        else:
            p1_fallback = f"Thắng trận {wr1_start + 2 * idx_in_round}"
            p2_fallback = f"Thắng trận {wr1_start + 2 * idx_in_round + 1}"
            
    elif bracket == "losers" and round_val == 1:
        if num_players == 24:
            wr2_match_no = 33 - match_no
            wr1_match_no = match_no - 16
            p1_fallback = f"Thua trận {wr2_match_no}"
            p2_fallback = f"Thua trận {wr1_match_no}"
            if is_source_match_bye(wr1_match_no, matches_map):
                p2_fallback = "Bye"
        else:
            src1 = wr1_start + 2 * idx_in_round
            src2 = wr1_start + 2 * idx_in_round + 1
            p1_fallback = "Bye" if is_source_match_bye(src1, matches_map) else f"Thua trận {src1}"
            p2_fallback = "Bye" if is_source_match_bye(src2, matches_map) else f"Thua trận {src2}"
            
    elif bracket == "losers" and round_val == 2:
        lr1_start = layout["lr1"]["start"]
        wr2_start = layout["wr2"]["start"]
        wr2_count = layout["wr2"]["count"]
        
        src1 = lr1_start + idx_in_round
        src2 = wr2_start + wr2_count - 1 - idx_in_round
        p1_fallback = f"Thắng trận {src1}"
        p2_fallback = f"Thua trận {src2}"
        
    elif round_val > 2 or (bracket == "knockout" and round_val > 1):
        p1_fallback = "Chờ..."
        p2_fallback = "Chờ..."
        
    return p1_fallback, p2_fallback

def fetch_active_matches(api_base_url):
    try:
        # 1. Fetch public tournaments
        tours_url = f"{api_base_url}/api/tournaments/public"
        r = requests.get(tours_url, timeout=5)
        r.raise_for_status()
        
        tours_json = r.json()
        if isinstance(tours_json, list):
            tours_data = tours_json
        elif isinstance(tours_json, dict):
            tours_data = tours_json.get("data", [])
        else:
            tours_data = []
        
        # 2. Find ongoing tournament
        ongoing_tour = None
        for t in tours_data:
            if isinstance(t, dict) and t.get("status") == "ongoing":
                ongoing_tour = t
                break
                
        if not ongoing_tour:
            return None, []
            
        slug = ongoing_tour.get("slug")
        if not slug:
            return None, []
            
        # 3. Fetch detailed tournament info (for touches)
        tour_detail_url = f"{api_base_url}/api/tournaments/slug/{slug}"
        r_det = requests.get(tour_detail_url, timeout=5)
        r_det.raise_for_status()
        
        det_json = r_det.json()
        if isinstance(det_json, dict):
            tournament = det_json.get("data", ongoing_tour)
        else:
            tournament = ongoing_tour
        
        # 4. Fetch matches
        matches_url = f"{api_base_url}/api/tournaments/slug/{slug}/matches"
        r_mat = requests.get(matches_url, timeout=5)
        r_mat.raise_for_status()
        
        mat_json = r_mat.json()
        if isinstance(mat_json, list):
            matches = mat_json
        elif isinstance(mat_json, dict):
            matches = mat_json.get("data", [])
        else:
            matches = []
        
        # Deduplicate matches
        deduped_matches = dedupe_matches(matches)
        
        # 5. Filter and format active matches
        matches_map = {m.get("match_no"): m for m in deduped_matches}
        num_players = int(tournament.get("number_of_players") or 16)
        
        active_matches = []
        for m in deduped_matches:
            status = m.get("status")
            p1 = m.get("player1") or {}
            p2 = m.get("player2") or {}
            p1_id = p1.get("id") or m.get("player1_id")
            p2_id = p2.get("id") or m.get("player2_id")
            
            # Chỉ hiển thị trận đấu đang diễn ra hoặc sắp diễn ra mà có ít nhất 1 người chơi sẵn sàng
            if status in ["ongoing", "upcoming"] and (p1_id is not None or p2_id is not None):
                active_matches.append(m)
                
        # Format them
        formatted_list = []
        for m in active_matches:
            # Resolve players nested
            p1 = m.get("player1") or {}
            p2 = m.get("player2") or {}
            
            p1_id = p1.get("id") or m.get("player1_id")
            p2_id = p2.get("id") or m.get("player2_id")
            
            p1_fallback, p2_fallback = compute_player_fallbacks(m, num_players, matches_map)
            
            p1_name = p1.get("full_name") or m.get("player1_name") or p1_fallback
            p2_name = p2.get("full_name") or m.get("player2_name") or p2_fallback
            
            p1_avatar = p1.get("avatar_url") or m.get("player1_avatar") or ""
            p2_avatar = p2.get("avatar_url") or m.get("player2_avatar") or ""
            
            p1_rank = p1.get("rank") or m.get("player1_rank") or ""
            p2_rank = p2.get("rank") or m.get("player2_rank") or ""
            
            # Format avatars URLs
            p1_avatar_url = format_avatar_url(p1_avatar, api_base_url)
            p2_avatar_url = format_avatar_url(p2_avatar, api_base_url)
            
            # Race config
            race_text = compute_race_text(p1_rank, p2_rank, tournament)
            
            # Time & date
            match_time = m.get("match_time")
            time_str, date_str = "", ""
            if match_time:
                time_str, date_str = format_match_time(match_time)
            
            # Table no color
            status = m.get("status")
            table_color = "default"
            if status == "ongoing":
                table_color = "green"
            elif status == "upcoming":
                table_color = "yellow"
                
            # Score
            score_str = build_score_string(m, p1_rank, p2_rank)
            score_parts = score_str.split(" vs ") if " vs " in score_str else [score_str, ""]
            p1_score = score_parts[0]
            p2_score = score_parts[1]
            
            # Winner determination
            winner_id = m.get("winner_id")
            if not winner_id and m.get("winner"):
                winner_id = m.get("winner", {}).get("id")
            p1_absent = m.get("player1_check_in") == "absent"
            p2_absent = m.get("player2_check_in") == "absent"
            is_completed = m.get("status") == "completed"
            p1_winner = (is_completed and winner_id == p1_id) or p2_absent
            p2_winner = (is_completed and winner_id == p2_id) or p1_absent
            
            # Normalize Table Number
            table_no = m.get("table_no") or "-"
            
            # Formatted match dict
            formatted_list.append({
                "id": m.get("id"),
                "matchNo": str(m.get("match_no") or ""),
                "tableNumber": table_no,
                "tableNumberColor": table_color,
                "player1Name": p1_name,
                "player1Avatar": p1_avatar_url,
                "player1Rank": p1_rank,
                "player1Score": p1_score,
                "player1IsBye": p1_id is None,
                "player1IsWinner": bool(p1_winner),
                "player2Name": p2_name,
                "player2Avatar": p2_avatar_url,
                "player2Rank": p2_rank,
                "player2Score": p2_score,
                "player2IsBye": p2_id is None,
                "player2IsWinner": bool(p2_winner),
                "hasActiveResult": bool(p1_winner or p2_winner),
                "raceText": race_text,
                "time": time_str,
                "date": date_str
            })
            
        # Sort matches by status (green -> yellow -> default), then table number, then match number
        def sort_key(item):
            color_order = {"green": 1, "yellow": 2, "default": 3}
            color_val = color_order.get(item.get("tableNumberColor"), 3)
            
            table_num_str = item.get("tableNumber") or ""
            match_digits = re.findall(r'\d+', table_num_str)
            table_val = int(match_digits[0]) if match_digits else 999
            
            match_no_val = int(item.get("matchNo") or 0)
            return (color_val, table_val, match_no_val)
            
        formatted_list.sort(key=sort_key)
        return tournament, formatted_list
    except Exception as e:
        print(f"Error fetching active matches: {e}")
        raise e

def main():
    # RPi5 Wayland/X11 auto-detect (chỉ chạy trên Linux)
    if sys.platform.startswith("linux") and not os.environ.get("QT_QPA_PLATFORM"):
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
        current_dir = os.path.dirname(os.path.abspath(__file__))
        default_img_path = os.path.join(current_dir, "default_banner.png")
        if os.path.exists(default_img_path):
            banners = ["file://" + default_img_path]
        else:
            banners = ["https://via.placeholder.com/1920x1080?text=AZ+Poolarena+Default"]
        print("Sử dụng ảnh mặc định.")

    print(f"API_BASE_URL: {API_BASE_URL}")
    print(f"Danh sách banner ban đầu: {banners}")

    provider = ImageProvider(banners)
    engine.rootContext().setContextProperty("imageProvider", provider)
    
    # Kích hoạt chế độ kiểm tra tự động nếu không phải đang xem file local
    if not is_local_file:
        # Lấy dữ liệu trận đấu lần đầu
        try:
            _, initial_matches = fetch_active_matches(API_BASE_URL)
            provider.update_matches(initial_matches)
        except Exception:
            pass

        poller = BannerPoller(match_interval=2000, banner_interval=30000)
        poller.bannersFetched.connect(provider.update_banners)
        poller.matchesFetched.connect(provider.update_matches)
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
