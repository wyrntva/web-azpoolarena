@echo off
title AZ Pool Arena - Image Display Runner (Windows Dev)
echo ===================================================
echo   AZ Pool Arena - Image Display Runner (Windows Dev)
echo ===================================================
echo.

:: Set local backend URL by default
set API_BASE_URL=http://localhost:8000
echo Setting API_BASE_URL=%API_BASE_URL%

:: Verify Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH!
    echo Please install Python 3.9+ from https://www.python.org/
    pause
    exit /b 1
)

echo.
echo [1/2] Installing requirements...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Failed to install requirements automatically.
    echo Please make sure you have internet access and run: python -m pip install pyside6 requests
)

echo.
echo [2/2] Launching PySide6/QML Application...
echo Press Ctrl+C in this terminal to close the application.
echo.
python main.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application crashed or failed to start with code %errorlevel%.
    echo Please check if PySide6 and requirements are fully installed.
)
pause
