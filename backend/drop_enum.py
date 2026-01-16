from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DROP TYPE IF EXISTS inventorystatus CASCADE"))
    conn.execute(text("DROP TYPE IF EXISTS transactiontype CASCADE"))
    conn.commit()
    print("Dropped enum types successfully")
