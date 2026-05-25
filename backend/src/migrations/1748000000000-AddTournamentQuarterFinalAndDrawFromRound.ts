import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTournamentQuarterFinalAndDrawFromRound1748000000000 implements MigrationInterface {
  name = 'AddTournamentQuarterFinalAndDrawFromRound1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "quarter_final" varchar(50) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "draw_from_round" varchar(50) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournaments" DROP COLUMN IF EXISTS "draw_from_round"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" DROP COLUMN IF EXISTS "quarter_final"`,
    );
  }
}
