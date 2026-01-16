"""add_absent_penalty_to_attendance_settings

Revision ID: 67f98a264743
Revises: 04bbcbf877a4
Create Date: 2026-01-14 02:08:16.749074

"""
from alembic import op
import sqlalchemy as sa


revision = '67f98a264743'
down_revision = '04bbcbf877a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add absent_penalty column to attendance_settings table
    op.add_column('attendance_settings', sa.Column('absent_penalty', sa.Float(), nullable=True))

    # Set default value of 100000 for existing records
    op.execute('UPDATE attendance_settings SET absent_penalty = 100000 WHERE absent_penalty IS NULL')

    # Make column non-nullable after setting defaults
    op.alter_column('attendance_settings', 'absent_penalty', nullable=False)


def downgrade() -> None:
    # Remove absent_penalty column
    op.drop_column('attendance_settings', 'absent_penalty')
