@echo off
title OBS Scoreboard Runner
echo Dang kiem tra cai dat Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python chua duoc cai dat hoac chua duoc them vao bien moi truong PATH!
    echo Vui long tai va cai dat Python tai https://www.python.org/
    pause
    exit /b 1
)

echo Dang kiem tra thu vien PyQt6...
python -c "import PyQt6" >nul 2>&1
if %errorlevel% neq 0 (
    echo Khong tim thay PyQt6. Dang tien hanh cai dat PyQt6...
    pip install PyQt6
)

echo Dang khoi chay ung dung Live Scoreboard...
start "" pythonw main.py
