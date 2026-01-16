"""Add payroll tables

Revision ID: add_payroll_tables
Revises: 8fee61cfeb9b
Create Date: 2026-01-13 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_payroll_tables'
down_revision = '8fee61cfeb9b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create advance_payments table
    op.create_table('advance_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='advancepaymentstatus'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_advance_payments_date'), 'advance_payments', ['date'], unique=False)
    op.create_index(op.f('ix_advance_payments_id'), 'advance_payments', ['id'], unique=False)

    # Create bonuses table
    op.create_table('bonuses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('bonus_type', sa.Enum('performance', 'attendance', 'special', 'other', name='bonustype'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bonuses_date'), 'bonuses', ['date'], unique=False)
    op.create_index(op.f('ix_bonuses_id'), 'bonuses', ['id'], unique=False)

    # Create penalties table
    op.create_table('penalties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('penalty_type', sa.Enum('late', 'absent', 'violation', 'other', name='penaltytype'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_penalties_date'), 'penalties', ['date'], unique=False)
    op.create_index(op.f('ix_penalties_id'), 'penalties', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_penalties_id'), table_name='penalties')
    op.drop_index(op.f('ix_penalties_date'), table_name='penalties')
    op.drop_table('penalties')

    op.drop_index(op.f('ix_bonuses_id'), table_name='bonuses')
    op.drop_index(op.f('ix_bonuses_date'), table_name='bonuses')
    op.drop_table('bonuses')

    op.drop_index(op.f('ix_advance_payments_id'), table_name='advance_payments')
    op.drop_index(op.f('ix_advance_payments_date'), table_name='advance_payments')
    op.drop_table('advance_payments')
