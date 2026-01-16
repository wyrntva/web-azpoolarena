"""add_categories_and_update_inventory

Revision ID: b695f2dcf943
Revises: f056ad683fc7
Create Date: 2026-01-06 14:17:39.546531

"""
from alembic import op
import sqlalchemy as sa


revision = 'b695f2dcf943'
down_revision = 'f056ad683fc7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)

    # Add category_id to receipt_types
    op.add_column('receipt_types', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_receipt_types_category', 'receipt_types', 'categories', ['category_id'], ['id'])

    # Add category_id to inventories
    op.add_column('inventories', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_inventories_category', 'inventories', 'categories', ['category_id'], ['id'])

    # Add price and payment_method to inventory_transaction_details
    op.add_column('inventory_transaction_details', sa.Column('price', sa.Float(), nullable=True))
    op.add_column('inventory_transaction_details', sa.Column('payment_method', sa.Enum('cash', 'bank', name='accounttype'), nullable=True))

    # Insert default categories
    from sqlalchemy import text
    conn = op.get_bind()
    conn.execute(text("""
        INSERT INTO categories (name, description, is_active, created_at, updated_at)
        VALUES
            ('Nước đóng chai', 'Sản phẩm nước đóng chai', true, NOW(), NOW()),
            ('Bim Bim', 'Sản phẩm Bim Bim', true, NOW(), NOW())
    """))

    # Create corresponding receipt types for each category (if not exists)
    conn.execute(text("""
        INSERT INTO receipt_types (name, description, category_id, is_active, created_at, updated_at)
        SELECT c.name, 'Chi ' || c.name, c.id, true, NOW(), NOW()
        FROM categories c
        WHERE NOT EXISTS (
            SELECT 1 FROM receipt_types WHERE name = c.name
        )
    """))


def downgrade() -> None:
    # Drop columns from inventory_transaction_details
    op.drop_column('inventory_transaction_details', 'payment_method')
    op.drop_column('inventory_transaction_details', 'price')

    # Drop foreign keys and columns
    op.drop_constraint('fk_inventories_category', 'inventories', type_='foreignkey')
    op.drop_column('inventories', 'category_id')

    op.drop_constraint('fk_receipt_types_category', 'receipt_types', type_='foreignkey')
    op.drop_column('receipt_types', 'category_id')

    # Drop categories table
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')

    # Drop enum type
    op.execute("DROP TYPE IF EXISTS accounttype")
