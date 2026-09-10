import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBirthdayToUsers1787730000000 implements MigrationInterface {
  name = 'AddBirthdayToUsers1787730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "birthday" date
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "birthday"
    `);
  }
}
