@echo off
chcp 65001 >nul
echo ========================================
echo   AZ POOLARENA ATTENDANCE - Build EXE
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "main.py" (
    echo ERROR: main.py not found!
    echo Please run this script from desktop-qr-app folder
    pause
    exit /b 1
)

REM Check if logo exists
if not exist "logo.png" (
    echo ERROR: logo.png not found!
    echo Please ensure logo.png is in the current folder
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo The .exe will need .env file to run properly
    echo.
)

echo [1/3] Installing required packages...
echo.
pip install --upgrade pyinstaller PySide6 qrcode[pil] requests python-dotenv

echo.
echo [2/3] Building executable with PyInstaller...
echo.

REM Clean previous build
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist

REM Build using spec file
pyinstaller AZ_POOLARENA_ATTENDANCE.spec

echo.
echo [3/3] Checking build result...
echo.

if exist "dist\AZ_POOLARENA_ATTENDANCE.exe" (
    echo ========================================
    echo   BUILD SUCCESSFUL! ✓
    echo ========================================
    echo.
    echo Executable location:
    echo   dist\AZ_POOLARENA_ATTENDANCE.exe
    echo.
    echo File size:
    for %%A in ("dist\AZ_POOLARENA_ATTENDANCE.exe") do echo   %%~zA bytes
    echo.
    echo ========================================
    echo   DEPLOYMENT INSTRUCTIONS
    echo ========================================
    echo.
    echo Copy these files to target PC:
    echo   1. dist\AZ_POOLARENA_ATTENDANCE.exe
    echo   2. .env (IMPORTANT - must be in same folder as .exe)
    echo.
    echo Remember to change DEVICE_ID in .env for each PC:
    echo   - PC 1: DEVICE_ID=PC-QR-01
    echo   - PC 2: DEVICE_ID=PC-QR-02
    echo   - PC 3: DEVICE_ID=PC-QR-03
    echo.
) else (
    echo ========================================
    echo   BUILD FAILED! ✗
    echo ========================================
    echo.
    echo Please check the error messages above
    echo.
)

pause
