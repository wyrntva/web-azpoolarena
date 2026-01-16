"""convert_penalty_tiers_to_json

Revision ID: 4f95b34bb36f
Revises: 8d3b456c04e0
Create Date: 2026-01-13 21:23:27.018847

"""
from alembic import op
import sqlalchemy as sa
import json


revision = '4f95b34bb36f'
down_revision = '8d3b456c04e0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Add new penalty_tiers column (Text/JSON)
    op.add_column('attendance_settings', sa.Column('penalty_tiers', sa.Text(), nullable=True))

    # Step 2: Migrate existing data from tier columns to JSON
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT id, tier1_max_minutes, tier1_penalty, tier2_max_minutes, tier2_penalty, tier3_max_minutes, tier3_penalty, tier4_penalty FROM attendance_settings"))

    for row in result:
        penalty_tiers_json = json.dumps([
            {"max_minutes": row[1], "penalty_amount": row[2]},  # tier1
            {"max_minutes": row[3], "penalty_amount": row[4]},  # tier2
            {"max_minutes": row[5], "penalty_amount": row[6]},  # tier3
            {"max_minutes": None, "penalty_amount": row[7]}     # tier4 (no max)
        ])

        connection.execute(
            sa.text("UPDATE attendance_settings SET penalty_tiers = :tiers WHERE id = :id"),
            {"tiers": penalty_tiers_json, "id": row[0]}
        )

    # Step 3: Make penalty_tiers NOT NULL after data migration
    op.alter_column('attendance_settings', 'penalty_tiers', nullable=False)

    # Step 4: Drop old tier columns
    op.drop_column('attendance_settings', 'tier1_max_minutes')
    op.drop_column('attendance_settings', 'tier1_penalty')
    op.drop_column('attendance_settings', 'tier2_max_minutes')
    op.drop_column('attendance_settings', 'tier2_penalty')
    op.drop_column('attendance_settings', 'tier3_max_minutes')
    op.drop_column('attendance_settings', 'tier3_penalty')
    op.drop_column('attendance_settings', 'tier4_penalty')


def downgrade() -> None:
    # Step 1: Add back old tier columns
    op.add_column('attendance_settings', sa.Column('tier1_max_minutes', sa.Integer(), nullable=True, server_default='15'))
    op.add_column('attendance_settings', sa.Column('tier1_penalty', sa.Float(), nullable=True, server_default='0'))
    op.add_column('attendance_settings', sa.Column('tier2_max_minutes', sa.Integer(), nullable=True, server_default='30'))
    op.add_column('attendance_settings', sa.Column('tier2_penalty', sa.Float(), nullable=True, server_default='50000'))
    op.add_column('attendance_settings', sa.Column('tier3_max_minutes', sa.Integer(), nullable=True, server_default='60'))
    op.add_column('attendance_settings', sa.Column('tier3_penalty', sa.Float(), nullable=True, server_default='100000'))
    op.add_column('attendance_settings', sa.Column('tier4_penalty', sa.Float(), nullable=True, server_default='200000'))

    # Step 2: Migrate JSON data back to tier columns
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT id, penalty_tiers FROM attendance_settings"))

    for row in result:
        tiers = json.loads(row[1])

        # Safely extract tier values (handle cases with different number of tiers)
        tier1_max = tiers[0]["max_minutes"] if len(tiers) > 0 else 15
        tier1_penalty = tiers[0]["penalty_amount"] if len(tiers) > 0 else 0
        tier2_max = tiers[1]["max_minutes"] if len(tiers) > 1 else 30
        tier2_penalty = tiers[1]["penalty_amount"] if len(tiers) > 1 else 50000
        tier3_max = tiers[2]["max_minutes"] if len(tiers) > 2 else 60
        tier3_penalty = tiers[2]["penalty_amount"] if len(tiers) > 2 else 100000
        tier4_penalty = tiers[3]["penalty_amount"] if len(tiers) > 3 else 200000

        connection.execute(
            sa.text("""UPDATE attendance_settings
                      SET tier1_max_minutes = :t1_max, tier1_penalty = :t1_pen,
                          tier2_max_minutes = :t2_max, tier2_penalty = :t2_pen,
                          tier3_max_minutes = :t3_max, tier3_penalty = :t3_pen,
                          tier4_penalty = :t4_pen
                      WHERE id = :id"""),
            {
                "t1_max": tier1_max, "t1_pen": tier1_penalty,
                "t2_max": tier2_max, "t2_pen": tier2_penalty,
                "t3_max": tier3_max, "t3_pen": tier3_penalty,
                "t4_pen": tier4_penalty,
                "id": row[0]
            }
        )

    # Step 3: Make old columns NOT NULL
    op.alter_column('attendance_settings', 'tier1_max_minutes', nullable=False)
    op.alter_column('attendance_settings', 'tier1_penalty', nullable=False)
    op.alter_column('attendance_settings', 'tier2_max_minutes', nullable=False)
    op.alter_column('attendance_settings', 'tier2_penalty', nullable=False)
    op.alter_column('attendance_settings', 'tier3_max_minutes', nullable=False)
    op.alter_column('attendance_settings', 'tier3_penalty', nullable=False)
    op.alter_column('attendance_settings', 'tier4_penalty', nullable=False)

    # Step 4: Drop penalty_tiers column
    op.drop_column('attendance_settings', 'penalty_tiers')
