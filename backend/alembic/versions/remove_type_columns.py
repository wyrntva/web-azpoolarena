"""remove bonus_type and penalty_type columns

Revision ID: remove_type_columns
Revises: remove_payroll_fields
Create Date: 2026-01-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'remove_type_columns'
down_revision = 'remove_payroll_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove bonus_type from bonuses
    op.drop_column('bonuses', 'bonus_type')

    # Remove penalty_type from penalties
    op.drop_column('penalties', 'penalty_type')


def downgrade() -> None:
    # Add back penalty_type to penalties
    op.add_column('penalties',
                  sa.Column('penalty_type',
                           sa.Enum('late', 'absent', 'violation', 'other',
                                  name='penaltytype'),
                           nullable=False))

    # Add back bonus_type to bonuses
    op.add_column('bonuses',
                  sa.Column('bonus_type',
                           sa.Enum('performance', 'attendance', 'special', 'other',
                                  name='bonustype'),
                           nullable=False))
