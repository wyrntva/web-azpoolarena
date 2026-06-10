# run.ps1 - Chay AZ Scoreboard tren Windows dev
# Su dung: .\run.ps1

$AppDir = $PSScriptRoot
$VenvPython = Join-Path $AppDir "venv\Scripts\python.exe"
$AppScript = Join-Path $AppDir "app.py"
$LogFile = Join-Path $AppDir "app.log"

# Kiem tra venv
if (-not (Test-Path $VenvPython)) {
    Write-Host "=== Chua co venv. Dang tao... ===" -ForegroundColor Yellow
    python -m venv "$AppDir\venv"
    & "$AppDir\venv\Scripts\pip.exe" install -r "$AppDir\requirements.txt"
}

# Bien moi truong
$env:PYTHONUTF8    = "1"
$env:PYTHONUNBUFFERED = "1"
$env:QT_QPA_PLATFORM  = "windows"
$env:QT_LOGGING_RULES = "qt.multimedia.ffmpeg.debug=false;qt.multimedia.ffmpeg.info=false;qt.multimedia.ffmpeg.warning=false"

Write-Host "=== Khoi chay AZ Scoreboard ===" -ForegroundColor Cyan
Write-Host "Python : $VenvPython"
Write-Host "App    : $AppScript"
Write-Host "Log    : $LogFile"
Write-Host ""

Set-Location $AppDir
& $VenvPython -X utf8 $AppScript @args 2>&1 | Tee-Object -FilePath $LogFile
