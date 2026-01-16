========================================
  AZ POOLARENA ATTENDANCE
  Phần mềm tạo mã QR chấm công
========================================

HƯỚNG DẪN CÀI ĐẶT:

1. Copy 2 files này vào thư mục trên máy tính:
   - AZ_POOLARENA_ATTENDANCE.exe
   - .env

2. File .env PHẢI nằm cùng thư mục với .exe

3. Chỉnh sửa file .env:
   - Mở file .env bằng Notepad
   - Đổi DEVICE_ID cho mỗi máy tính:
     * Máy 1: DEVICE_ID=PC-QR-01
     * Máy 2: DEVICE_ID=PC-QR-02
     * Máy 3: DEVICE_ID=PC-QR-03
   - Đổi DEVICE_NAME (tùy chọn):
     DEVICE_NAME=Lễ tân - Máy 1

4. Double-click AZ_POOLARENA_ATTENDANCE.exe để chạy

YÊU CẦU HỆ THỐNG:
- Windows 10/11
- Kết nối mạng LAN (cùng WiFi với server)
- Server backend đang chạy tại: http://192.168.1.187:8000

KIỂM TRA KẾT NỐI:
Mở Command Prompt và gõ:
  curl http://192.168.1.187:8000/health

Phải thấy: {"status":"healthy"}

LIÊN HỆ HỖ TRỢ:
- Email: support@azpoolarena.com
- Phone: 0123456789

© 2026 AZ POOLARENA. All rights reserved.
