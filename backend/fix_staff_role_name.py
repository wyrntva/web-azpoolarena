"""
Fix staff role name
"""
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import Role

sys.stdout.reconfigure(encoding='utf-8')

db: Session = SessionLocal()
try:
    # Find role with ID 3
    staff_role = db.query(Role).filter(Role.id == 3).first()

    if staff_role:
        print(f'Found role: {staff_role.name} (ID: {staff_role.id})')

        # Update to staff
        staff_role.name = 'staff'
        staff_role.description = 'Staff - Limited access'
        staff_role.is_system = False

        db.commit()
        print(f'[SUCCESS] Updated role name to: staff')
    else:
        print('[INFO] Role ID 3 not found')

except Exception as e:
    db.rollback()
    print(f'[ERROR] {e}')
finally:
    db.close()
