FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for GUI (even if not used, keeps it ready)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libfontconfig1 \
    libxrender1 \
    libdbus-1-3 \
    libxkbcommon-x11-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# This app is usually run on host, but we can build it here
# For now, it stays as a placeholder or builder
CMD ["python", "main.py"]
