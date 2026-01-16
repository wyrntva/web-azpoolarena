# Backup Database Script
# Chạy script này để backup database

$BackupDir = "backups"
$Date = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFile = "$BackupDir/backup-$Date.sql"

# Tạo thư mục backup nếu chưa có
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir
}

Write-Host "Creating backup: $BackupFile"

# Backup database
docker-compose exec -T db pg_dump -U postgres azpoolarena > $BackupFile

if ($?) {
    $Size = (Get-Item $BackupFile).Length / 1KB
    Write-Host "Backup completed successfully! Size: $([math]::Round($Size, 2)) KB" -ForegroundColor Green
    Write-Host "Backup file: $BackupFile" -ForegroundColor Cyan
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
}

# Xóa backup cũ hơn 30 ngày
Write-Host "Cleaning old backups (older than 30 days)..."
Get-ChildItem $BackupDir -Filter "backup-*.sql" | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-30)
} | Remove-Item -Force
