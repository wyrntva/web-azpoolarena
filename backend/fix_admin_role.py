"""
Fix admin role name
"""
import json
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import Role

sys.stdout.reconfigure(encoding='utf-8')

# All permissions
ALL_PERMISSIONS = [
    'view_finance', 'create_finance', 'edit_finance', 'delete_finance',
    'view_revenue', 'create_revenue', 'edit_revenue', 'delete_revenue',
    'view_inventory', 'create_inventory', 'edit_inventory', 'delete_inventory', 'inventory_check',
    'view_reports', 'export_reports',
    'view_staff', 'create_staff', 'edit_staff', 'delete_staff',
    'view_attendance', 'manage_attendance', 'approve_requests',
    'view_settings', 'edit_settings',
]

db: Session = SessionLocal()
try:
    # Find role with ID 1 (Quan ly)
    admin_role = db.query(Role).filter(Role.id == 1).first()
    if admin_role:
        print(f'Found role: {admin_role.name} (ID: {admin_role.id})')

        # Update to admin
        admin_role.name = 'admin'
        admin_role.description = 'Administrator - Full system access'
        admin_role.permissions = json.dumps(ALL_PERMISSIONS)
        admin_role.is_active = True
        admin_role.is_system = True

        db.commit()
        print(f'[SUCCESS] Updated role to: admin')
        print(f'  - Permissions: {len(ALL_PERMISSIONS)}')
        print(f'  - is_system: True')
        print(f'  - is_active: True')
    else:
        print('[ERROR] Role ID 1 not found')

except Exception as e:
    db.rollback()
    print(f'[ERROR] {e}')
finally:
    db.close()
