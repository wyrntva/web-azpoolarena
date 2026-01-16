"""
Script để cập nhật hệ thống phân quyền mới
- Cập nhật tất cả roles với permissions mới
- Admin tự động có tất cả quyền
- Accountant có quyền quản lý tài chính
- Staff chỉ có quyền xem
"""

# -*- coding: utf-8 -*-
"""
Script de cap nhat he thong phan quyen moi
"""
import sys
import io
import json

# Set encoding for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import Role
from app.core.permissions import (
    ALL_PERMISSIONS,
    ADMIN_PERMISSIONS,
    ACCOUNTANT_PERMISSIONS,
    STAFF_PERMISSIONS,
)


def update_role_permissions(db: Session):
    """Cập nhật permissions cho tất cả roles"""

    print("=== BẮT ĐẦU CẬP NHẬT HỆ THỐNG PHÂN QUYỀN ===\n")

    # 1. Cập nhật Admin Role
    print("1. Cập nhật Admin Role...")
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if admin_role:
        admin_role.permissions = json.dumps(ADMIN_PERMISSIONS)  # Convert to JSON string
        admin_role.description = "Quản trị viên - Có tất cả quyền trong hệ thống"
        admin_role.is_system = True
        admin_role.is_active = True
        print(f"   ✓ Admin: {len(ADMIN_PERMISSIONS)} quyền")
    else:
        # Tạo mới nếu chưa có
        admin_role = Role(
            name="admin",
            description="Quản trị viên - Có tất cả quyền trong hệ thống",
            permissions=json.dumps(ADMIN_PERMISSIONS),  # Convert to JSON string
            is_system=True,
            is_active=True,
        )
        db.add(admin_role)
        print(f"   ✓ Tạo mới Admin role: {len(ADMIN_PERMISSIONS)} quyền")

    # 2. Cập nhật Accountant Role
    print("\n2. Cập nhật Accountant Role...")
    accountant_role = db.query(Role).filter(Role.name == "accountant").first()
    if accountant_role:
        accountant_role.permissions = json.dumps(ACCOUNTANT_PERMISSIONS)  # Convert to JSON string
        accountant_role.description = "Kế toán - Quản lý tài chính và báo cáo"
        accountant_role.is_system = True
        accountant_role.is_active = True
        print(f"   ✓ Accountant: {len(ACCOUNTANT_PERMISSIONS)} quyền")
    else:
        accountant_role = Role(
            name="accountant",
            description="Kế toán - Quản lý tài chính và báo cáo",
            permissions=json.dumps(ACCOUNTANT_PERMISSIONS),  # Convert to JSON string
            is_system=True,
            is_active=True,
        )
        db.add(accountant_role)
        print(f"   ✓ Tạo mới Accountant role: {len(ACCOUNTANT_PERMISSIONS)} quyền")

    # 3. Cập nhật Staff Role
    print("\n3. Cập nhật Staff Role...")
    staff_role = db.query(Role).filter(Role.name == "staff").first()
    if staff_role:
        staff_role.permissions = json.dumps(STAFF_PERMISSIONS)  # Convert to JSON string
        staff_role.description = "Nhân viên - Chỉ xem thông tin"
        staff_role.is_system = False
        staff_role.is_active = True
        print(f"   ✓ Staff: {len(STAFF_PERMISSIONS)} quyền")
    else:
        staff_role = Role(
            name="staff",
            description="Nhân viên - Chỉ xem thông tin",
            permissions=json.dumps(STAFF_PERMISSIONS),  # Convert to JSON string
            is_system=False,
            is_active=True,
        )
        db.add(staff_role)
        print(f"   ✓ Tạo mới Staff role: {len(STAFF_PERMISSIONS)} quyền")

    # Commit changes
    try:
        db.commit()
        print("\n✅ CẬP NHẬT THÀNH CÔNG!\n")

        # Hiển thị tổng kết
        print("=" * 60)
        print("TỔNG KẾT HỆ THỐNG PHÂN QUYỀN")
        print("=" * 60)
        print(f"\n📊 Tổng số quyền trong hệ thống: {len(ALL_PERMISSIONS)}")
        print("\n📋 Chi tiết quyền theo vai trò:")
        print(f"   • Admin:      {len(ADMIN_PERMISSIONS)} quyền (Full quyền)")
        print(f"   • Accountant: {len(ACCOUNTANT_PERMISSIONS)} quyền (Quản lý tài chính)")
        print(f"   • Staff:      {len(STAFF_PERMISSIONS)} quyền (Chỉ xem)")

        print("\n📝 Danh sách vai trò trong database:")
        roles = db.query(Role).all()
        for role in roles:
            system_tag = "[HỆ THỐNG]" if role.is_system else "[TÙY CHỈNH]"
            status_tag = "[HOẠT ĐỘNG]" if role.is_active else "[VÔ HIỆU]"
            # Parse permissions to count
            try:
                perms = json.loads(role.permissions) if role.permissions else []
                perm_count = len(perms)
            except:
                perm_count = 0
            print(f"   • {role.name:15} {system_tag:12} {status_tag:15} - {perm_count} quyền")

        print("\n" + "=" * 60)
        print("✅ Hệ thống phân quyền đã được cập nhật!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n❌ LỖI: {str(e)}")
        raise


def main():
    """Main function"""
    db = SessionLocal()
    try:
        update_role_permissions(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
