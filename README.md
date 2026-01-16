# 🏊 AzPoolArena - Hệ Thống Quản Lý Tài Chính

**Ứng dụng web quản lý tài chính, kho hàng và nhân sự cho doanh nghiệp**

---

## 🐳 Docker đã được tích hợp!

Dự án này sử dụng Docker để dễ dàng development và deployment.

### ⚡ Bắt Đầu Nhanh (5 phút)

```powershell
# 1. Start Docker Desktop

# 2. Start services
docker-compose up -d

# 3. Đợi 15 giây
Start-Sleep -Seconds 15

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Tạo dữ liệu mẫu
docker-compose exec backend python seed.py

# ✅ Xong! Truy cập: http://localhost:5173
# Login: admin / admin123
```

### 📖 Hướng Dẫn Chi Tiết

👉 **[DOCKER-GUIDE.md](./DOCKER-GUIDE.md)** - Hướng dẫn đầy đủ bằng tiếng Việt

Bao gồm:
- ⚡ Bắt đầu nhanh
- 💼 Làm việc hàng ngày
- 🔧 Troubleshooting
- 🌐 Deploy production
- 📚 Tất cả các lệnh cần thiết

---

## 📦 Tính Năng

### Quản Lý Tài Chính
- 💰 Theo dõi thu chi
- 📊 Báo cáo doanh thu
- 💱 Quản lý tỷ giá
- 🏦 Quản lý két/két sắt

### Quản Lý Kho
- 📦 Nhập/xuất hàng
- 📋 Danh mục sản phẩm
- 📊 Báo cáo tồn kho

### Quản Lý Nhân Sự
- 👥 Chấm công nhân viên
- 📅 Lịch làm việc
- 💼 Tính lương
- 📱 Check-in QR code

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite + Ant Design
- **Database**: PostgreSQL
- **DevOps**: Docker + Nginx
- **Auth**: JWT

---

## 📚 Documentation

### Tiếng Việt (Khuyến nghị)
- **[DOCKER-GUIDE.md](./DOCKER-GUIDE.md)** - Hướng dẫn Docker đầy đủ
- **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** - Checklist deploy production

### Tiếng Anh
- **[DOCKER-README.md](./DOCKER-README.md)** - Complete Docker documentation
- **[DOCKER-CHEATSHEET.md](./DOCKER-CHEATSHEET.md)** - Command reference

### Backend & Frontend
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **API Docs**: http://localhost:8000/docs (khi chạy)

---

## 💻 Các Lệnh Thường Dùng

```powershell
# Start
docker-compose up -d

# Stop
docker-compose down

# Xem logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild
docker-compose build
```

**Chi tiết**: Xem [DOCKER-GUIDE.md](./DOCKER-GUIDE.md) hoặc [DOCKER-CHEATSHEET.md](./DOCKER-CHEATSHEET.md)

---

## 🔐 Tài Khoản Mặc Định (Development)

**Admin:**
- Username: `admin`
- Password: `admin123`

**Các tài khoản khác:** Xem [backend/README.md](./backend/README.md)

⚠️ **Nhớ đổi password khi deploy production!**

---

## 📁 Cấu Trúc Project

```
web-azpoolarena-docker/
├── backend/              # FastAPI backend
│   ├── app/             # Source code
│   ├── Dockerfile       # Docker image
│   └── requirements.txt
│
├── frontend/            # React frontend
│   ├── src/            # Source code
│   ├── Dockerfile      # Docker image
│   └── package.json
│
├── nginx/              # Reverse proxy (production)
│   └── conf.d/
│
├── scripts/            # Automation scripts
│   ├── dev-setup.ps1   # Windows setup
│   └── deploy.sh       # Production deploy
│
├── docker-compose.yml      # Development
├── docker-compose.prod.yml # Production
├── .env                    # Dev config
└── DOCKER-GUIDE.md         # 📖 ĐỌC FILE NÀY!
```

---

## 🚀 Môi Trường

### Development
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: localhost:5432

### Production
- Website: https://yourdomain.com
- API: https://api.yourdomain.com
- SSL/HTTPS tự động

---

## 🆘 Cần Giúp Đỡ?

### Quick Issues
1. Kiểm tra logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Xem [DOCKER-GUIDE.md](./DOCKER-GUIDE.md) phần Troubleshooting

### Services Không Start?
```powershell
# Xem status
docker-compose ps

# Xem logs cụ thể
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart từ đầu
docker-compose down
docker-compose up -d
```

---

## 🌐 Deploy Production

Xem hướng dẫn chi tiết tại:
- **[DOCKER-GUIDE.md](./DOCKER-GUIDE.md)** (phần Deploy Production)
- **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)**

**Tóm tắt:**
1. Setup VPS + Docker
2. Cấu hình domain
3. Tạo `.env.prod`
4. Chạy `./scripts/deploy.sh`

---

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Test với Docker
5. Tạo Pull Request

---

## 📝 License

MIT License

---

## 👨‍💻 Thông Tin Thêm

- **Version**: 1.0.0
- **Docker Integration**: ✅ Hoàn thành (Jan 2026)
- **Production Ready**: ✅ Yes
- **Team Size**: 3-5 developers
- **VPS Requirements**: 2GB RAM, Ubuntu 20.04+

---

**🎯 Bắt đầu ngay: [DOCKER-GUIDE.md](./DOCKER-GUIDE.md)**

**💬 Questions? Check documentation hoặc mở issue trên GitHub**

---

*Made with ❤️ for AzPoolArena Team*
