from app.db.session import SessionLocal
from app.models import User, Role
from app.core.security import get_password_hash

def create_initial_data():
    db = SessionLocal()
    try:
        # Lấy role IDs
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        accountant_role = db.query(Role).filter(Role.name == "accountant").first()
        staff_role = db.query(Role).filter(Role.name == "staff").first()

        # Tạo users
        admin = User(
            username="admin",
            email="admin@azpoolarena.com",
            full_name="Administrator",
            hashed_password=get_password_hash("admin123"),
            role_id=admin_role.id,
            is_active=True
        )

        ketoan = User(
            username="ketoan",
            email="ketoan@azpoolarena.com",
            full_name="Kế toán",
            hashed_password=get_password_hash("ketoan123"),
            role_id=accountant_role.id,
            is_active=True
        )

        nhanvien = User(
            username="nhanvien",
            email="nhanvien@azpoolarena.com",
            full_name="Nhân viên",
            hashed_password=get_password_hash("nhanvien123"),
            role_id=staff_role.id,
            is_active=True
        )

        db.add_all([admin, ketoan, nhanvien])
        db.commit()

        print("✅ Đã tạo 3 roles và 3 users thành công!")
        print("Admin: admin/admin123")
        print("Kế toán: ketoan/ketoan123")
        print("Nhân viên: nhanvien/nhanvien123")
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_data()