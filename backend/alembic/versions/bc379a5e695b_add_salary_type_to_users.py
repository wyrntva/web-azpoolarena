"""add_salary_type_to_users

Revision ID: bc379a5e695b
Revises: remove_type_columns
Create Date: 2026-01-13 17:18:56.058378

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = 'bc379a5e695b'
down_revision = 'remove_type_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for salary_type
    salary_type_enum = postgresql.ENUM('hourly', 'fixed', name='salarytype', create_type=False)
    salary_type_enum.create(op.get_bind(), checkfirst=True)

    # Add salary_type column with default 'hourly'
    op.add_column('users', sa.Column('salary_type',
                                      sa.Enum('hourly', 'fixed', name='salarytype', native_enum=True),
                                      nullable=False,
                                      server_default='hourly'))

    # Add fixed_salary column (nullable)
    op.add_column('users', sa.Column('fixed_salary', sa.Float(), nullable=True))


def downgrade() -> None:
    # Drop columns
    op.drop_column('users', 'fixed_salary')
    op.drop_column('users', 'salary_type')

    # Drop enum type
    salary_type_enum = postgresql.ENUM('hourly', 'fixed', name='salarytype')
    salary_type_enum.drop(op.get_bind(), checkfirst=True)
