# 📋 Docker Commands Cheat Sheet

## 🚀 Quick Commands

### Start Development
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
docker-compose logs -f backend    # specific service
```

### Stop Everything
```bash
docker-compose down
```

### Rebuild
```bash
docker-compose build
docker-compose up -d
```

---

## 🗄️ Database

### Run Migrations
```bash
docker-compose exec backend alembic upgrade head
```

### Create Migration
```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
```

### Rollback Migration
```bash
docker-compose exec backend alembic downgrade -1
```

### Access Database
```bash
docker-compose exec db psql -U postgres -d azpoolarena
```

### Backup Database
```bash
docker-compose exec db pg_dump -U postgres azpoolarena > backup.sql
```

### Restore Database
```bash
docker-compose exec -T db psql -U postgres azpoolarena < backup.sql
```

---

## 🐍 Backend

### Shell Access
```bash
docker-compose exec backend bash
```

### Run Python Script
```bash
docker-compose exec backend python seed.py
```

### Install New Package
```bash
# Add to requirements.txt, then:
docker-compose build backend
docker-compose up -d backend
```

---

## ⚛️ Frontend

### Shell Access
```bash
docker-compose exec frontend sh
```

### Install New Package
```bash
docker-compose exec frontend npm install package-name
# Or rebuild:
docker-compose build frontend
docker-compose up -d frontend
```

---

## 🔍 Debugging

### Check Container Status
```bash
docker-compose ps
```

### Check Resource Usage
```bash
docker stats
```

### Inspect Container
```bash
docker inspect azpool-backend-dev
```

### View Container Processes
```bash
docker-compose exec backend ps aux
```

---

## 🧹 Cleanup

### Remove Stopped Containers
```bash
docker container prune
```

### Remove Unused Images
```bash
docker image prune -a
```

### Remove Unused Volumes
```bash
docker volume prune
```

### Nuclear Option (⚠️ removes everything)
```bash
docker-compose down -v
docker system prune -a --volumes
```

---

## 🌐 Production Commands

### Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Stop
```bash
docker-compose -f docker-compose.prod.yml down
```

### Backup
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres azpoolarena > backup-$(date +%Y%m%d).sql
```

---

## 🎯 Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# Docker Compose shortcuts
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcl='docker-compose logs -f'
alias dcr='docker-compose restart'
alias dcb='docker-compose build'

# Docker shortcuts
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias dex='docker exec -it'

# AzPoolArena specific
alias azlogs='docker-compose logs -f'
alias azbe='docker-compose exec backend bash'
alias azfe='docker-compose exec frontend sh'
alias azdb='docker-compose exec db psql -U postgres -d azpoolarena'
```

---

## 📖 Environment Variables

### Development (.env)
```bash
POSTGRES_PASSWORD=password
SECRET_KEY=dev-secret-key
VITE_API_URL=http://localhost:8000
```

### Production (.env.prod)
```bash
POSTGRES_PASSWORD=<strong-password>
SECRET_KEY=<random-32-char-key>
VITE_API_URL=https://api.yourdomain.com
DOMAIN=yourdomain.com
```

---

## 🆘 Emergency Procedures

### Backend Won't Start
```bash
docker-compose logs backend
docker-compose restart backend
docker-compose build backend --no-cache
docker-compose up -d backend
```

### Database Connection Failed
```bash
docker-compose logs db
docker-compose restart db
# Wait 10 seconds
docker-compose restart backend
```

### Port Already in Use
```bash
# Find process using port (Linux/Mac)
lsof -i :8000

# Find process using port (Windows)
netstat -ano | findstr :8000

# Change port in .env
BACKEND_PORT=8001
```

### Clean Restart
```bash
docker-compose down
docker-compose up -d
sleep 10
docker-compose exec backend alembic upgrade head
```

---

**Keep this handy! 📌**
