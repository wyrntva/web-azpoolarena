# Restore Database Script
# Sử dụng: .\restore-db.ps1 path\to\backup.sql

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "WARNING: This will REPLACE all current data!" -ForegroundColor Yellow
Write-Host "Backup file: $BackupFile" -ForegroundColor Cyan
$confirm = Read-Host "Are you sure you want to restore? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "Restoring database from: $BackupFile" -ForegroundColor Cyan

# Restore
Get-Content $BackupFile | docker-compose exec -T db psql -U postgres azpoolarena

if ($?) {
    Write-Host "Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host "Restore failed!" -ForegroundColor Red
    exit 1
}
