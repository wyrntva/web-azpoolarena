# -*- coding: utf-8 -*-
"""Make email column nullable"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy import text
from app.db.session import SessionLocal

db = SessionLocal()
try:
    # Alter table to make email nullable
    db.execute(text('ALTER TABLE users ALTER COLUMN email DROP NOT NULL'))
    db.commit()
    print("SUCCESS: Email column is now nullable")
    
    # Verify
    result = db.execute(text("""
        SELECT column_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    """))
    row = result.fetchone()
    print(f"Verification: email column is_nullable = {row[1]}")
    
except Exception as e:
    db.rollback()
    print(f"ERROR: {str(e)}")
finally:
    db.close()
