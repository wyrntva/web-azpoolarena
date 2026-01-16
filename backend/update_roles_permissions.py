"""
Script to update existing roles with permissions
Run this once to populate permissions for existing roles
"""
import json
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import Role

# Define all permissions
ALL_PERMISSIONS = [
    # Finance
    'view_finance', 'create_finance', 'edit_finance', 'delete_finance',
    # Revenue
    'view_revenue', 'create_revenue', 'edit_revenue', 'delete_revenue',
    # Inventory
    'view_inventory', 'create_inventory', 'edit_inventory', 'delete_inventory', 'inventory_check',
    # Reports
    'view_reports', 'export_reports',
    # Staff
    'view_staff', 'create_staff', 'edit_staff', 'delete_staff',
    # Attendance
    'view_attendance', 'manage_attendance', 'approve_requests',
    # Settings
    'view_settings', 'edit_settings',
]

ACCOUNTANT_PERMISSIONS = [
    'view_finance', 'create_finance', 'edit_finance', 'delete_finance',
    'view_revenue', 'create_revenue', 'edit_revenue', 'delete_revenue',
    'view_reports', 'export_reports',
    'view_settings',
]

STAFF_PERMISSIONS = [
    'view_finance', 'view_revenue', 'view_inventory', 'view_reports',
]


def update_roles():
    db: Session = SessionLocal()
    try:
        # Update admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if admin_role:
            admin_role.permissions = json.dumps(ALL_PERMISSIONS)
            admin_role.is_active = True
            admin_role.is_system = True
            print(f"[OK] Updated admin role with {len(ALL_PERMISSIONS)} permissions")

        # Update accountant role
        accountant_role = db.query(Role).filter(Role.name == "accountant").first()
        if accountant_role:
            accountant_role.permissions = json.dumps(ACCOUNTANT_PERMISSIONS)
            accountant_role.is_active = True
            accountant_role.is_system = True
            print(f"[OK] Updated accountant role with {len(ACCOUNTANT_PERMISSIONS)} permissions")

        # Update staff role
        staff_role = db.query(Role).filter(Role.name == "staff").first()
        if staff_role:
            staff_role.permissions = json.dumps(STAFF_PERMISSIONS)
            staff_role.is_active = True
            staff_role.is_system = False
            print(f"[OK] Updated staff role with {len(STAFF_PERMISSIONS)} permissions")

        db.commit()
        print("\n[SUCCESS] All roles updated successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error updating roles: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("Updating roles with permissions...\n")
    update_roles()
