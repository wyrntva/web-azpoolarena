from app.db.session import SessionLocal
from app.models import User, Role
import sys

# Fix encoding
sys.stdout.reconfigure(encoding='utf-8')

db = SessionLocal()
try:
    # Get admin role
    admin_role = db.query(Role).filter(Role.name == 'admin').first()
    if not admin_role:
        print('Admin role not found!')
        sys.exit(1)

    print(f'Admin role found: ID={admin_role.id}, Name={admin_role.name}')

    # Get user 1
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        print('User 1 not found!')
        sys.exit(1)

    print(f'\nUser found: ID={user.id}, Username={user.username}')
    print(f'Current role: {user.role.name if user.role else "None"} (ID={user.role_id})')

    # Update user role to admin
    user.role_id = admin_role.id
    db.commit()
    db.refresh(user)

    print(f'\n✓ User role updated successfully!')
    print(f'New role: {user.role.name} (ID={user.role_id})')

except Exception as e:
    db.rollback()
    print(f'Error: {e}')
    sys.exit(1)
finally:
    db.close()
