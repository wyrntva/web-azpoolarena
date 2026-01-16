"""add_inventories_table

Revision ID: 647fe22b76b0
Revises: 9b2d2b5c6ac7
Create Date: 2026-01-05 17:25:15.894731

"""
from alembic import op
import sqlalchemy as sa


revision = '647fe22b76b0'
down_revision = '9b2d2b5c6ac7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type and table using raw SQL to avoid SQLAlchemy auto-creation
    from sqlalchemy import text
    conn = op.get_bind()

    # Check if type exists
    result = conn.execute(text("SELECT 1 FROM pg_type WHERE typname = 'inventorystatus'"))
    if not result.fetchone():
        op.execute("CREATE TYPE inventorystatus AS ENUM ('in_stock', 'out_of_stock', 'low_stock')")

    # Create table using raw SQL
    op.execute("""
        CREATE TABLE inventories (
            id SERIAL PRIMARY KEY,
            product_name VARCHAR(200) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            min_quantity INTEGER NOT NULL DEFAULT 0,
            unit VARCHAR(50) NOT NULL,
            status inventorystatus NOT NULL DEFAULT 'in_stock',
            note TEXT,
            created_by INTEGER NOT NULL REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    op.create_index(op.f('ix_inventories_id'), 'inventories', ['id'], unique=False)
    op.create_index(op.f('ix_inventories_product_name'), 'inventories', ['product_name'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_inventories_product_name'), table_name='inventories')
    op.drop_index(op.f('ix_inventories_id'), table_name='inventories')
    op.drop_table('inventories')
