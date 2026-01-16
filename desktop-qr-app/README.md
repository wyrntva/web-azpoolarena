# Desktop QR Generator App

Desktop application để tạo mã QR one-time cho hệ thống chấm công AZ POOLARENA.

## 🚀 Cài đặt

### 1. Cài đặt Python Dependencies

```bash
cd desktop-qr-app
pip install -r requirements.txt
```

### 2. Cấu hình

Copy file `.env.example` thành `.env`:

```bash
copy .env.example .env
```

Chỉnh sửa `.env`:

```env
# Backend API Configuration
API_BASE_URL=http://localhost:8000
INTERNAL_API_KEY=azpoolarena-internal-qr-2026

# Device Configuration
DEVICE_ID=PC-QR-01
DEVICE_NAME=Reception QR Generator - PC-01

# QR Code Settings
DEFAULT_TTL_SECONDS=60
```

**Quan trọng:** `INTERNAL_API_KEY` phải khớp với giá trị trong backend `.env`

### 3. Chạy ứng dụng

```bash
python main.py
```

## 📱 Tính năng

- ✅ Tạo mã QR one-time với thời hạn tùy chỉnh (30-300 giây)
- ✅ Hiển thị QR code lớn, rõ ràng
- ✅ Countdown timer thời gian còn hiệu lực
- ✅ Thống kê token (total, used, active)
- ✅ Giao diện đơn giản, dễ sử dụng
- ✅ Bảo mật với API key authentication

## 🔐 Bảo mật

- Mỗi QR code chỉ dùng **1 lần**
- QR code có **thời hạn** (default: 60 giây)
- API key bắt buộc để tạo token
- Token được hash và lưu trữ an toàn

## 🛠️ Xử lý lỗi

Nếu gặp lỗi "Cannot connect to server":
1. Kiểm tra backend đang chạy: `http://localhost:8000`
2. Kiểm tra `API_BASE_URL` trong `.env`
3. Kiểm tra firewall/antivirus

Nếu gặp lỗi "Invalid API key":
1. Kiểm tra `INTERNAL_API_KEY` trong desktop `.env`
2. Kiểm tra `INTERNAL_API_KEY` trong backend `.env`
3. Đảm bảo 2 giá trị giống nhau

## 📦 Build thành .exe (Optional)

Sử dụng PyInstaller:

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name "QR-Generator" main.py
```

File `.exe` sẽ nằm trong thư mục `dist/`

## 🔄 Workflow

1. Nhấn "TẠO MÃ QR MỚI"
2. Desktop App gọi API → Nhận token
3. Hiển thị QR code + countdown
4. User quét QR → Mở trang web
5. Web validate token → Cho phép truy cập
6. Token bị đánh dấu "used" → Không thể dùng lại

## 📞 Hỗ trợ

Nếu cần thêm device, chạy script trong backend:

```bash
cd backend
python create_qr_device.py
```
