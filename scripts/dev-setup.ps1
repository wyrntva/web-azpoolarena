# ==============================================
# Development Environment Setup Script (Windows)
# ==============================================

Write-Host "Setting up AzPoolArena Development Environment..." -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ".env file created. Please update it with your settings." -ForegroundColor Green
}

# Build and start services
Write-Host "Building Docker images..." -ForegroundColor Cyan
docker-compose build

Write-Host "Starting services..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Running database migrations..." -ForegroundColor Cyan
docker-compose exec backend alembic upgrade head

Write-Host ""
$seed = Read-Host "Do you want to seed the database with sample data? (y/n)"
if ($seed -eq "y") {
    docker-compose exec backend python seed.py
}

Write-Host ""
Write-Host "Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Services are running at:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:5173"
Write-Host "   - Backend:  http://localhost:8000"
Write-Host "   - API Docs: http://localhost:8000/docs"
Write-Host "   - Database: localhost:5432"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   - View logs:     docker-compose logs -f"
Write-Host "   - Stop services: docker-compose down"
Write-Host "   - Restart:       docker-compose restart"
Write-Host ""
