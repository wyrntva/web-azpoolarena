import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDetailLogoToTournament1780000000002 implements MigrationInterface {
  name = 'AddDetailLogoToTournament1780000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments
      ADD COLUMN IF NOT EXISTS detail_logo VARCHAR(500) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments
      DROP COLUMN IF EXISTS detail_logo
    `);
  }
}
