import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import Role, User, ReceiptType, Receipt, Revenue, Exchange, AccountType
from app.core.security import get_password_hash


def drop_tables():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Tables dropped.")


def create_tables():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")


def seed_roles(db: Session):
    print("Seeding roles...")
    roles = [
        Role(name="admin", description="Administrator with full access"),
        Role(name="accountant", description="Accountant with financial access"),
        Role(name="staff", description="Staff with limited access"),
    ]
    for role in roles:
        db.add(role)
    db.commit()
    print(f"Seeded {len(roles)} roles.")
    return roles


def seed_users(db: Session, roles: list):
    print("Seeding users...")
    admin_role = next(r for r in roles if r.name == "admin")
    accountant_role = next(r for r in roles if r.name == "accountant")
    staff_role = next(r for r in roles if r.name == "staff")

    users = [
        User(
            username="admin",
            email="admin@azpoolarena.com",
            full_name="Administrator",
            hashed_password=get_password_hash("admin123"),
            role_id=admin_role.id,
            is_active=True
        ),
        User(
            username="accountant",
            email="accountant@azpoolarena.com",
            full_name="Kế toán trưởng",
            hashed_password=get_password_hash("accountant123"),
            role_id=accountant_role.id,
            is_active=True
        ),
        User(
            username="staff1",
            email="staff1@azpoolarena.com",
            full_name="Nhân viên 1",
            hashed_password=get_password_hash("staff123"),
            role_id=staff_role.id,
            is_active=True
        ),
        User(
            username="staff2",
            email="staff2@azpoolarena.com",
            full_name="Nhân viên 2",
            hashed_password=get_password_hash("staff123"),
            role_id=staff_role.id,
            is_active=True
        ),
    ]
    for user in users:
        db.add(user)
    db.commit()
    print(f"Seeded {len(users)} users.")
    return users


def seed_receipt_types(db: Session):
    print("Seeding receipt types...")
    receipt_types = [
        ReceiptType(name="Tiền điện", description="Chi phí tiền điện hàng tháng"),
        ReceiptType(name="Tiền nước", description="Chi phí tiền nước hàng tháng"),
        ReceiptType(name="Tiền thuê mặt bằng", description="Chi phí thuê mặt bằng"),
        ReceiptType(name="Lương nhân viên", description="Chi trả lương nhân viên"),
        ReceiptType(name="Mua thiết bị", description="Chi phí mua sắm thiết bị"),
        ReceiptType(name="Bảo trì - Sửa chữa", description="Chi phí bảo trì và sửa chữa"),
        ReceiptType(name="Doanh thu vé", description="Doanh thu từ bán vé"),
        ReceiptType(name="Dịch vụ khác", description="Thu nhập từ các dịch vụ khác"),
    ]
    for rt in receipt_types:
        db.add(rt)
    db.commit()
    print(f"Seeded {len(receipt_types)} receipt types.")
    return receipt_types


def seed_receipts(db: Session, receipt_types: list, users: list):
    print("Seeding receipts...")
    admin = next(u for u in users if u.username == "admin")
    accountant = next(u for u in users if u.username == "accountant")

    expense_types = [rt for rt in receipt_types if "Chi" in rt.description or "lương" in rt.name.lower()]
    income_types = [rt for rt in receipt_types if "Doanh thu" in rt.description or "Thu" in rt.description]

    receipts = []

    for i in range(30):
        receipt_date = date.today() - timedelta(days=i)

        if income_types:
            receipts.append(Receipt(
                receipt_date=receipt_date,
                amount=500000 + (i * 10000),
                receipt_type_id=income_types[0].id,
                is_income=True,
                note=f"Doanh thu vé ngày {receipt_date.strftime('%d/%m/%Y')}",
                created_by=admin.id
            ))

        if expense_types and i % 3 == 0:
            receipts.append(Receipt(
                receipt_date=receipt_date,
                amount=150000 + (i * 5000),
                receipt_type_id=expense_types[i % len(expense_types)].id,
                is_income=False,
                note=f"Chi phí ngày {receipt_date.strftime('%d/%m/%Y')}",
                created_by=accountant.id
            ))

    for receipt in receipts:
        db.add(receipt)
    db.commit()
    print(f"Seeded {len(receipts)} receipts.")
    return receipts


def seed_revenues(db: Session, users: list):
    print("Seeding revenues...")
    admin = next(u for u in users if u.username == "admin")

    revenues = []
    for i in range(30):
        revenue_date = date.today() - timedelta(days=i)
        revenues.append(Revenue(
            revenue_date=revenue_date,
            cash_revenue=300000 + (i * 20000),
            bank_revenue=200000 + (i * 15000),
            note=f"Doanh thu ngày {revenue_date.strftime('%d/%m/%Y')}",
            created_by=admin.id
        ))

    for revenue in revenues:
        db.add(revenue)
    db.commit()
    print(f"Seeded {len(revenues)} revenues.")
    return revenues


def seed_exchanges(db: Session, users: list):
    print("Seeding exchanges...")
    accountant = next(u for u in users if u.username == "accountant")

    exchanges = []
    for i in range(10):
        exchange_date = date.today() - timedelta(days=i * 3)
        from_acc = AccountType.CASH if i % 2 == 0 else AccountType.BANK
        to_acc = AccountType.BANK if i % 2 == 0 else AccountType.CASH

        exchanges.append(Exchange(
            exchange_date=exchange_date,
            amount=1000000 + (i * 100000),
            from_account=from_acc,
            to_account=to_acc,
            note=f"Chuyển tiền từ {from_acc.value} sang {to_acc.value}",
            created_by=accountant.id
        ))

    for exchange in exchanges:
        db.add(exchange)
    db.commit()
    print(f"Seeded {len(exchanges)} exchanges.")
    return exchanges


def main():
    print("=" * 60)
    print("AZ POOLARENA - Database Seeding Script")
    print("=" * 60)

    db = SessionLocal()

    try:
        drop_tables()
        create_tables()

        roles = seed_roles(db)
        users = seed_users(db, roles)
        receipt_types = seed_receipt_types(db)
        receipts = seed_receipts(db, receipt_types, users)
        revenues = seed_revenues(db, users)
        exchanges = seed_exchanges(db, users)

        print("\n" + "=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        print("\nDefault Accounts:")
        print("-" * 60)
        print("Admin:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nAccountant:")
        print("  Username: accountant")
        print("  Password: accountant123")
        print("\nStaff:")
        print("  Username: staff1 / staff2")
        print("  Password: staff123")
        print("=" * 60)

    except Exception as e:
        print(f"\nError during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
