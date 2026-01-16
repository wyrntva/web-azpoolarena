"""add_performance_indexes

Revision ID: b02989e39948
Revises: 8f1988d18542
Create Date: 2026-01-12 11:19:36.583418

"""
from alembic import op
import sqlalchemy as sa


revision = 'b02989e39948'
down_revision = '8f1988d18542'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Composite indexes for attendance queries
    op.create_index(
        'idx_attendances_user_date',
        'attendances',
        ['user_id', 'date'],
        unique=False
    )

    # Composite indexes for receipts queries
    op.create_index(
        'idx_receipts_date_income',
        'receipts',
        ['receipt_date', 'is_income'],
        unique=False
    )

    # Composite indexes for inventory queries
    op.create_index(
        'idx_inventories_category_status',
        'inventories',
        ['category_id', 'status'],
        unique=False
    )

    # Composite indexes for work schedules
    op.create_index(
        'idx_work_schedules_user_date',
        'work_schedules',
        ['user_id', 'work_date'],
        unique=False
    )

    # Index for inventory transactions by date
    op.create_index(
        'idx_inventory_transactions_date_type',
        'inventory_transactions',
        ['transaction_date', 'transaction_type'],
        unique=False
    )

    # Index for revenues by date (already unique but explicit index helps)
    # Revenue already has unique constraint on revenue_date, so no need for additional index

    # Index for debts by paid status and date
    op.create_index(
        'idx_debts_paid_date',
        'debts',
        ['is_paid', 'debt_date'],
        unique=False
    )


def downgrade() -> None:
    # Drop indexes in reverse order
    op.drop_index('idx_debts_paid_date', table_name='debts')
    op.drop_index('idx_inventory_transactions_date_type', table_name='inventory_transactions')
    op.drop_index('idx_work_schedules_user_date', table_name='work_schedules')
    op.drop_index('idx_inventories_category_status', table_name='inventories')
    op.drop_index('idx_receipts_date_income', table_name='receipts')
    op.drop_index('idx_attendances_user_date', table_name='attendances')
