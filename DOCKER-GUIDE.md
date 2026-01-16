# 🐳 Hướng Dẫn Docker - AzPoolArena

> **Hướng dẫn đầy đủ để sử dụng Docker cho development và deploy production**

---

## 📚 Mục Lục

- [Bắt Đầu Nhanh 5 Phút](#-bắt-đầu-nhanh-5-phút)
- [Chi Tiết Các Lệnh](#-chi-tiết-các-lệnh)
- [Làm Việc Hàng Ngày](#-làm-việc-hàng-ngày)
- [Troubleshooting](#-troubleshooting)
- [Deploy Production](#-deploy-production)

---

## ⚡ Bắt Đầu Nhanh 5 Phút

### Cài Đặt (Lần Đầu)

**Windows:**
```powershell
# Bước 1: Khởi động Docker Desktop

# Bước 2: Start services
docker-compose up -d

# Bước 3: Đợi database khởi động (15 giây)
Start-Sleep -Seconds 15

# Bước 4: Chạy migrations
docker-compose exec backend alembic upgrade head

# Bước 5: Tạo dữ liệu mẫu
docker-compose exec backend python seed.py
```

**Hoặc dùng script tự động (Windows):**
```powershell
.\scripts\dev-setup.ps1
```

### Truy Cập Ứng Dụng

- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:8000
- 📖 **API Docs**: http://localhost:8000/docs
- 🗄️ **Database**: localhost:5432

**Đăng nhập:**
- Username: `admin`
- Password: `admin123`

### Dừng Services

```powershell
docker-compose down
```

---

## 📋 Chi Tiết Các Lệnh

### Khởi Động & Dừng

```powershell
# Start tất cả services
docker-compose up -d

# Stop tất cả services
docker-compose down

# Restart services
docker-compose restart

# Restart 1 service cụ thể
docker-compose restart backend
docker-compose restart frontend
```

### Xem Logs

```powershell
# Xem logs tất cả services
docker-compose logs -f

# Xem logs 1 service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Xem 100 dòng cuối
docker-compose logs --tail=100 backend
```

### Kiểm Tra Trạng Thái

```powershell
# Xem services đang chạy
docker-compose ps

# Xem tài nguyên đang dùng
docker stats
```

### Rebuild Sau Khi Thay Đổi Code

```powershell
# Rebuild backend (nếu đổi requirements.txt)
docker-compose build backend
docker-compose up -d backend

# Rebuild frontend (nếu đổi package.json)
docker-compose build frontend
docker-compose up -d frontend

# Rebuild tất cả
docker-compose build
docker-compose up -d
```

---

## 💼 Làm Việc Hàng Ngày

### 1. Bắt Đầu Ngày Làm Việc

```powershell
# Mở Docker Desktop

# Start services
docker-compose up -d

# Kiểm tra trạng thái
docker-compose ps
```

✅ **Lưu ý**: Code của bạn tự động reload, không cần restart!

### 2. Làm Việc Với Database

**Truy cập database:**
```powershell
docker-compose exec db psql -U postgres -d azpoolarena
```

**Các lệnh SQL hữu ích:**
```sql
\dt                    -- Liệt kê tables
\d users              -- Xem cấu trúc table
SELECT * FROM users;  -- Query data
\q                    -- Thoát
```

**Database migrations:**
```powershell
# Tạo migration mới
docker-compose exec backend alembic revision --autogenerate -m "add new field"

# Chạy migrations
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1

# Xem lịch sử migrations
docker-compose exec backend alembic history
```

**Reset database (⚠️ Xóa hết data!):**
```powershell
docker-compose down -v
docker-compose up -d
Start-Sleep -Seconds 15
docker-compose exec backend alembic upgrade head
docker-compose exec backend python seed.py
```

**💾 BACKUP & RESTORE DATABASE**

⚠️ **QUAN TRỌNG**: Chạy `seed.py` sẽ **XÓA HẾT** data cũ! Hãy backup trước!

**Backup thủ công:**
```powershell
# Tạo thư mục backup
New-Item -ItemType Directory -Force -Path backups

# Backup database
docker-compose exec db pg_dump -U postgres azpoolarena > backups/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql
```

**Backup tự động (dùng script):**
```powershell
.\scripts\backup-db.ps1
```

**Restore từ backup:**
```powershell
# Cách 1: Dùng script
.\scripts\restore-db.ps1 backups/backup-20260116-201500.sql

# Cách 2: Thủ công
Get-Content backups/backup-20260116-201500.sql | docker-compose exec -T db psql -U postgres azpoolarena
```

**Xem backups hiện có:**
```powershell
Get-ChildItem backups | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
```

**Lưu ý về Data Loss:**
- ✅ `docker-compose down` - GIỮ data
- ✅ `docker-compose restart` - GIỮ data  
- ⚠️ `docker-compose down -v` - **MẤT** data (xóa volumes)
- ⚠️ `seed.py` - **MẤT** data (drop tables)

### 3. Backend Development

**Chạy Python scripts:**
```powershell
docker-compose exec backend python script.py
```

**Truy cập shell:**
```powershell
docker-compose exec backend bash
```

**Install package mới:**
```powershell
# 1. Thêm vào backend/requirements.txt
# 2. Rebuild
docker-compose build backend
docker-compose up -d backend
```

### 4. Frontend Development

**Install npm package:**
```powershell
# Cách 1: Install trong container
docker-compose exec frontend npm install package-name

# Cách 2: Rebuild
cd frontend
npm install package-name
cd ..
docker-compose build frontend
docker-compose up -d frontend
```

**Build production (test):**
```powershell
docker-compose exec frontend npm run build
```

### 5. Kết Thúc Ngày

```powershell
# Option 1: Dừng hẳn
docker-compose down

# Option 2: Để chạy (dùng ít tài nguyên khi idle)
# Không làm gì cả
```

---

## 🔧 Troubleshooting

### 1. Backend Không Khởi Động

**Kiểm tra:**
```powershell
# Xem logs
docker-compose logs backend

# Restart
docker-compose restart backend

# Rebuild nếu cần
docker-compose build backend
docker-compose up -d backend
```

**Lỗi thường gặp:**
- Database chưa sẵn sàng → Đợi 10-15 giây rồi restart backend
- Port bị chiếm → Đổi port trong `.env`
- Lỗi Python → Check `requirements.txt` và rebuild

### 2. Frontend Không Load

**Kiểm tra:**
```powershell
# Xem logs
docker-compose logs frontend

# Xóa cache browser (Ctrl+Shift+R)

# Kiểm tra API URL
cat frontend/.env
# Phải là: VITE_API_URL=http://localhost:8000

# Restart
docker-compose restart frontend
```

### 3. Database Connection Error

```powershell
# Kiểm tra database chạy chưa
docker-compose ps db

# Xem logs
docker-compose logs db

# Restart database
docker-compose restart db
Start-Sleep -Seconds 5
docker-compose restart backend
```

### 4. CORS Error Trong Browser

```powershell
# Kiểm tra CORS settings
cat .env | Select-String CORS_ORIGINS

# Phải có: CORS_ORIGINS=http://localhost:5173,...

# Restart backend
docker-compose restart backend
```

### 5. Port Đã Được Sử dụng

**Cách 1: Tìm và tắt process đang dùng port**
```powershell
# Tìm process
netstat -ano | findstr :8000

# Kill process (thay PID)
taskkill /PID <PID> /F
```

**Cách 2: Đổi port**
```powershell
# Edit .env
BACKEND_PORT=8001
FRONTEND_PORT=5174

# Restart
docker-compose down
docker-compose up -d
```

### 6. Image Build Lỗi

```powershell
# Build lại từ đầu (no cache)
docker-compose build --no-cache

# Xóa images cũ
docker image prune -a

# Build lại
docker-compose build
docker-compose up -d
```

### 7. Docker Desktop Không Chạy

- Mở Docker Desktop
- Đợi icon màu xanh
- Thử lại

### 8. Container Restart Liên Tục

```powershell
# Xem logs để tìm lỗi
docker-compose logs backend

# Thường do:
# - Database chưa sẵn sàng
# - Config sai trong .env
# - Lỗi code Python/JavaScript
```

---

## 🌐 Deploy Production

### Yêu Cầu VPS

- Ubuntu 20.04+ hoặc Debian 11+
- 2GB RAM (khuyến nghị 4GB)
- 20GB disk
- Domain đã trỏ DNS về VPS

### Bước 1: Cài Docker Trên VPS

```bash
# SSH vào VPS
ssh user@your-vps-ip

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

# Verify
docker --version
docker compose version
```

### Bước 2: Setup Project

```bash
# Clone project
git clone <your-repo-url>
cd web-azpoolarena-docker

# Tạo environment file
cp .env.prod.example .env.prod
nano .env.prod
```

**Sửa các giá trị trong `.env.prod`:**
```env
# Database - ĐỔI PASSWORD!
POSTGRES_PASSWORD=your-strong-password-here

# Backend - ĐỔI SECRET_KEY!
SECRET_KEY=your-random-32-char-secret-key

# Domains
DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com

# SSL
SSL_EMAIL=your-email@example.com
```

### Bước 3: Cấu Hình DNS

Trỏ domain về VPS của bạn:
```
A     yourdomain.com        -> <VPS-IP>
A     www.yourdomain.com    -> <VPS-IP>
A     api.yourdomain.com    -> <VPS-IP>
```

### Bước 4: Setup SSL

```bash
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh
```

### Bước 5: Deploy

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Bước 6: Auto-Renewal SSL

```bash
# Edit crontab
crontab -e

# Thêm dòng này (chạy hàng ngày lúc 3am)
0 3 * * * certbot renew --quiet && cd /path/to/project && docker-compose -f docker-compose.prod.yml restart nginx
```

### Bước 7: Backup Database

```bash
# Edit crontab
crontab -e

# Backup hàng ngày lúc 2am
0 2 * * * cd /path/to/project && docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres azpoolarena > backups/backup-$(date +\%Y\%m\%d).sql

# Xóa backup cũ hơn 30 ngày
0 4 * * * find /path/to/project/backups -name "backup-*.sql" -mtime +30 -delete
```

### Production Commands

```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Status
docker-compose -f docker-compose.prod.yml ps

# Backup manual
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres azpoolarena > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres azpoolarena < backup.sql
```

---

## 📄 Files Quan Trọng

### Configuration Files

```
.env                        - Development config
.env.prod                   - Production config (TẠO THỦ CÔNG)
docker-compose.yml          - Development environment
docker-compose.prod.yml     - Production environment
```

### Docker Files

```
backend/Dockerfile          - Backend image build
frontend/Dockerfile         - Frontend image build
nginx/nginx.conf           - Nginx main config
nginx/conf.d/default.conf  - SSL & reverse proxy
```

### Scripts

```
scripts/dev-setup.ps1      - Windows setup
scripts/dev-setup.sh       - Linux/Mac setup
scripts/deploy.sh          - Production deploy
scripts/ssl-setup.sh       - SSL certificates
```

---

## 🎯 Tips & Tricks

### 1. Code Changes Tự Động Reload

✅ Backend và Frontend đều có hot reload  
✅ Không cần restart container khi sửa code  
✅ Chỉ cần save file là code tự update

### 2. Giữ Data Khi Restart

✅ Database data được lưu trong Docker volume  
✅ Data không mất khi `docker-compose down`  
⚠️ Chỉ mất khi dùng `docker-compose down -v` (flag `-v`)

### 3. Dọn Dẹp Disk Space

```powershell
# Xóa containers đã stop
docker container prune

# Xóa images không dùng
docker image prune -a

# Xóa volumes không dùng (⚠️ CẨN THẬN!)
docker volume prune

# Xóa tất cả (⚠️ RẤT NGUY HIỂM!)
docker system prune -a --volumes
```

### 4. Working With Team

```powershell
# Pull code mới từ Git
git pull

# Rebuild nếu có thay đổi Dockerfile
docker-compose build

# Restart
docker-compose up -d

# Run migrations mới (nếu có)
docker-compose exec backend alembic upgrade head
```

### 5. Environment Variables

**Development (.env):**
- Đã có sẵn, dùng được luôn
- Password đơn giản OK
- Local URLs

**Production (.env.prod):**
- Phải tạo thủ công từ `.env.prod.example`
- Password PHẢI mạnh
- Real domain URLs
- KHÔNG commit vào Git

---

## ⚙️ Cấu Trúc Docker

### Development Setup

```
┌─────────────────────────────────┐
│   Your Computer (Windows)       │
├─────────────────────────────────┤
│  Docker Desktop                 │
│  ├─ Frontend Container          │ :5173 (Hot Reload ✅)
│  ├─ Backend Container           │ :8000 (Hot Reload ✅)
│  └─ PostgreSQL Container        │ :5432 (Data Persist ✅)
│                                 │
│  Source Code: Mounted Volumes   │
└─────────────────────────────────┘
```

### Production Setup

```
┌─────────────────────────────────┐
│         Internet Users          │
└──────────────┬──────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────┐
│  Nginx Reverse Proxy (SSL)      │ :443
├─────────────────────────────────┤
│  ├─ Frontend (Static Build)     │
│  ├─ Backend (4 Workers)         │
│  └─ PostgreSQL (Internal)       │
│                                 │
│  Source Code: Built into image  │
└─────────────────────────────────┘
```

---

## 📞 Tài Liệu Khác

- **README.md** - Tổng quan project
- **DOCKER-CHEATSHEET.md** - Các lệnh hay dùng (tiếng Anh)
- **DEPLOYMENT-CHECKLIST.md** - Checklist deploy production
- **DOCKER-README.md** - Hướng dẫn chi tiết (tiếng Anh)

---

## ✅ Checklist Nhanh

### Lần Đầu Setup (Development)
- [ ] Cài Docker Desktop
- [ ] Clone project
- [ ] Chạy `docker-compose up -d`
- [ ] Đợi 15 giây
- [ ] Chạy migrations: `docker-compose exec backend alembic upgrade head`
- [ ] Seed data: `docker-compose exec backend python seed.py`
- [ ] Truy cập http://localhost:5173
- [ ] Login với admin/admin123

### Deploy Production (Lần Đầu)
- [ ] Mua VPS (Ubuntu 20.04+)
- [ ] Mua domain
- [ ] Trỏ DNS về VPS
- [ ] SSH vào VPS
- [ ] Cài Docker
- [ ] Clone project
- [ ] Tạo `.env.prod` với giá trị thật
- [ ] Chạy `./scripts/ssl-setup.sh`
- [ ] Chạy `./scripts/deploy.sh`
- [ ] Setup cron jobs (SSL renewal, backups)
- [ ] Test website tại https://yourdomain.com

---

**🎉 Chúc bạn làm việc hiệu quả với Docker! 🚀**

*Có vấn đề? Xem phần [Troubleshooting](#-troubleshooting) hoặc check logs với `docker-compose logs -f`*
