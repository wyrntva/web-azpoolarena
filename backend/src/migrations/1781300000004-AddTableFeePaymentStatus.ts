import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableFeePaymentStatus1781300000004 implements MigrationInterface {
  name = 'AddTableFeePaymentStatus1781300000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournament_table_fee_payments"
      ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'pending'
    `);
    // Sync existing rows: paid=true → 'paid', paid=false → 'pending'
    await queryRunner.query(`
      UPDATE "tournament_table_fee_payments"
      SET "status" = CASE WHEN "paid" = true THEN 'paid' ELSE 'pending' END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournament_table_fee_payments" DROP COLUMN IF EXISTS "status"
    `);
  }
}
