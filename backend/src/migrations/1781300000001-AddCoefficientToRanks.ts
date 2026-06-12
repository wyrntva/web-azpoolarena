import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoefficientToRanks1781300000001 implements MigrationInterface {
  name = 'AddCoefficientToRanks1781300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournament_ranks"
      ADD COLUMN IF NOT EXISTS "coefficient" double precision NOT NULL DEFAULT 1.0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournament_ranks" DROP COLUMN IF EXISTS "coefficient"
    `);
  }
}
