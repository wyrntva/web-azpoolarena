"""add_attendance_system_tables

Revision ID: 589ba5e3bab2
Revises: df0b2528fa9b
Create Date: 2026-01-06 23:28:40.147028

"""
from alembic import op
import sqlalchemy as sa


revision = '589ba5e3bab2'
down_revision = 'df0b2528fa9b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'wifi_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ssid', sa.String(length=100), nullable=False),
        sa.Column('bssid', sa.String(length=17), nullable=True),
        sa.Column('ip_range', sa.String(length=50), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wifi_configs_id'), 'wifi_configs', ['id'], unique=False)
    op.create_index(op.f('ix_wifi_configs_ssid'), 'wifi_configs', ['ssid'], unique=False)

    op.create_table(
        'qr_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('qr_token', sa.String(length=255), nullable=False),
        sa.Column('token_type', sa.Enum('check_in', 'check_out', name='qrtokentype'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=True),
        sa.Column('used_by', sa.Integer(), nullable=True),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['used_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_qr_sessions_id'), 'qr_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_qr_sessions_qr_token'), 'qr_sessions', ['qr_token'], unique=True)

    op.create_table(
        'work_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('work_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.String(length=5), nullable=False),
        sa.Column('end_time', sa.String(length=5), nullable=False),
        sa.Column('allowed_late_minutes', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_work_schedules_id'), 'work_schedules', ['id'], unique=False)
    op.create_index(op.f('ix_work_schedules_work_date'), 'work_schedules', ['work_date'], unique=False)

    op.create_table(
        'attendances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('work_schedule_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('check_in_time', sa.DateTime(), nullable=True),
        sa.Column('check_out_time', sa.DateTime(), nullable=True),
        sa.Column('check_in_qr_token', sa.String(length=255), nullable=True),
        sa.Column('check_out_qr_token', sa.String(length=255), nullable=True),
        sa.Column('wifi_ssid', sa.String(length=100), nullable=True),
        sa.Column('wifi_bssid', sa.String(length=17), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('status', sa.Enum('present', 'late', 'absent', 'early_checkout', name='attendancestatus'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['work_schedule_id'], ['work_schedules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendances_date'), 'attendances', ['date'], unique=False)
    op.create_index(op.f('ix_attendances_id'), 'attendances', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_attendances_id'), table_name='attendances')
    op.drop_index(op.f('ix_attendances_date'), table_name='attendances')
    op.drop_table('attendances')
    op.drop_index(op.f('ix_work_schedules_work_date'), table_name='work_schedules')
    op.drop_index(op.f('ix_work_schedules_id'), table_name='work_schedules')
    op.drop_table('work_schedules')
    op.drop_index(op.f('ix_qr_sessions_qr_token'), table_name='qr_sessions')
    op.drop_index(op.f('ix_qr_sessions_id'), table_name='qr_sessions')
    op.drop_table('qr_sessions')
    op.drop_index(op.f('ix_wifi_configs_ssid'), table_name='wifi_configs')
    op.drop_index(op.f('ix_wifi_configs_id'), table_name='wifi_configs')
    op.drop_table('wifi_configs')
