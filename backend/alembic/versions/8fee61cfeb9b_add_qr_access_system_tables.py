"""add_qr_access_system_tables

Revision ID: 8fee61cfeb9b
Revises: b02989e39948
Create Date: 2026-01-12 11:38:20.197193

"""
from alembic import op
import sqlalchemy as sa


revision = '8fee61cfeb9b'
down_revision = 'b02989e39948'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create qr_access_devices table
    op.create_table(
        'qr_access_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.String(length=100), nullable=False),
        sa.Column('device_name', sa.String(length=200), nullable=False),
        sa.Column('api_key_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_id')
    )
    op.create_index('ix_qr_access_devices_device_id', 'qr_access_devices', ['device_id'])

    # Create qr_access_tokens table
    op.create_table(
        'qr_access_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('access_token', sa.String(length=255), nullable=False),
        sa.Column('device_id', sa.String(length=100), nullable=False),
        sa.Column('purpose', sa.String(length=50), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('used_by_pin', sa.String(length=4), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['device_id'], ['qr_access_devices.device_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('access_token')
    )
    op.create_index('ix_qr_access_tokens_access_token', 'qr_access_tokens', ['access_token'])
    op.create_index('ix_qr_access_tokens_expires_at', 'qr_access_tokens', ['expires_at'])
    op.create_index('ix_qr_access_tokens_is_used', 'qr_access_tokens', ['is_used'])


def downgrade() -> None:
    op.drop_index('ix_qr_access_tokens_is_used', table_name='qr_access_tokens')
    op.drop_index('ix_qr_access_tokens_expires_at', table_name='qr_access_tokens')
    op.drop_index('ix_qr_access_tokens_access_token', table_name='qr_access_tokens')
    op.drop_table('qr_access_tokens')

    op.drop_index('ix_qr_access_devices_device_id', table_name='qr_access_devices')
    op.drop_table('qr_access_devices')
