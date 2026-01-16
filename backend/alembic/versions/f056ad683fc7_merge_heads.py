"""merge_heads

Revision ID: f056ad683fc7
Revises: update_inventory_units, eca533408d7f
Create Date: 2026-01-06 14:13:30.427685

"""
from alembic import op
import sqlalchemy as sa


revision = 'f056ad683fc7'
down_revision = ('update_inventory_units', 'eca533408d7f')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
