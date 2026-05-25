#!/bin/bash
# ==============================================
# Development Environment Setup Script
# ==============================================

echo "🚀 Setting up AzPoolArena Development Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your settings."
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "📊 Running database migrations..."
docker-compose exec backend npm run migration:run

# Note: In the NestJS version, database initialization can be done via azpoolarena_export.sql.
# Seeding is not implemented in NestJS code yet.
# echo "🌱 Seeding database (optional)..."
# read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#     docker-compose exec backend npm run seed
# fi

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 Services are running at:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:     docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart:       docker-compose restart"
echo ""
