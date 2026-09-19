import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEventPointsToNumeric1789800000000
  implements MigrationInterface
{
  name = 'UpdateEventPointsToNumeric1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournament_matches"
      ALTER COLUMN "player1_points" TYPE numeric(10, 2),
      ALTER COLUMN "player2_points" TYPE numeric(10, 2);
    `);

    await queryRunner.query(`
      ALTER TABLE "tournament_registrations"
      ALTER COLUMN "points" TYPE numeric(10, 2);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tournament_registrations"
      ALTER COLUMN "points" TYPE int;
    `);

    await queryRunner.query(`
      ALTER TABLE "tournament_matches"
      ALTER COLUMN "player1_points" TYPE int,
      ALTER COLUMN "player2_points" TYPE int;
    `);
  }
}
