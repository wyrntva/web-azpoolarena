"""add_is_inventory_to_receipt_types

Revision ID: 629b9eda97e2
Revises: b695f2dcf943
Create Date: 2026-01-06 15:35:57.010149

"""
from alembic import op
import sqlalchemy as sa


revision = '629b9eda97e2'
down_revision = 'b695f2dcf943'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_inventory column to receipt_types table
    op.add_column('receipt_types', sa.Column('is_inventory', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove is_inventory column from receipt_types table
    op.drop_column('receipt_types', 'is_inventory')
