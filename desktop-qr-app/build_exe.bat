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
    echo The .exe will need .env file in the same folder to run properly
    echo.
)

REM ========================================
REM Step 1: Create Virtual Environment
REM ========================================
echo [1/4] Setting up Python virtual environment...
echo.

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment!
        echo Make sure Python 3.10+ is installed and added to PATH
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM ========================================
REM Step 2: Install dependencies
REM ========================================
echo [2/4] Installing required packages...
echo.
pip install --upgrade pip
pip install pyinstaller PySide6>=6.6.0 "qrcode[pil]>=7.4.2" requests>=2.31.0 python-dotenv>=1.0.0 Pillow>=10.0.0

if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

REM ========================================
REM Step 3: Build executable
REM ========================================
echo.
echo [3/4] Building executable with PyInstaller...
echo.

REM Clean previous build
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist

REM Build using spec file
pyinstaller AZ_POOLARENA_ATTENDANCE.spec --clean

if errorlevel 1 (
    echo.
    echo ========================================
    echo   BUILD FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above
    pause
    exit /b 1
)

REM ========================================
REM Step 4: Package output
REM ========================================
echo.
echo [4/4] Packaging output...
echo.

if exist "dist\AZ_POOLARENA_ATTENDANCE.exe" (
    REM Create release folder
    if exist "release" rmdir /s /q release
    mkdir release

    REM Copy exe
    copy "dist\AZ_POOLARENA_ATTENDANCE.exe" "release\"

    REM Copy .env.example for reference
    if exist ".env.example" copy ".env.example" "release\.env.example"

    REM Copy .env if exists
    if exist ".env" copy ".env" "release\.env"

    REM Copy logo for reference
    if exist "logo.png" copy "logo.png" "release\"

    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Output folder: release\
    echo.
    echo Files in release folder:
    dir /b release\
    echo.
    echo Executable size:
    for %%A in ("release\AZ_POOLARENA_ATTENDANCE.exe") do echo   %%~zA bytes
    echo.
    echo ========================================
    echo   DEPLOYMENT INSTRUCTIONS
    echo ========================================
    echo.
    echo 1. Copy the 'release' folder to target PC
    echo 2. Edit .env file with correct settings:
    echo    - API_BASE_URL  = Backend server URL
    echo    - INTERNAL_API_KEY = API key
    echo    - DEVICE_ID     = Unique ID for each PC
    echo    - FRONTEND_URL  = Frontend URL
    echo.
    echo 3. Run AZ_POOLARENA_ATTENDANCE.exe
    echo.
    echo Remember to change DEVICE_ID in .env for each PC:
    echo   - PC 1: DEVICE_ID=PC-QR-01
    echo   - PC 2: DEVICE_ID=PC-QR-02
    echo   - PC 3: DEVICE_ID=PC-QR-03
    echo.
) else (
    echo ========================================
    echo   BUILD FAILED!
    echo ========================================
    echo.
    echo Executable not found in dist\ folder
    echo Please check the error messages above
    echo.
)

REM Deactivate virtual environment
call deactivate 2>nul

pause
