# -*- coding: utf-8 -*-
"""Script xoa role accountant"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.db.session import SessionLocal
from app.models import Role, User

db = SessionLocal()
try:
    accountant = db.query(Role).filter(Role.name == 'accountant').first()
    
    if not accountant:
        print("Khong tim thay role accountant")
    else:
        users_count = db.query(User).filter(User.role_id == accountant.id).count()
        print(f"Role ID: {accountant.id}")
        print(f"Users assigned: {users_count}")
        
        if users_count > 0:
            print(f"KHONG THE XOA: Co {users_count} user dang su dung role nay")
        else:
            db.delete(accountant)
            db.commit()
            print("DA XOA THANH CONG role Accountant!")
            
            remaining = db.query(Role).all()
            print("\nDanh sach roles con lai:")
            for role in remaining:
                print(f"  - {role.name}")
except Exception as e:
    db.rollback()
    print(f"LOI: {str(e)}")
finally:
    db.close()
