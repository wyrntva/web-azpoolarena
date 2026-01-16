@echo off
chcp 65001 >nul
echo ========================================
echo   TẠO SHORTCUT TRÊN DESKTOP
echo ========================================
echo.

REM Get current directory
set "CURRENT_DIR=%~dp0"

REM Remove trailing backslash
if "%CURRENT_DIR:~-1%"=="\" set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

REM Create VBScript to create shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\AZ POOLARENA ATTENDANCE.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%CURRENT_DIR%\AZ_POOLARENA_ATTENDANCE.exe" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> CreateShortcut.vbs
echo oLink.Description = "Phần mềm tạo mã QR chấm công" >> CreateShortcut.vbs
echo oLink.IconLocation = "%CURRENT_DIR%\AZ_POOLARENA_ATTENDANCE.exe, 0" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM Execute VBScript
cscript CreateShortcut.vbs //Nologo

REM Clean up VBScript
del CreateShortcut.vbs

echo.
echo ========================================
echo   ✅ THÀNH CÔNG!
echo ========================================
echo.
echo Shortcut đã được tạo trên Desktop:
echo   "AZ POOLARENA ATTENDANCE"
echo.
echo Bây giờ bạn có thể:
echo   1. Double-click icon trên Desktop để mở phần mềm
echo   2. Pin shortcut vào Taskbar (right-click → Pin to taskbar)
echo   3. Pin vào Start Menu
echo.
pause
