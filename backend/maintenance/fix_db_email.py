import os
from sqlalchemy import create_engine, text

# Kết nối DB: Ưu tiên lấy từ biến môi trường
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:ysH63sy6@db:5432/azpoolarena")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Bắt đầu cập nhật cấu trúc Database...")
        
        # Chuyển cột email sang nullable (không bắt buộc)
        conn.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"))
        conn.commit()
        
        print("✅ Đã cập nhật xong: Cột email giờ không còn bắt buộc.")
        
except Exception as e:
    print(f"❌ Có lỗi xảy ra (có thể cột đã nullable rồi): {e}")
