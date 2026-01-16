"""update_inventory_add_units_and_transactions

Revision ID: eca533408d7f
Revises: 647fe22b76b0
Create Date: 2026-01-05 22:01:57.638474

"""
from alembic import op
import sqlalchemy as sa


revision = 'eca533408d7f'
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
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_units_id'), 'units', ['id'], unique=False)
    op.create_index(op.f('ix_units_name'), 'units', ['name'], unique=True)

    # Drop old inventories table
    op.drop_index('ix_inventories_product_name', table_name='inventories')
    op.drop_index('ix_inventories_id', table_name='inventories')
    op.drop_table('inventories')

    # Recreate inventories table with new structure
    inventory_status_enum = sa.Enum('in_stock', 'out_of_stock', 'low_stock', name='inventorystatus', create_type=False)
    op.create_table(
        'inventories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_name', sa.String(length=200), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('min_quantity', sa.Integer(), nullable=False),
        sa.Column('base_unit_id', sa.Integer(), nullable=False),
        sa.Column('conversion_unit_id', sa.Integer(), nullable=True),
        sa.Column('conversion_rate', sa.Integer(), nullable=True),
        sa.Column('status', inventory_status_enum, nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['base_unit_id'], ['units.id'], ),
        sa.ForeignKeyConstraint(['conversion_unit_id'], ['units.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventories_id'), 'inventories', ['id'], unique=False)
    op.create_index(op.f('ix_inventories_product_name'), 'inventories', ['product_name'], unique=False)

    # Create inventory_transactions table
    transaction_type_enum = sa.Enum('in', 'out', name='transactiontype')
    transaction_type_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        'inventory_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('transaction_type', transaction_type_enum, nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_transactions_id'), 'inventory_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_transactions_transaction_date'), 'inventory_transactions', ['transaction_date'], unique=False)

    # Create inventory_transaction_details table
    op.create_table(
        'inventory_transaction_details',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('inventory_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_type', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['inventory_id'], ['inventories.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['inventory_transactions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_transaction_details_id'), 'inventory_transaction_details', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_inventory_transaction_details_id'), table_name='inventory_transaction_details')
    op.drop_table('inventory_transaction_details')
    op.drop_index(op.f('ix_inventory_transactions_transaction_date'), table_name='inventory_transactions')
    op.drop_index(op.f('ix_inventory_transactions_id'), table_name='inventory_transactions')
    op.drop_table('inventory_transactions')
    op.drop_index(op.f('ix_inventories_product_name'), table_name='inventories')
    op.drop_index(op.f('ix_inventories_id'), table_name='inventories')
    op.drop_table('inventories')
    op.drop_index(op.f('ix_units_name'), table_name='units')
    op.drop_index(op.f('ix_units_id'), table_name='units')
    op.drop_table('units')
