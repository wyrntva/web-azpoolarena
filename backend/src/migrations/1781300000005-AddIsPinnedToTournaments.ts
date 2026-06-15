import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsPinnedToTournaments1781300000005 implements MigrationInterface {
  name = 'AddIsPinnedToTournaments1781300000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournaments"
      ADD COLUMN IF NOT EXISTS "is_pinned" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournaments" DROP COLUMN IF EXISTS "is_pinned"
    `);
  }
}
