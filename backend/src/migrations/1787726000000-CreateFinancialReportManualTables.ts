import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinancialReportManualTables1787726000000
  implements MigrationInterface
{
  name = 'CreateFinancialReportManualTables1787726000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_report_manuals" (
        "id"             SERIAL PRIMARY KEY,
        "report_date"    DATE NOT NULL UNIQUE,
        "cash_income"    FLOAT NOT NULL DEFAULT 0,
        "cash_expense"   FLOAT NOT NULL DEFAULT 0,
        "bank_exchange"  FLOAT NOT NULL DEFAULT 0,
        "bank_income"    FLOAT NOT NULL DEFAULT 0,
        "bank_expense"   FLOAT NOT NULL DEFAULT 0,
        "system_revenue" FLOAT NOT NULL DEFAULT 0,
        "note"           TEXT NULL,
        "created_at"     TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "monthly_financial_reports" (
        "id"                      SERIAL PRIMARY KEY,
        "month"                   VARCHAR(7) NOT NULL UNIQUE,
        "salary"                  FLOAT NOT NULL DEFAULT 0,
        "fixed_cost"              FLOAT NOT NULL DEFAULT 0,
        "premises"                FLOAT NOT NULL DEFAULT 0,
        "prev_month_cash_balance" FLOAT NOT NULL DEFAULT 0,
        "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "monthly_financial_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_report_manuals"`);
  }
}
