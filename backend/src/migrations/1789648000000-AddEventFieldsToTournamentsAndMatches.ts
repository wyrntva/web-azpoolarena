import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventFieldsToTournamentsAndMatches1789648000000
  implements MigrationInterface
{
  name = 'AddEventFieldsToTournamentsAndMatches1789648000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournaments"
      ADD COLUMN IF NOT EXISTS "category" varchar(50) DEFAULT 'tournament',
      ADD COLUMN IF NOT EXISTS "end_date" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "match_creation_time" time NULL,
      ADD COLUMN IF NOT EXISTS "match_creation_time_end" time NULL,
      ADD COLUMN IF NOT EXISTS "draw_touch_11" varchar(50) NULL,
      ADD COLUMN IF NOT EXISTS "bonus" varchar(255) NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "tournament_matches"
      ADD COLUMN IF NOT EXISTS "match_end_time" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "race_to" int NULL,
      ADD COLUMN IF NOT EXISTS "handicap_desc" varchar(255) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournament_matches"
      DROP COLUMN IF EXISTS "handicap_desc",
      DROP COLUMN IF EXISTS "race_to",
      DROP COLUMN IF EXISTS "match_end_time";
    `);

    await queryRunner.query(`
      ALTER TABLE "tournaments"
      DROP COLUMN IF EXISTS "bonus",
      DROP COLUMN IF EXISTS "draw_touch_11",
      DROP COLUMN IF EXISTS "match_creation_time_end",
      DROP COLUMN IF EXISTS "match_creation_time",
      DROP COLUMN IF EXISTS "end_date",
      DROP COLUMN IF EXISTS "category";
    `);
  }
}
