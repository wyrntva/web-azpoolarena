# Hướng dẫn cấu hình Network và IP cho Docker - AzPoolArena

Để dự án hoạt động mượt mà trên môi trường mạng nội bộ (LAN) và kết nối với ứng dụng Desktop, bạn có thể thực hiện theo các cách sau:

## 1. Truy cập qua IP của Máy chủ (Host IP)
Đây là cách đơn giản nhất. Máy tính chạy Docker (Server) sẽ có một địa chỉ IP trong mạng LAN (ví dụ: `192.168.1.187`).

- **Cấu hình Backend (`.env` ở thư mục gốc):**
  ```env
  CORS_ORIGINS=http://localhost:5173,http://192.168.1.187:5173,http://192.168.1.187:8000
  FRONTEND_URL=http://192.168.1.187:5173
  ```
- **Cấu hình Desktop App (`desktop-qr-app/.env`):**
  ```env
  API_BASE_URL=http://192.168.1.187:8000
  FRONTEND_URL=http://192.168.1.187:5173
  ```

## 2. Sử dụng Network Mode: Host (Chỉ cho Linux Server)
Nếu bạn chạy trên Ubuntu/Debian, bạn có thể thiết lập `network_mode: host` trong `docker-compose.yml` để các container dùng chung IP với máy chủ.
*Lưu ý: Cách này không hoạt động tốt trên Windows.*

```yaml
services:
  backend:
    network_mode: host
    # Thay vì ports: - "8000:8000"
```

## 3. Cấu hình IP tĩnh cho Container (Internal Network)
Nếu bạn muốn các container trong Docker có IP nội bộ cố định để giao tiếp với nhau:

```yaml
networks:
  azpool-network:
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  db:
    networks:
      azpool-network:
        ipv4_address: 172.20.0.10
  backend:
    networks:
      azpool-network:
        ipv4_address: 172.20.0.20
```

## 4. Desktop QR App và Docker
Ứng dụng Desktop là ứng dụng giao diện (GUI), nên chạy trực tiếp trên Windows của nhân viên thu ngân.
- Để kết nối với Backend trong Docker, hãy đảm bảo Firewall của máy chủ Docker đã mở port **8000**.
- Đổi `API_BASE_URL` trong file `.env` của app QR sang IP của máy chủ.

## 5. Lệnh khởi động lại sau khi đổi IP
Mỗi khi bạn thay đổi IP trong file `.env`, hãy chạy:
```bash
docker-compose up -d --build
```
