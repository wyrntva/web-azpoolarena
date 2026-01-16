"""update_inventory_with_units

Revision ID: update_inventory_units
Revises: 647fe22b76b0
Create Date: 2026-01-05 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'update_inventory_units'
down_revision = '647fe22b76b0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create units table
    op.create_table(
        'units',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_units_id'), 'units', ['id'], unique=False)
    op.create_index(op.f('ix_units_name'), 'units', ['name'], unique=True)

    # Create inventory_transactions table
    op.create_table(
        'inventory_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('transaction_type', sa.Enum('in', 'out', name='transactiontype'), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_transactions_id'), 'inventory_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_transactions_transaction_date'), 'inventory_transactions', ['transaction_date'], unique=False)

    # Drop old columns from inventories
    op.drop_column('inventories', 'unit')
    op.drop_column('inventories', 'note')

    # Add new columns to inventories
    op.add_column('inventories', sa.Column('base_unit_id', sa.Integer(), nullable=True))
    op.add_column('inventories', sa.Column('conversion_unit_id', sa.Integer(), nullable=True))
    op.add_column('inventories', sa.Column('conversion_rate', sa.Integer(), nullable=True))

    # Create foreign keys
    op.create_foreign_key('fk_inventories_base_unit', 'inventories', 'units', ['base_unit_id'], ['id'])
    op.create_foreign_key('fk_inventories_conversion_unit', 'inventories', 'units', ['conversion_unit_id'], ['id'])

    # Create inventory_transaction_details table
    op.create_table(
        'inventory_transaction_details',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('inventory_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_type', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['transaction_id'], ['inventory_transactions.id'], ),
        sa.ForeignKeyConstraint(['inventory_id'], ['inventories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_transaction_details_id'), 'inventory_transaction_details', ['id'], unique=False)


def downgrade() -> None:
    # Drop inventory_transaction_details
    op.drop_index(op.f('ix_inventory_transaction_details_id'), table_name='inventory_transaction_details')
    op.drop_table('inventory_transaction_details')

    # Drop foreign keys from inventories
    op.drop_constraint('fk_inventories_conversion_unit', 'inventories', type_='foreignkey')
    op.drop_constraint('fk_inventories_base_unit', 'inventories', type_='foreignkey')

    # Remove new columns from inventories
    op.drop_column('inventories', 'conversion_rate')
    op.drop_column('inventories', 'conversion_unit_id')
    op.drop_column('inventories', 'base_unit_id')

    # Add back old columns
    op.add_column('inventories', sa.Column('note', sa.Text(), nullable=True))
    op.add_column('inventories', sa.Column('unit', sa.String(length=50), nullable=False))

    # Drop inventory_transactions
    op.drop_index(op.f('ix_inventory_transactions_transaction_date'), table_name='inventory_transactions')
    op.drop_index(op.f('ix_inventory_transactions_id'), table_name='inventory_transactions')
    op.drop_table('inventory_transactions')

    # Drop units table
    op.drop_index(op.f('ix_units_name'), table_name='units')
    op.drop_index(op.f('ix_units_id'), table_name='units')
    op.drop_table('units')
