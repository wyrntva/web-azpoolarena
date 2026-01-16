"""add_ip_subnet_to_wifi_configs

Revision ID: 8f1988d18542
Revises: 954b5f682415
Create Date: 2026-01-07 12:04:32.891175

"""
from alembic import op
import sqlalchemy as sa


revision = '8f1988d18542'
down_revision = '954b5f682415'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Thêm trường ip_subnet vào bảng wifi_configs
    op.add_column('wifi_configs', sa.Column('ip_subnet', sa.String(length=32), nullable=True))

    # Thêm index cho trường ip_subnet để tăng performance khi query
    op.create_index(op.f('ix_wifi_configs_ip_subnet'), 'wifi_configs', ['ip_subnet'], unique=False)


def downgrade() -> None:
    # Xóa index trước
    op.drop_index(op.f('ix_wifi_configs_ip_subnet'), table_name='wifi_configs')

    # Sau đó xóa column
    op.drop_column('wifi_configs', 'ip_subnet')
