# Sử dụng image Python trên nền Debian slim để nhẹ
FROM python:3.9-slim-bookworm

# Cài đặt các thư viện hệ thống cần thiết cho Qt/PySide6
# libxcb-cursor0 và libxcb-xinerama0 là bắt buộc để chạy PySide6
RUN apt-get update && apt-get install -y \
    libegl1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libxcb-cursor0 \
    libxcb-xinerama0 \
    libx11-xcb1 \
    libxcb-keysyms1 \
    libxcb-image0 \
    libxcb-shm0 \
    libxcb-icccm4 \
    libxcb-sync1 \
    libxcb-xfixes0 \
    libxcb-shape0 \
    libxcb-randr0 \
    libxcb-render-util0 \
    libxcb-util1 \
    libfontconfig1 \
    libdbus-1-3 \
    libxkbcommon-x11-0 \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy requirements và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Chạy ứng dụng
CMD ["python", "main.py"]
