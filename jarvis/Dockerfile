# Jarvis AI — AZ Pool Arena
FROM python:3.11-slim-bookworm

WORKDIR /app

# Cài đặt dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Tạo thư mục static
RUN mkdir -p static

EXPOSE 8899

CMD ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8899"]
