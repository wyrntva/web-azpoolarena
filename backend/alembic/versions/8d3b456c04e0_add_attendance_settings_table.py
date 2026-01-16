"""add_attendance_settings_table

Revision ID: 8d3b456c04e0
Revises: bc379a5e695b
Create Date: 2026-01-13 18:10:48.003715

"""
from alembic import op
import sqlalchemy as sa


revision = '8d3b456c04e0'
down_revision = 'bc379a5e695b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'attendance_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('allowed_late_minutes', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('tier1_max_minutes', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('tier1_penalty', sa.Float(), nullable=False, server_default='0'),
        sa.Column('tier2_max_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('tier2_penalty', sa.Float(), nullable=False, server_default='50000'),
        sa.Column('tier3_max_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('tier3_penalty', sa.Float(), nullable=False, server_default='100000'),
        sa.Column('tier4_penalty', sa.Float(), nullable=False, server_default='200000'),
        sa.Column('early_checkout_grace_minutes', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('early_checkout_penalty', sa.Float(), nullable=False, server_default='50000'),
        sa.Column('auto_absent_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendance_settings_id'), 'attendance_settings', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_attendance_settings_id'), table_name='attendance_settings')
    op.drop_table('attendance_settings')
