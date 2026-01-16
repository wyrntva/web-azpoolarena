"""add pin to users and permissions to roles

Revision ID: df0b2528fa9b
Revises: 629b9eda97e2
Create Date: 2026-01-06 18:47:18.255576

"""
from alembic import op
import sqlalchemy as sa


revision = 'df0b2528fa9b'
down_revision = '629b9eda97e2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pin column to users table
    op.add_column('users', sa.Column('pin', sa.String(length=4), nullable=True))
    op.create_index('ix_users_pin', 'users', ['pin'])

    # Add new columns to roles table
    op.add_column('roles', sa.Column('permissions', sa.Text(), nullable=True))
    op.add_column('roles', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('roles', sa.Column('is_system', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Remove columns from roles table
    op.drop_column('roles', 'is_system')
    op.drop_column('roles', 'is_active')
    op.drop_column('roles', 'permissions')

    # Remove pin column from users table
    op.drop_index('ix_users_pin', 'users')
    op.drop_column('users', 'pin')
