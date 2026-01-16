# 📁 Cấu trúc Dự án AZ POOL ARENA

## 🎯 Tổng quan

Hệ thống quản lý bể bơi với kiến trúc Docker microservices:
- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite + Ant Design  
- **Database**: PostgreSQL 15
- **Desktop App**: PySide6 (QR Generator)

---

## 📂 Cấu trúc Thư mục

```
web-azpoolarena-docker/
├── 📁 backend/              # FastAPI Backend API
│   ├── 📁 app/              # Main application code
│   │   ├── 📁 api/          # API endpoints (routes)
│   │   ├── 📁 core/         # Core config & permissions
│   │   ├── 📁 db/           # Database connection
│   │   ├── 📁 dependencies/ # FastAPI dependencies
│   │   ├── 📁 models/       # SQLAlchemy models
│   │   ├── 📁 schemas/      # Pydantic schemas
│   │   └── main.py          # App entry point
│   ├── 📁 alembic/          # Database migrations
│   ├── 📁 maintenance/      # Scripts bảo trì ⚙️
│   ├── seed.py              # Seed initial data
│   ├── create_qr_device.py  # Tạo thiết bị QR
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
│
├── 📁 frontend/             # React Frontend SPA
│   ├── 📁 src/
│   │   ├── 📁 api/          # API client functions
│   │   ├── 📁 auth/         # Authentication logic
│   │   ├── 📁 components/   # Reusable components
│   │   ├── 📁 constants/    # Constants & configs
│   │   ├── 📁 layouts/      # Page layouts
│   │   ├── 📁 pages/        # Page components
│   │   ├── 📁 routes/       # Routing config
│   │   ├── 📁 styles/       # Global styles
│   │   ├── 📁 utils/        # Utility functions
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── 📁 desktop-qr-app/       # Desktop QR Generator
│   ├── 📁 dist/             # Executable build
│   │   ├── .env             # Config cho dist
│   │   ├── AZ_POOLARENA_ATTENDANCE.exe
│   │   └── CAI_DAT_NHANH.bat
│   ├── main.py              # Main application
│   ├── api_client.py        # API integration
│   ├── config.py            # App configuration
│   └── requirements.txt
│
├── 📁 nginx/                # Nginx config (production)
│   └── nginx.conf
│
├── 📁 scripts/              # Utility scripts
│   ├── backup.sh            # Database backup
│   ├── restore.sh           # Database restore
│   └── deploy.sh            # Deployment script
│
├── docker-compose.yml       # Dev environment
├── docker-compose.prod.yml  # Production environment
├── .env.example             # Environment template
├── Makefile                 # Quick commands
└── 📄 Docs/                 # Documentation files
    ├── BAT-DAU-O-DAY.md     # Quick start guide
    ├── DOCKER-GUIDE.md      # Docker detailed guide
    └── DEPLOYMENT-CHECKLIST.md
```

---

## 🔑 Files Quan trọng

### Backend
- `app/main.py` - Entry point, CORS, middleware setup
- `app/core/permissions.py` - Permission constants & role mappings
- `app/dependencies/permissions.py` - Permission guards
- `maintenance/` - Scripts bảo trì database

### Frontend
- `src/main.jsx` - App initialization
- `src/auth/AuthContext.jsx` - Authentication provider
- `src/routes/Routes.jsx` - Route definitions
- `vite.config.js` - Build configuration

### Infrastructure
- `docker-compose.yml` - Development setup
- `Makefile` - Common commands (`make dev`, `make logs`, etc.)
- `.env` - Environment variables (Git-ignored)

---

## 🚀 Quick Commands

```bash
# Start development
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild after code changes
docker-compose up -d --build backend

# Database backup
docker-compose exec -T db pg_dump -U postgres azpoolarena > backup.sql

# Run maintenance script
docker-compose exec -T backend python /app/maintenance/fix_roles_standard.py
```

---

## 📝 Environment Variables

### Backend (.env)
- `POSTGRES_*` - Database credentials
- `SECRET_KEY` - JWT secret
- `CORS_ORIGINS` - Allowed origins
- `INTERNAL_API_KEY` - QR system key

### Frontend (.env)
- `VITE_API_URL` - Backend API URL

### Desktop QR App (.env)
- `API_BASE_URL` - Backend URL
- `INTERNAL_API_KEY` - Authentication key
- `DEVICE_ID` - Unique device ID
- `FRONTEND_URL` - Frontend URL for QR codes

---

## 🔧 Bảo trì

### Update Database Schema
```bash
# Create migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migration
docker-compose exec backend alembic upgrade head
```

### Reset Admin Password
```bash
docker-compose exec backend python /app/maintenance/reset_password.py
```

### Fix Roles
```bash
docker-compose exec backend python /app/maintenance/fix_roles_standard.py
```

---

## 📦 Deployment

Xem file `DEPLOYMENT-CHECKLIST.md` để biết chi tiết deployment lên VPS.

---

## 🆘 Troubleshooting

### CORS Error
- Kiểm tra `CORS_ORIGINS` trong `.env`
- Restart backend: `docker-compose restart backend`

### Can't create user
- Run: `docker-compose exec backend python /app/maintenance/fix_db_email.py`

### Database connection error
- Check DB status: `docker-compose ps`
- Check logs: `docker-compose logs db`

---

Được cập nhật: 2026-01-17
