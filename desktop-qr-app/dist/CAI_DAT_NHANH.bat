@echo off
chcp 65001 >nul
echo ========================================
echo   AZ POOLARENA ATTENDANCE
echo   CÀI ĐẶT NHANH
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ❌ LỖI: Không tìm thấy file .env
    echo.
    echo Vui lòng đảm bảo file .env nằm cùng thư mục với file này.
    echo.
    pause
    exit /b 1
)

REM Check if exe exists
if not exist "AZ_POOLARENA_ATTENDANCE.exe" (
    echo ❌ LỖI: Không tìm thấy AZ_POOLARENA_ATTENDANCE.exe
    echo.
    pause
    exit /b 1
)

echo ✅ Đã tìm thấy tất cả files cần thiết
echo.

echo ========================================
echo   BƯỚC 1: CẤU HÌNH DEVICE ID
echo ========================================
echo.
echo Mỗi máy tính cần có DEVICE_ID khác nhau!
echo.
echo Ví dụ:
echo   - Máy 1: PC-QR-01
echo   - Máy 2: PC-QR-02
echo   - Máy 3: PC-QR-03
echo.

set /p DEVICE_ID="Nhập DEVICE_ID cho máy này (vd: PC-QR-01): "

if "%DEVICE_ID%"=="" (
    echo.
    echo ❌ Bạn chưa nhập DEVICE_ID!
    echo.
    pause
    exit /b 1
)

echo.
set /p DEVICE_NAME="Nhập tên máy (vd: Lễ tân - Máy 1): "

if "%DEVICE_NAME%"=="" (
    set "DEVICE_NAME=QR Generator - %DEVICE_ID%"
)

echo.
echo ========================================
echo   BƯỚC 2: CẬP NHẬT FILE .ENV
echo ========================================
echo.

REM Backup original .env
if exist ".env.backup" del .env.backup
copy .env .env.backup >nul 2>&1

REM Create new .env file with updated values
echo # Desktop QR Generator Configuration > .env.new
echo. >> .env.new
echo # Backend API Configuration >> .env.new
echo API_BASE_URL=http://192.168.1.187:8000 >> .env.new
echo INTERNAL_API_KEY=azpoolarena-internal-qr-2026 >> .env.new
echo. >> .env.new
echo # Device Configuration (ĐÃ THAY ĐỔI) >> .env.new
echo DEVICE_ID=%DEVICE_ID% >> .env.new
echo DEVICE_NAME=%DEVICE_NAME% >> .env.new
echo. >> .env.new
echo # QR Code Settings >> .env.new
echo DEFAULT_TTL_SECONDS=60 >> .env.new
echo QR_SIZE=10 >> .env.new
echo QR_BORDER=4 >> .env.new
echo. >> .env.new
echo # Frontend URL (for QR code) >> .env.new
echo FRONTEND_URL=http://192.168.1.187:5173 >> .env.new

REM Replace old .env with new one
del .env
rename .env.new .env

echo ✅ Đã cập nhật .env với:
echo   DEVICE_ID=%DEVICE_ID%
echo   DEVICE_NAME=%DEVICE_NAME%
echo.
echo   (File .env cũ đã được backup thành .env.backup)
echo.

echo ========================================
echo   BƯỚC 3: TẠO SHORTCUT DESKTOP
echo ========================================
echo.

REM Get current directory
set "CURRENT_DIR=%~dp0"
if "%CURRENT_DIR:~-1%"=="\" set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

REM Create VBScript
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\AZ POOLARENA ATTENDANCE.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%CURRENT_DIR%\AZ_POOLARENA_ATTENDANCE.exe" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> CreateShortcut.vbs
echo oLink.Description = "Phần mềm tạo mã QR chấm công - %DEVICE_NAME%" >> CreateShortcut.vbs
echo oLink.IconLocation = "%CURRENT_DIR%\AZ_POOLARENA_ATTENDANCE.exe, 0" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

cscript CreateShortcut.vbs //Nologo >nul 2>&1
del CreateShortcut.vbs

if exist "%USERPROFILE%\Desktop\AZ POOLARENA ATTENDANCE.lnk" (
    echo ✅ Đã tạo shortcut trên Desktop
) else (
    echo ⚠️ CẢNH BÁO: Có thể chưa tạo được shortcut
    echo    Bạn có thể tạo thủ công: Click phải .exe -^> Send to -^> Desktop
)
echo.

echo ========================================
echo   BƯỚC 4: KIỂM TRA KẾT NỐI
echo ========================================
echo.

echo Đang kiểm tra kết nối đến server...
curl -s http://192.168.1.187:8000/health > nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Kết nối server thành công!
) else (
    echo ❌ CẢNH BÁO: Không thể kết nối đến server
    echo.
    echo Vui lòng kiểm tra:
    echo   1. Đã kết nối WiFi cùng mạng với server chưa?
    echo   2. Server backend có đang chạy không?
    echo   3. IP 192.168.1.187 có đúng không?
    echo.
    echo   Test thử: curl http://192.168.1.187:8000/health
)

echo.
echo ========================================
echo   ✅ CÀI ĐẶT HOÀN TẤT!
echo ========================================
echo.
echo Bạn có thể:
echo   1. Double-click icon "AZ POOLARENA ATTENDANCE" trên Desktop
echo   2. Hoặc chạy file AZ_POOLARENA_ATTENDANCE.exe
echo.
echo Files đã tạo:
echo   • .env (đã cập nhật với DEVICE_ID mới)
echo   • .env.backup (backup file cũ)
echo   • Shortcut trên Desktop
echo.

set /p OPEN_NOW="Mở phần mềm ngay bây giờ? (Y/N): "

if /i "%OPEN_NOW%"=="Y" (
    echo.
    echo Đang mở phần mềm...
    start "" "%CURRENT_DIR%\AZ_POOLARENA_ATTENDANCE.exe"
    timeout /t 2 >nul
)

echo.
echo Cảm ơn bạn đã sử dụng AZ POOLARENA ATTENDANCE!
echo.
pause
