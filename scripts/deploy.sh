#!/bin/bash
# ==============================================
# Production Deployment Script for VPS
# ==============================================

set -e

echo "🚀 Deploying AzPoolArena to Production..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "📝 Please create .env.prod from .env.prod.example and fill in production values."
    exit 1
fi

# Load production environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Backup database (if exists)
if [ "$(docker ps -q -f name=azpool-db-prod)" ]; then
    echo "💾 Creating database backup..."
    mkdir -p backups
    BACKUP_FILE="backups/db-backup-$(date +%Y%m%d-%H%M%S).sql"
    docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE
    echo "✅ Database backed up to $BACKUP_FILE"
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build images
echo "🏗️  Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop old containers
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 15

# Run migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Health check
echo "🏥 Performing health checks..."
sleep 5

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "⚠️  Warning: Frontend health check failed"
fi

if docker-compose -f docker-compose.prod.yml exec -T backend curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Warning: Backend health check failed"
fi

# Show running containers
echo ""
echo "📦 Running containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📍 Application is running at:"
echo "   - Frontend: https://$DOMAIN"
echo "   - API:      https://$API_DOMAIN"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:  docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Stop:       docker-compose -f docker-compose.prod.yml down"
echo "   - Restart:    docker-compose -f docker-compose.prod.yml restart"
echo ""
