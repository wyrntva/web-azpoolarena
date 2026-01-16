from app.db.session import SessionLocal
from app.models import User, Role
import json
import sys

# Fix encoding
sys.stdout.reconfigure(encoding='utf-8')

db = SessionLocal()
try:
    # Get user 1
    user = db.query(User).filter(User.id == 1).first()
    if user:
        print(f'User ID: {user.id}')
        print(f'Username: {user.username}')
        print(f'Role ID: {user.role_id}')
        print(f'Role Name: {user.role.name if user.role else "None"}')
        print(f'PIN: {user.pin}')
        print()

        # Get role info
        if user.role:
            print(f'Role: {user.role.name}')
            print(f'Is System: {user.role.is_system}')
            print(f'Is Active: {user.role.is_active}')
            if user.role.permissions:
                perms = json.loads(user.role.permissions)
                print(f'Permissions count: {len(perms)}')
                print(f'First 5 permissions: {perms[:5]}')
            else:
                print('Permissions: None')
        else:
            print('No role assigned!')
    else:
        print('User 1 not found')

    # List all roles
    print('\n--- All Roles ---')
    roles = db.query(Role).all()
    for role in roles:
        perms_count = 0
        if role.permissions:
            try:
                perms_count = len(json.loads(role.permissions))
            except:
                pass
        print(f'{role.id}. {role.name} - {perms_count} permissions - system={role.is_system}')
finally:
    db.close()
