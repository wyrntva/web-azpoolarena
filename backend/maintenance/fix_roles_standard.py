
import json
import os
from sqlalchemy import create_engine, text

# Kết nối DB: Ưu tiên lấy từ biến môi trường, nếu không có thì dùng mặc định (mặc định này khớp với .env của bạn)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:ysH63sy6@db:5432/azpoolarena")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Bắt đầu chuẩn hóa tên Vai trò...")
        
        # 1. Cập nhật tên Role ID 2 -> Phục vụ
        conn.execute(text("UPDATE roles SET name = 'Phục vụ', is_active = true WHERE id = 2"))
        
        # 2. Cập nhật tên Role ID 5 -> Thu ngân
        conn.execute(text("UPDATE roles SET name = 'Thu ngân', is_active = true WHERE id = 5"))
        
        # 3. Cập nhật tên Role ID 3 -> Nhân viên
        conn.execute(text("UPDATE roles SET name = 'Nhân viên', is_active = true WHERE id = 3"))
        
        # 4. Cập nhật tên Role ID 4 -> Quản lý
        conn.execute(text("UPDATE roles SET name = 'Quản lý', is_active = true WHERE id = 4"))
        
        # 5. Đảm bảo tất cả Roles đều Active (để tránh lỗi không hiện)
        conn.execute(text("UPDATE roles SET is_active = true WHERE is_active IS NULL"))

        conn.commit()
        print("✅ Đã cập nhật xong! Hãy F5 lại trình duyệt.")
        
except Exception as e:
    print(f"❌ Có lỗi xảy ra: {e}")
