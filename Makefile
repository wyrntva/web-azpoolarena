# ==============================================
# Makefile for AzPoolArena Docker Operations
# ==============================================

.PHONY: help dev-setup dev-up dev-down dev-logs dev-build prod-build prod-deploy prod-up prod-down prod-logs prod-shell backup clean

# Default target
help:
	@echo "AzPoolArena Docker Commands"
	@echo "==========================="
	@echo ""
	@echo "Development:"
	@echo "  make dev-setup    - Initial development setup"
	@echo "  make dev-up       - Start development environment"
	@echo "  make dev-down     - Stop development environment"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-build    - Rebuild development images"
	@echo "  make dev-restart  - Restart development services"
	@echo "  make dev-shell-be - Shell into backend container"
	@echo "  make dev-shell-fe - Shell into frontend container"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed database with sample data"
	@echo "  make db-shell     - Open database shell"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build   - Build unified image (frontend + backend)"
	@echo "  make prod-deploy  - Build + deploy to production"
	@echo "  make prod-up      - Start production environment (image must exist)"
	@echo "  make prod-down    - Stop production environment"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-shell   - Shell into production backend container"
	@echo "  make backup       - Backup production database"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Remove all containers and volumes (⚠️ deletes data)"
	@echo ""

# ====================
# Development Commands
# ====================

dev-setup:
	@echo "🚀 Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "✅ Created .env file"; fi
	@docker-compose build
	@docker-compose up -d
	@echo "⏳ Waiting for services to start..."
	@sleep 10
	@docker-compose exec backend npm run migration:run
	@echo ""
	@echo "✅ Development environment ready!"
	@echo "📍 Frontend: http://localhost:5173"
	@echo "📍 Backend:  http://localhost:8000"
	@echo "📍 API Docs: http://localhost:8000/docs"

dev-up:
	@echo "🚀 Starting development environment..."
	@docker-compose up -d
	@echo "✅ Services started!"

dev-down:
	@echo "🛑 Stopping development environment..."
	@docker-compose down
	@echo "✅ Services stopped!"

dev-logs:
	@docker-compose logs -f

dev-build:
	@echo "🏗️  Rebuilding development images..."
	@docker-compose build
	@echo "✅ Build complete!"

dev-restart:
	@echo "🔄 Restarting development services..."
	@docker-compose restart
	@echo "✅ Services restarted!"

dev-shell-be:
	@docker-compose exec backend bash

dev-shell-fe:
	@docker-compose exec frontend sh

# ====================
# Database Commands
# ====================

db-migrate:
	@echo "📊 Running database migrations..."
	@docker-compose exec backend npm run migration:run
	@echo "✅ Migrations complete!"

db-seed:
	@echo "🌱 Seeding database..."
	@docker-compose exec backend npm run seed
	@echo "✅ Database seeded!"

db-shell:
	@docker-compose exec db psql -U postgres -d azpoolarena

# ====================
# Production Commands
# ====================

prod-build:
	@echo "🏗️  Building unified production image (frontend + backend)..."
	@docker-compose -f docker-compose.prod.yml build backend
	@echo "✅ Build complete!"

prod-deploy:
	@echo "🚀 Deploying to production..."
	@if [ ! -f .env.prod ]; then echo "❌ Error: .env.prod not found!"; exit 1; fi
	@docker-compose -f docker-compose.prod.yml build backend
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "⏳ Waiting for services..."
	@sleep 8
	@docker-compose -f docker-compose.prod.yml exec backend node dist/main --migration:run 2>/dev/null || \
		docker-compose -f docker-compose.prod.yml exec -T backend sh -c "cd /app && node -e \"require('./dist/data-source').AppDataSource.initialize().then(ds => ds.runMigrations()).then(() => process.exit(0))\"" 2>/dev/null || true
	@echo "✅ Production deployed!"
	@echo "📍 CMS:  https://$${DOMAIN}"
	@echo "📍 API:  https://$${API_DOMAIN}"

prod-up:
	@echo "🚀 Starting production environment..."
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production services started!"

prod-down:
	@echo "🛑 Stopping production environment..."
	@docker-compose -f docker-compose.prod.yml down
	@echo "✅ Production services stopped!"

prod-logs:
	@docker-compose -f docker-compose.prod.yml logs -f

prod-shell:
	@docker-compose -f docker-compose.prod.yml exec backend sh

backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	@docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres azpoolarena > backups/backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "✅ Backup created in backups/"

# ====================
# Cleanup Commands
# ====================

clean:
	@echo "⚠️  This will remove all containers and volumes!"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker-compose -f docker-compose.prod.yml down -v; \
		echo "✅ Cleanup complete!"; \
	fi
