# 📱 HƯỚNG DẪN CÀI ĐẶT DESKTOP QR APP - WINDOWS

Ứng dụng Desktop tạo mã QR chấm công cho hệ thống AZ POOLARENA.
**Chạy trên máy Windows** (ví dụ: máy tính lễ tân), kết nối với Backend trên máy Ubuntu.

---

## 📋 YÊU CẦU HỆ THỐNG

- **Hệ điều hành**: Windows 10/11
- **Python**: Phiên bản 3.10 trở lên
- **Kết nối mạng**: Cùng mạng LAN với máy chủ Ubuntu

---

## 🚀 BƯỚC 1: CÀI ĐẶT PYTHON

### Kiểm tra Python đã có chưa:
Mở **Command Prompt** (cmd) và gõ:
```cmd
python --version
```

Nếu chưa có Python, tải và cài đặt từ: https://www.python.org/downloads/

**⚠️ QUAN TRỌNG**: Khi cài, nhớ **tick vào ô "Add Python to PATH"**

---

## 🔧 BƯỚC 2: CÀI ĐẶT ỨNG DỤNG

### 2.1. Tải code về máy
Nếu bạn dùng Git:
```cmd
cd Desktop
git clone https://github.com/wyrntva/web-azpoolarena.git
cd web-azpoolarena\desktop-qr-app
```

Hoặc tải file ZIP về và giải nén vào `Desktop\desktop-qr-app`

### 2.2. Cài đặt thư viện Python
Mở **Command Prompt** trong thư mục `desktop-qr-app`:
```cmd
pip install -r requirements.txt
```

Chờ khoảng 1-2 phút để cài xong.

---

## ⚙️ BƯỚC 3: CẤU HÌNH KẾT NỐI

### 3.1. Tạo file .env
Copy file mẫu:
```cmd
copy .env.example .env
```

### 3.2. Chỉnh sửa file .env
Mở file `.env` bằng Notepad và sửa các dòng sau:

```env
# IP của máy Ubuntu (máy chạy Docker Backend)
API_BASE_URL=http://192.168.1.188:8000

# Mật khẩu bảo mật (phải giống với backend)
INTERNAL_API_KEY=azpool_secret_key_2024

# Tên máy tính này
DEVICE_ID=PC-QR-01
DEVICE_NAME=May le tan - Tang 1

# Thời gian QR hết hạn (giây)
DEFAULT_TTL_SECONDS=60

# URL để điện thoại quét QR sẽ mở (IP máy Ubuntu)
FRONTEND_URL=http://192.168.1.188:5173
```

**📌 Lưu ý:**
- Thay `192.168.1.188` bằng **IP thật** của máy Ubuntu (chạy lệnh `hostname -I` trên Ubuntu để lấy IP)
- `INTERNAL_API_KEY` phải **giống hệt** với file `.env` trên máy Ubuntu

---

## ▶️ BƯỚC 4: CHẠY ỨNG DỤNG

Mở **Command Prompt** trong thư mục `desktop-qr-app` và chạy:
```cmd
python main.py
```

Giao diện ứng dụng sẽ hiện ra với nút **"TẠO MÃ QR"**.

---

## 🎯 CÁCH SỬ DỤNG

1. **Bấm "Tạo mã QR"** → Mã QR xuất hiện ngay lập tức
2. **Nhân viên quét QR** bằng điện thoại → Tự động mở trang chấm công
3. **Mã QR tự hủy sau 60 giây** hoặc sau khi dùng 1 lần
4. **Tạo mã mới** khi cần (không giới hạn số lần)

---

## ❓ XỬ LÝ LỖI

### Lỗi "Cannot connect to server"
**Nguyên nhân**: Không kết nối được Backend.
**Giải pháp**:
1. Kiểm tra máy Ubuntu có đang chạy Docker không: `docker-compose ps`
2. Thử ping máy Ubuntu: `ping 192.168.1.188`
3. Kiểm tra Firewall trên máy Ubuntu có chặn port 8000 không

### Lỗi "Invalid API key"
**Nguyên nhân**: `INTERNAL_API_KEY` không khớp.
**Giải pháp**:
1. Mở file `.env` trên máy **Windows** (Desktop App)
2. Mở file `.env` trên máy **Ubuntu** (Backend)
3. So sánh dòng `INTERNAL_API_KEY=...` phải giống hệt nhau

### Lỗi "ModuleNotFoundError"
**Nguyên nhân**: Chưa cài đủ thư viện Python.
**Giải pháp**:
```cmd
pip install --upgrade -r requirements.txt
```

---

## 🔒 BẢO MẬT

- ✅ Mỗi mã QR chỉ dùng **1 lần duy nhất**
- ✅ Mã QR tự hủy sau **60 giây** (có thể điều chỉnh)
- ✅ Yêu cầu **API Key** để tạo mã → Chỉ máy được cấp quyền mới tạo được

---

## 📞 HỖ TRỢ

Nếu cần thêm thiết bị (ví dụ: Máy lễ tân tầng 2), chạy script sau trên máy Ubuntu:
```bash
cd ~/web-azpoolarena/backend
docker-compose exec -T backend python create_qr_device.py
```
Sau đó điền `DEVICE_ID` mới vào file `.env` của máy Windows thứ 2.
