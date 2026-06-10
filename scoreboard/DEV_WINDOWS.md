# Plan: Chạy Scoreboard trên Windows (Dev/Test)

## Vấn đề với `run.sh` hiện tại trên Windows

| # | Vấn đề | Dòng | Lý do |
|---|--------|------|-------|
| 1 | **Display detection** — `who`, `pgrep`, `/run/user/`, socket Wayland/X11 | 16–127 | Chỉ tồn tại trên Linux. Windows dùng Win32 display natively, Qt tự xử lý. |
| 2 | **`xdpyinfo`** — kiểm tra X11 display | 117–127 | Không có trên Windows. |
| 3 | **`stat -c%s`** — đọc size file (log rotation) | 157 | Cú pháp Linux. Git Bash trên Windows không hỗ trợ `-c%s`. |
| 4 | **`venv/bin/python`** — đường dẫn Python trong venv | 137–144 | Windows dùng `venv\Scripts\python.exe`, không phải `venv/bin/python`. |
| 5 | **`QT_QPA_PLATFORM=xcb`** — Qt X11 backend | 101 | Trên Windows cần `windows` (hoặc để Qt tự detect). Đặt `xcb` sẽ crash. |
| 6 | **`python3`** — tên binary Python | 136 | Windows thường chỉ có `python`, không có `python3`. |

---

## Giải pháp

Thêm **OS detection** vào đầu `run.sh` và nhánh riêng cho Windows:

- Bỏ qua toàn bộ display detection khi không phải Linux.
- Dùng `venv/Scripts/python` (Windows) thay vì `venv/bin/python`.
- Dùng `wc -c` thay `stat -c%s` cho cross-platform log rotation.
- Đặt `QT_QPA_PLATFORM=windows` trên Windows.
- Fallback binary: `python` thay vì `python3` trên Windows.

---

## Yêu cầu môi trường Windows

### Phần mềm cần cài

1. **Python 3.11+** — https://python.org (tick "Add to PATH")
2. **Git for Windows** — bao gồm Git Bash (để chạy `.sh`)
3. **PySide6** — cài qua pip (xem bên dưới)

### Setup lần đầu

Mở **Git Bash** trong thư mục `scoreboard/`:

```bash
# 1. Tạo virtual environment
python -m venv venv

# 2. Cài dependencies
venv/Scripts/pip install -r requirements.txt
```

### Tạo file `.env` (tuỳ chọn)

```bash
# Tạo file .env để cấu hình API
echo "POOLARENA_API_BASE_URL=http://localhost:8000" > .env
```

---

## Cách chạy trên Windows

Mở **Git Bash** trong thư mục `scoreboard/` và chạy:

```bash
bash run.sh
```

Hoặc:

```bash
./run.sh
```

App sẽ khởi động với Qt native Windows renderer. Cửa sổ hiện ra bình thường.

---

## Thay đổi trong `run.sh`

### 1. OS detection (thêm vào đầu)
```bash
detect_os() {
    case "$OSTYPE" in
        msys*|cygwin*|win32*) echo "windows" ;;
        linux*)               echo "linux" ;;
        darwin*)              echo "macos" ;;
        *)                    echo "unknown" ;;
    esac
}
OS_TYPE=$(detect_os)
```

### 2. Display detection — chỉ chạy trên Linux
```bash
if [ "$OS_TYPE" = "linux" ]; then
    # ... toàn bộ logic X11/Wayland detection ...
else
    export QT_QPA_PLATFORM="${QT_QPA_PLATFORM:-windows}"
fi
```

### 3. Venv path — khác nhau theo OS
```bash
if [ "$OS_TYPE" = "windows" ]; then
    VENV_PYTHON="$VENV_PATH/Scripts/python"
else
    VENV_PYTHON="$VENV_PATH/bin/python"
fi
```

### 4. Log rotation — cross-platform
```bash
if [ "$OS_TYPE" = "linux" ]; then
    LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
else
    LOG_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null | tr -d ' ' || echo 0)
fi
```

### 5. Python binary fallback
```bash
if [ "$OS_TYPE" = "windows" ]; then
    PYTHON_BIN="python"
else
    PYTHON_BIN="python3"
fi
```

---

## Ghi chú

- **Camera/DVR features**: Sẽ không hoạt động trên Windows (phụ thuộc GStreamer + V4L2 Linux). Đây là feature kiosk, chỉ cần test UI.
- **VAAPI**: `LIBVA_DRIVER_NAME=null` set trong `app.py` — harmless trên Windows, không gây lỗi.
- **Kiosk mode** (`kiosk-run.sh`): Chỉ dành cho production Ubuntu. Không sửa file này.
- **Virtual keyboard**: `QT_IM_MODULE=qtvirtualkeyboard` hoạt động trên Windows nếu PySide6 có cài Qt Virtual Keyboard component.
