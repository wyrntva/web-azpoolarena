import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoefficientsTable1781300000002 implements MigrationInterface {
  name = 'CreateCoefficientsTable1781300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove misplaced coefficient column from tournament_ranks
    await queryRunner.query(`
      ALTER TABLE "tournament_ranks" DROP COLUMN IF EXISTS "coefficient"
    `);

    // Create tournament_coefficients table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tournament_coefficients" (
        "id"          SERIAL          NOT NULL,
        "order"       integer         NOT NULL DEFAULT 0,
        "name"        varchar(100)    NOT NULL,
        "value"       double precision NOT NULL DEFAULT 1.0,
        "description" varchar(255),
        "created_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_tournament_coefficients" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tournament_coefficients"`);
    await queryRunner.query(`
      ALTER TABLE "tournament_ranks"
      ADD COLUMN IF NOT EXISTS "coefficient" double precision NOT NULL DEFAULT 1.0
    `);
  }
}
