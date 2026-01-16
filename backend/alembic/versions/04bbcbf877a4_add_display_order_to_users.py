"""add_display_order_to_users

Revision ID: 04bbcbf877a4
Revises: 4f95b34bb36f
Create Date: 2026-01-13 21:48:50.816324

"""
from alembic import op
import sqlalchemy as sa


revision = '04bbcbf877a4'
down_revision = '4f95b34bb36f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add display_order column to users table
    op.add_column('users', sa.Column('display_order', sa.Integer(), nullable=True))

    # Set default display_order based on current ID order
    op.execute('UPDATE users SET display_order = id WHERE display_order IS NULL')


def downgrade() -> None:
    # Remove display_order column
    op.drop_column('users', 'display_order')
