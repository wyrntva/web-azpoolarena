import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableFeePayments1781300000003 implements MigrationInterface {
  name = 'CreateTableFeePayments1781300000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tournament_table_fee_payments" (
        "id"         SERIAL          NOT NULL,
        "code"       varchar(20)     NOT NULL,
        "match_id"   integer         NOT NULL,
        "amount"     integer         NOT NULL,
        "paid"       boolean         NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        "paid_at"    TIMESTAMPTZ,
        CONSTRAINT "PK_tournament_table_fee_payments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tournament_table_fee_payments_code" UNIQUE ("code")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "tournament_table_fee_payments"`,
    );
  }
}
