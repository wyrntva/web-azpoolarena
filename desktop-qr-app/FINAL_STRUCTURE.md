# 📁 Desktop QR App - Cấu Trúc Cuối Cùng

## 🎯 Tổng Quan

Thư mục này chứa source code và build output của Desktop QR Generator App cho hệ thống chấm công AZ POOLARENA.

---

## 📂 Cấu Trúc Thư Mục

```
desktop-qr-app/
├── 📄 main.py                        # Source code chính (10.9 KB)
├── 📄 api_client.py                  # HTTP client kết nối backend (3.7 KB)
├── 📄 config.py                      # Configuration loader (1.0 KB)
├── 📄 .env                           # Environment variables (372 bytes)
├── 📄 .env.example                   # Template .env (364 bytes)
├── 📄 requirements.txt               # Python dependencies (87 bytes)
├── 📄 logo.png                       # App icon (234 KB)
├── 📄 AZ_POOLARENA_ATTENDANCE.spec   # PyInstaller spec file (997 bytes)
├── 📄 build_exe.bat                  # Build script (2.2 KB)
├── 📄 README.md                      # Hướng dẫn development (2.3 KB)
└── 📁 dist/                          # Build output (DEPLOYMENT READY)
    ├── AZ_POOLARENA_ATTENDANCE.exe   # Executable (66 MB)
    ├── .env                          # Config file
    ├── CAI_DAT_NHANH.bat             # Auto-install script
    ├── Tao_Shortcut_Desktop.bat      # Shortcut creator
    ├── BAT_DAU_O_DAY.txt             # Quick start guide
    ├── HUONG_DAN_CAI_DAT.txt         # Installation guide
    ├── HUONG_DAN_TAO_SHORTCUT.txt    # Shortcut guide
    └── VI_SAO_GIAO_DIEN_DOI_MAU.txt  # UI color explanation
```

---

## 🚀 Files Quan Trọng

### Source Code (Development)

| File | Mục đích | Kích thước |
|------|----------|-----------|
| `main.py` | Giao diện Desktop App (PySide6/Qt6) | 10.9 KB |
| `api_client.py` | HTTP client gọi backend API | 3.7 KB |
| `config.py` | Load config từ .env | 1.0 KB |
| `.env` | Environment variables (API URL, Device ID) | 372 bytes |
| `requirements.txt` | Python dependencies | 87 bytes |

### Build Files

| File | Mục đích |
|------|----------|
| `AZ_POOLARENA_ATTENDANCE.spec` | PyInstaller configuration |
| `build_exe.bat` | Script build EXE tự động |
| `logo.png` | App icon (embedded in EXE) |

### Deployment Package (`dist/`)

| File | Mục đích | Kích thước |
|------|----------|-----------|
| `AZ_POOLARENA_ATTENDANCE.exe` | Main executable | 66 MB |
| `.env` | Runtime config | 372 bytes |
| `CAI_DAT_NHANH.bat` | Auto-install script | 4.1 KB |
| `Tao_Shortcut_Desktop.bat` | Shortcut creator | 1.5 KB |
| `BAT_DAU_O_DAY.txt` | Quick start | 6.2 KB |
| `HUONG_DAN_CAI_DAT.txt` | Installation manual | 7.6 KB |
| `HUONG_DAN_TAO_SHORTCUT.txt` | Shortcut manual | 5.5 KB |
| `VI_SAO_GIAO_DIEN_DOI_MAU.txt` | UI color FAQ | 2.7 KB |

---

## 🛠️ Development Commands

### Install Dependencies
```bash
cd desktop-qr-app
pip install -r requirements.txt
```

### Run Development Version
```bash
python main.py
```

### Build EXE
```bash
# Option 1: Using batch script (recommended)
build_exe.bat

# Option 2: Direct PyInstaller command
pyinstaller AZ_POOLARENA_ATTENDANCE.spec
```

---

## 📦 Deployment

### Deployment Package Location
```
desktop-qr-app/dist/
```

### Deploy to Target PC

1. **Copy entire `dist/` folder** to target PC
2. **Run**: `CAI_DAT_NHANH.bat`
3. **Enter**:
   - Device ID (e.g., PC-QR-02)
   - Device Name (e.g., Lễ tân - Máy 2)
4. **Done!** Icon appears on Desktop

---

## 🔧 Configuration

### `.env` File Structure
```env
# Backend API
API_BASE_URL=http://192.168.1.187:8000
INTERNAL_API_KEY=azpoolarena-internal-qr-2026

# Device Info (CHANGE FOR EACH PC)
DEVICE_ID=PC-QR-01
DEVICE_NAME=Reception QR Generator - PC-01

# QR Settings
DEFAULT_TTL_SECONDS=60
QR_SIZE=10
QR_BORDER=4

# Frontend URL
FRONTEND_URL=http://192.168.1.187:5173
```

---

## 🗑️ Cleaned Up

Đã xóa các files/folders không cần thiết:

- ❌ `__pycache__/` - Python cache files (auto-generated)
- ❌ `build/` - PyInstaller build cache (auto-generated)

---

## 📊 Dependencies

### Python Packages (requirements.txt)
```
PySide6>=6.6.0
qrcode[pil]>=7.4.2
requests>=2.31.0
python-dotenv>=1.0.0
```

### Build Tools
- PyInstaller 6.17.0
- Python 3.12.10

---

## ✅ Features Implemented

- ✅ One-time QR code generation (60 seconds TTL)
- ✅ Countdown timer with color indicators
- ✅ Auto-register device on first use
- ✅ Fixed color palette (no color change on different PCs)
- ✅ Network support (LAN deployment)
- ✅ Embedded logo
- ✅ Auto-install script with shortcut creation

---

## 🔄 Version History

### v1.1.0 (2026-01-12) - Current
- ✅ Fixed: UI color inconsistency across different PCs
- ✅ Fixed: 400 error when creating QR from new device
- ✅ Added: Auto-register device functionality
- ✅ Added: CAI_DAT_NHANH.bat auto-install script
- ✅ Added: Comprehensive documentation
- ✅ Updated: QPalette to override system theme

### v1.0.0 (2026-01-12) - Initial
- ✅ Basic QR generation
- ✅ Countdown timer
- ✅ Desktop application with Qt6

---

## 📝 Notes

### For Developers
- Source code is in root directory
- Run `python main.py` for testing
- Use `build_exe.bat` to create EXE
- **DO NOT** commit `__pycache__/` or `build/` folders

### For Deployment
- Only deploy `dist/` folder
- Each PC needs unique `DEVICE_ID` in `.env`
- Backend must be running at `192.168.1.187:8000`
- Frontend must be running at `192.168.1.187:5173`

---

## 🎯 Next Steps

### If you need to modify:

1. **Change UI**: Edit `main.py`
2. **Change API logic**: Edit `api_client.py`
3. **Change config**: Edit `.env` or `config.py`
4. **After changes**: Run `build_exe.bat` to rebuild EXE

### If deploying to new PC:

1. Copy `dist/` folder
2. Run `CAI_DAT_NHANH.bat`
3. Follow prompts
4. Done!

---

## 📞 Support

- Email: support@azpoolarena.com
- Documentation: See files in `dist/` folder
- Build Issues: Check `build_exe.bat` output

---

**Last Updated**: 2026-01-12
**Build**: v1.1.0
**Status**: ✅ Production Ready
