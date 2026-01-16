# 🔧 Maintenance Scripts

Folder này chứa các script bảo trì và sửa lỗi Database.

## 📝 Danh sách Scripts

### 🔑 Quản lý Users
- `change_user_to_admin.py` - Chuyển user thành admin
- `check_user_role.py` - Kiểm tra thông tin vai trò user
- `reset_password.py` - Đặt lại mật khẩu user

### 👥 Quản lý Roles  
- `fix_roles_standard.py` - Chuẩn hóa tên và quyền các vai trò chuẩn
- `update_roles_permissions.py` - Cập nhật permissions cho roles
- `update_permissions_system.py` - Cập nhật toàn bộ hệ thống phân quyền

### 📦 Database Fixes
- `fix_db_email.py` - Sửa lỗi email không bắt buộc
- `update_old_inventories.py` - Cập nhật dữ liệu inventory cũ

## 🚀 Cách sử dụng

**Trên môi trường Development (Docker):**
```bash
docker-compose exec -T backend python /app/maintenance/ten_script.py
```

**Ví dụ:**
```bash
# Chuẩn hóa roles
docker-compose exec -T backend python /app/maintenance/fix_roles_standard.py

# Đặt lại mật khẩu cho user ID 1
docker-compose exec -T backend python /app/maintenance/reset_password.py
```

## ⚠️ Lưu ý

- **Backup database trước khi chạy script**
- Một số script chỉ nên chạy **1 lần** (migration)
- Kiểm tra kỹ trước khi chạy trên **Production**
