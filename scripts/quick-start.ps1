# Quick Start Script - AzPoolArena
# Run this to start development environment

Write-Host "Starting AzPoolArena..." -ForegroundColor Green
Write-Host ""

# Start services
docker-compose up -d

Write-Host ""
Write-Host "Waiting for services to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check status
Write-Host ""
Write-Host "Checking services status..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Ready! Access your application at:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login with: admin / admin123" -ForegroundColor Yellow
Write-Host ""
