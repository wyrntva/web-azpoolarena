@echo off
title LiveScore Exe Builder
echo ==============================================
echo   DANG DONG GOI PHAN MEM LIVESCORE (1 FILE EXE)
echo ==============================================
python -m PyInstaller --onefile --noconsole --name "LiveScore" --add-data "assets;assets" --clean -y main.py
if exist "build" (
    rmdir /s /q "build"
)
echo ==============================================
echo   HOAN TAT! File chay duy nhat nam o: dist\LiveScore.exe
echo ==============================================
pause
