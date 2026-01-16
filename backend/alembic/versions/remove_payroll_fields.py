"""remove status and reason from payroll tables

Revision ID: remove_payroll_fields
Revises: add_payroll_tables
Create Date: 2026-01-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'remove_payroll_fields'
down_revision = 'add_payroll_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove status and reason from advance_payments
    op.drop_column('advance_payments', 'status')
    op.drop_column('advance_payments', 'reason')

    # Remove reason from bonuses
    op.drop_column('bonuses', 'reason')

    # Remove reason from penalties
    op.drop_column('penalties', 'reason')


def downgrade() -> None:
    # Add back reason to penalties
    op.add_column('penalties', sa.Column('reason', sa.Text(), nullable=False))

    # Add back reason to bonuses
    op.add_column('bonuses', sa.Column('reason', sa.Text(), nullable=False))

    # Add back status and reason to advance_payments
    op.add_column('advance_payments', sa.Column('reason', sa.Text(), nullable=False))
    op.add_column('advance_payments',
                  sa.Column('status',
                           sa.Enum('pending', 'approved', 'rejected',
                                  name='advancepaymentstatus'),
                           nullable=False,
                           server_default='pending'))
