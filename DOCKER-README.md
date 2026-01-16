# 🐳 AzPoolArena - Docker Production-Ready Setup

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

Hệ thống quản lý tài chính AzPoolArena với Docker setup production-ready, dễ dùng cho developers và deploy lên VPS.

---

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt Development](#-cài-đặt-development)
- [Deploy Production](#-deploy-production)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Các Lệnh Thường Dùng](#-các-lệnh-thường-dùng)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Tính Năng

### Docker Infrastructure
- ✅ **Multi-stage builds** - Optimize image size
- ✅ **Hot reload** - Development với live code updates
- ✅ **Health checks** - Tự động kiểm tra services
- ✅ **Non-root user** - Security best practices
- ✅ **Volume persistence** - Data không bị mất khi restart

### Development Features
- 🔄 Automatic code reload (backend & frontend)
- 🗄️ PostgreSQL với persistent storage
- 📊 Database migrations tự động
- 🌱 Seed data cho testing
- 📝 API documentation tại `/docs`

### Production Features
- 🔒 SSL/HTTPS support với Let's Encrypt
- 🌐 Nginx reverse proxy
- 🚀 Optimized builds
- 💾 Automatic database backups
- 🔐 Environment-based configuration
- 📈 Rate limiting & security headers

---

## 🔧 Yêu Cầu Hệ Thống

### Development
- Docker Desktop 20.10+ (Windows/Mac) hoặc Docker Engine (Linux)
- Docker Compose 2.0+
- Git
- 4GB RAM minimum (8GB recommended)

### Production (VPS)
- Ubuntu 20.04+ hoặc Debian 11+
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)
- Domain name với DNS đã cấu hình
- Ports: 80, 443 mở

---

## 🚀 Cài Đặt Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd web-azpoolarena-docker
```

### 2. Setup Environment

**Windows (PowerShell):**
```powershell
.\scripts\dev-setup.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

### 3. Manual Setup (nếu script không chạy được)

```bash
# Copy environment file
cp .env.example .env

# Edit .env với settings của bạn (nếu cần)
# nano .env

# Build và start services
docker-compose build
docker-compose up -d

# Chờ database khởi động
sleep 10

# Run migrations
docker-compose exec backend alembic upgrade head

# (Optional) Seed database
docker-compose exec backend python seed.py
```

### 4. Truy Cập Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

---

## 🌐 Deploy Production

### Chuẩn Bị VPS

#### 1. Cài Đặt Docker trên VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

#### 2. Clone Project

```bash
git clone <repository-url>
cd web-azpoolarena-docker
```

#### 3. Setup Environment

```bash
# Copy production environment template
cp .env.prod.example .env.prod

# Edit với production values
nano .env.prod
```

**Quan trọng**: Thay đổi các giá trị sau trong `.env.prod`:

```env
# Database
POSTGRES_PASSWORD=<strong-random-password>

# Backend
SECRET_KEY=<random-32-char-secret-key>

# Domains
DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SSL
SSL_EMAIL=your-email@example.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

#### 4. Cấu Hình DNS

Trỏ domain của bạn về VPS:

```
A     yourdomain.com        -> <VPS-IP>
A     www.yourdomain.com    -> <VPS-IP>
A     api.yourdomain.com    -> <VPS-IP>
```

#### 5. Setup SSL Certificates

```bash
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh
```

#### 6. Deploy Application

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

#### 7. Setup Auto-Renewal cho SSL (Optional)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3am)
0 3 * * * certbot renew --quiet && cd /path/to/project && docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 📁 Cấu Trúc Dự Án

```
web-azpoolarena-docker/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Core configurations
│   │   ├── db/                # Database setup
│   │   ├── models/            # SQLAlchemy models
│   │   └── main.py            # FastAPI app
│   ├── alembic/               # Database migrations
│   ├── Dockerfile             # Multi-stage Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
│
├── frontend/                   # React Frontend
│   ├── src/
│   ├── Dockerfile             # Multi-stage Dockerfile
│   ├── nginx.conf             # Nginx config for production
│   ├── .dockerignore
│   └── package.json
│
├── nginx/                      # Nginx Reverse Proxy
│   ├── nginx.conf             # Main config
│   ├── conf.d/
│   │   └── default.conf       # Server blocks
│   └── ssl/                   # SSL certificates
│
├── scripts/                    # Automation scripts
│   ├── dev-setup.sh           # Development setup (Linux/Mac)
│   ├── dev-setup.ps1          # Development setup (Windows)
│   ├── deploy.sh              # Production deployment
│   └── ssl-setup.sh           # SSL certificate setup
│
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── .env.example               # Development env template
├── .env.prod.example          # Production env template
└── README.md                  # This file
```

---

## 💻 Các Lệnh Thường Dùng

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose build
docker-compose up -d

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec backend python seed.py
docker-compose exec db psql -U postgres -d azpoolarena

# Database operations
docker-compose exec backend alembic upgrade head    # Run migrations
docker-compose exec backend alembic downgrade -1    # Rollback migration
docker-compose exec backend alembic revision --autogenerate -m "message"  # Create migration

# Clean up everything (⚠️ deletes data)
docker-compose down -v
```

### Production

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Database backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres azpoolarena > backup.sql

# Database restore
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres azpoolarena < backup.sql

# View container stats
docker stats

# Check container health
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔍 Troubleshooting

### Containers không start được

```bash
# Check logs
docker-compose logs

# Check container status
docker-compose ps

# Recreate containers
docker-compose down
docker-compose up -d
```

### Database connection error

```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test database connection
docker-compose exec backend python -c "from app.db.session import engine; print(engine.connect())"
```

### Frontend không kết nối được Backend

```bash
# Check VITE_API_URL in frontend/.env
cat frontend/.env

# Check if backend is accessible
curl http://localhost:8000/health

# Check browser console for CORS errors
# Ensure CORS_ORIGINS includes your frontend URL
```

### Port already in use

```bash
# Find process using port
# Windows:
netstat -ano | findstr :8000
# Linux/Mac:
lsof -i :8000

# Kill process or change port in .env
```

### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Renew certificates
certbot renew

# Test SSL configuration
curl -vI https://yourdomain.com
```

### Permission Denied Errors

```bash
# Linux/Mac: Make scripts executable
chmod +x scripts/*.sh

# Fix file ownership (if needed)
sudo chown -R $USER:$USER .
```

---

## 🔐 Security Best Practices

### Development
- ✅ Use strong passwords even in development
- ✅ Never commit `.env` files
- ✅ Regularly update dependencies

### Production
- ✅ Use strong, unique passwords for database
- ✅ Change default SECRET_KEY
- ✅ Enable firewall (ufw on Ubuntu)
- ✅ Use SSL/HTTPS always
- ✅ Regular backups
- ✅ Monitor logs for suspicious activity
- ✅ Keep Docker and system updated

```bash
# Setup firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📚 Thêm Tài Nguyên

- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🤝 Contributing

Để contribute vào project:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Support

Nếu gặp vấn đề, hãy:
1. Check [Troubleshooting](#-troubleshooting) section
2. Search existing issues on GitHub
3. Create new issue với detailed description

---

**Made with ❤️ by AzPoolArena Team**
