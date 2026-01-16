"""add_attendance_to_qrtokentype_enum

Revision ID: 954b5f682415
Revises: 589ba5e3bab2
Create Date: 2026-01-07 04:32:33.896701

"""
from alembic import op
import sqlalchemy as sa


revision = '954b5f682415'
down_revision = '589ba5e3bab2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'attendance' value to qrtokentype enum
    op.execute("ALTER TYPE qrtokentype ADD VALUE IF NOT EXISTS 'attendance'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # You would need to recreate the enum type if you want to remove a value
    pass
