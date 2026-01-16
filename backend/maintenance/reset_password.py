"""Reset user password"""
from app.db.session import engine
from app.models import User
from sqlalchemy.orm import Session
from app.core.security import get_password_hash

# New password
NEW_PASSWORD = "admin123"

try:
    with Session(engine) as db:
        # Get admin user
        user = db.query(User).filter(User.username == "0364756638").first()

        if user:
            # Reset password
            user.hashed_password = get_password_hash(NEW_PASSWORD)
            db.commit()

            print(f"[SUCCESS] Password reset for user: {user.username}")
            print(f"New password: {NEW_PASSWORD}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role.name if user.role else 'N/A'}")
        else:
            print("[ERROR] User not found")

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
