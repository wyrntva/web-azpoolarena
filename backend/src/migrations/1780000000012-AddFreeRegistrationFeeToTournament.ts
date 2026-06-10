import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFreeRegistrationFeeToTournament1780000000012 implements MigrationInterface {
  name = 'AddFreeRegistrationFeeToTournament1780000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments
      ADD COLUMN IF NOT EXISTS free_registration_fee BOOLEAN DEFAULT false
    `);
    await queryRunner.query(`
      UPDATE tournaments
      SET free_registration_fee = false
      WHERE free_registration_fee IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE tournaments
      ALTER COLUMN free_registration_fee SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments
      DROP COLUMN IF EXISTS free_registration_fee
    `);
  }
}
