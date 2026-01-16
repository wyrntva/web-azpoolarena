import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:ysH63sy6@db:5432/azpoolarena"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_db():
    db = SessionLocal()
    try:
        # 1. Create permissions list
        all_permissions = [
            'view_dashboard',
            'view_staff_page', 'create_staff', 'edit_staff', 'delete_staff',
            'view_roles_page', 'create_role', 'edit_role', 'delete_role',
            'view_work_schedule_page', 'create_schedule', 'edit_schedule', 'delete_schedule',
            'view_attendance_page', 'create_attendance', 'edit_attendance', 'delete_attendance', 'approve_attendance_requests',
            'view_receipts_page', 'create_receipt', 'edit_receipt', 'delete_receipt',
            'view_receipt_types_page', 'create_receipt_type', 'edit_receipt_type', 'delete_receipt_type',
            'view_finance_types_page', 'create_finance_type', 'edit_finance_type', 'delete_finance_type',
            'view_revenues_page', 'create_revenue', 'edit_revenue', 'delete_revenue',
            'view_exchanges_page', 'create_exchange', 'edit_exchange', 'delete_exchange',
            'view_finance_trade_page', 'create_finance_trade', 'edit_finance_trade', 'delete_finance_trade',
            'view_safe_page', 'create_safe', 'edit_safe', 'delete_safe',
            'view_debt_page', 'create_debt', 'edit_debt', 'delete_debt',
            'view_inventory_page', 'create_inventory', 'edit_inventory', 'delete_inventory', 'inventory_check',
            'view_reports_page', 'export_reports',
            'view_settings_page', 'edit_settings',
        ]
        permissions_json = json.dumps(all_permissions)

        # 2. Check if "Quản lý" role exists, update or create it
        res = db.execute(text("SELECT id FROM roles WHERE name = 'Quản lý'")).fetchone()
        if res:
            management_id = res[0]
            db.execute(text("UPDATE roles SET permissions = :perms WHERE id = :id"), {"perms": permissions_json, "id": management_id})
            print(f"Updated Quản lý role (ID: {management_id}) with all permissions.")
        else:
            db.execute(text("INSERT INTO roles (name, description, permissions, is_active, is_system) VALUES ('Quản lý', 'Quản lý hệ thống', :perms, true, true)"), {"perms": permissions_json})
            management_id = db.execute(text("SELECT id FROM roles WHERE name = 'Quản lý'")).fetchone()[0]
            print(f"Created Quản lý role (ID: {management_id}) with all permissions.")

        # 3. Create "Thu ngân" role if not exists
        res_cashier = db.execute(text("SELECT id FROM roles WHERE name = 'Thu ngân'")).fetchone()
        if not res_cashier:
            # Cashier has limited permissions
            cashier_perms = [
                'view_dashboard',
                'view_receipts_page', 'create_receipt',
                'view_revenues_page', 'create_revenue',
                'view_attendance_page',
            ]
            db.execute(text("INSERT INTO roles (name, description, permissions, is_active, is_system) VALUES ('Thu ngân', 'Nhân viên thu ngân', :perms, true, false)"), {"perms": json.dumps(cashier_perms)})
            print("Created Thu ngân role.")

        # 4. Assign User ID 1 to "Quản lý" role
        db.execute(text("UPDATE users SET role_id = :role_id WHERE id = 1"), {"role_id": management_id})
        print(f"Assigned User ID 1 to Role ID {management_id} (Quản lý).")

        db.commit()
        print("Database fix completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error fixing database: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_db()
