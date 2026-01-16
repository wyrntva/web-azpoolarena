# 🎯 HƯỚNG DẪN SỬ DỤNG DESKTOP QR APP

## 📦 CÁCH CÀI ĐẶT NHANH NHẤT

### **Bước 1: Mở thư mục `dist`**
Tất cả file cần thiết đã có sẵn trong thư mục này.

### **Bước 2: Chạy file `CAI_DAT_NHANH.bat`**
- Double-click file `CAI_DAT_NHANH.bat`
- Làm theo hướng dẫn trên màn hình
- Script sẽ tự động:
  - Cấu hình DEVICE_ID cho máy
  - Kiểm tra kết nối server
  - Tạo shortcut trên Desktop

### **Bước 3: Sử dụng**
- Double-click icon **"AZ POOLARENA ATTENDANCE"** trên Desktop
- Bấm nút **"Tạo mã QR"**
- Nhân viên quét QR bằng điện thoại → Tự động mở trang chấm công

---

## ⚙️ CẤU HÌNH IP MÁY CHỦ (Nếu cần)

Nếu IP máy chủ Ubuntu thay đổi, mở file `dist/.env` và sửa:

```env
# Thay 192.168.1.188 bằng IP máy Ubuntu thật
API_BASE_URL=http://192.168.1.188:8000
FRONTEND_URL=http://192.168.1.188:5173
```

**Cách lấy IP máy Ubuntu:**
```bash
hostname -I
```

---

## 🔧 CHO DEVELOPER (Nếu muốn chỉnh sửa code)

### Cài đặt môi trường dev:
```cmd
cd desktop-qr-app
pip install -r requirements.txt
copy .env.example .env
notepad .env
```

Sửa `.env` cho đúng IP, sau đó:
```cmd
python main.py
```

### Build lại file .exe:
```cmd
pip install pyinstaller
pyinstaller --onefile --windowed --icon=logo.png --name "AZ_POOLARENA_ATTENDANCE" main.py
```

File .exe mới sẽ nằm trong `dist/`

---

## 📂 CẤU TRÚC THƯ MỤC

```
desktop-qr-app/
├── dist/                          ← THƯMỤC QUAN TRỌNG NHẤT
│   ├── .env                       ← Cấu hình đã sẵn sàng
│   ├── AZ_POOLARENA_ATTENDANCE.exe ← Phần mềm chính
│   ├── CAI_DAT_NHANH.bat          ← Script cài đặt tự động
│   └── (các file hướng dẫn khác)
│
├── api_client.py                  ← Code kết nối Backend
├── config.py                      ← Code đọc .env
├── main.py                        ← Code giao diện
├── requirements.txt               ← Danh sách thư viện Python
├── .env.example                   ← File mẫu cấu hình
└── README.md                      ← Hướng dẫn chi tiết
```

---

## ❓ XỬ LÝ LỖI

### "Cannot connect to server"
1. Kiểm tra máy Windows và Ubuntu có cùng mạng WiFi không
2. Ping thử: `ping 192.168.1.188`
3. Kiểm tra Backend: `curl http://192.168.1.188:8000/health`

### "Invalid API key"
File `.env` của Desktop phải có `INTERNAL_API_KEY` giống hệt Backend.

---

## 📌 LƯU Ý

- **Mỗi máy phải có DEVICE_ID khác nhau** (máy 1: PC-QR-01, máy 2: PC-QR-02...)
- Mã QR chỉ dùng **1 lần** và **tự hủy sau 60 giây**
- Không cần cài Python nếu dùng file `.exe` trong `dist/`
