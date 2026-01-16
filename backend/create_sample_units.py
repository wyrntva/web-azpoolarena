#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Script to create sample units data"""

from app.db.session import SessionLocal
from sqlalchemy import text
from datetime import datetime

def create_sample_units():
    db = SessionLocal()
    try:
        # Check existing units
        result = db.execute(text('SELECT COUNT(*) FROM units'))
        count = result.scalar()
        print(f'So luong units hien tai: {count}')

        if count == 0:
            # Create sample units
            now = datetime.now()
            db.execute(text('''
                INSERT INTO units (name, description, is_active, created_at, updated_at)
                VALUES
                    ('Chai', 'Chai/Lo', true, :now, :now),
                    ('Thung', 'Thung carton', true, :now, :now),
                    ('Kg', 'Kilogram', true, :now, :now),
                    ('Lit', 'Lit', true, :now, :now),
                    ('Hop', 'Hop', true, :now, :now),
                    ('Cai', 'Cai/Chiec', true, :now, :now)
            '''), {'now': now})
            db.commit()
            print('Da tao cac don vi mau thanh cong!')

        # Display units list
        result = db.execute(text('SELECT id, name, description FROM units WHERE is_active = true ORDER BY id'))
        units = result.fetchall()
        print('\nDanh sach don vi:')
        for unit in units:
            print(f'ID: {unit[0]}, Ten: {unit[1]}, Mo ta: {unit[2]}')
    finally:
        db.close()

if __name__ == '__main__':
    create_sample_units()
