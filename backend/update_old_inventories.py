#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Script to update old inventories with default category"""

from app.db.session import SessionLocal
from sqlalchemy import text

def update_old_inventories():
    db = SessionLocal()
    try:
        # Get the first category (Nước đóng chai)
        result = db.execute(text('SELECT id FROM categories WHERE name = :name LIMIT 1'), {'name': 'Nước đóng chai'})
        default_category = result.fetchone()

        if not default_category:
            print('Không tìm thấy category mặc định. Vui lòng chạy migration trước.')
            return

        default_category_id = default_category[0]
        print(f'Category mặc định: ID {default_category_id}')

        # Update inventories without category_id
        result = db.execute(
            text('UPDATE inventories SET category_id = :cat_id WHERE category_id IS NULL'),
            {'cat_id': default_category_id}
        )
        db.commit()

        rows_updated = result.rowcount
        print(f'Đã cập nhật {rows_updated} sản phẩm với category mặc định')

        # Display updated inventories
        result = db.execute(text('''
            SELECT i.id, i.product_name, c.name as category_name
            FROM inventories i
            LEFT JOIN categories c ON i.category_id = c.id
            ORDER BY i.id
        '''))

        print('\nDanh sách sản phẩm:')
        for row in result:
            print(f'ID: {row[0]}, Tên: {row[1]}, Danh mục: {row[2]}')

    except Exception as e:
        print(f'Lỗi: {str(e)}')
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    update_old_inventories()
