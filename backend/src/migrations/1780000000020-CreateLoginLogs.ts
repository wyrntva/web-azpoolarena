import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoginLogs1780000000020 implements MigrationInterface {
  name = 'CreateLoginLogs1780000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "login_logs" (
        "id"           SERIAL          NOT NULL,
        "user_id"      integer         NOT NULL,
        "login_at"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        "ip_address"   VARCHAR(45),
        "user_agent"   TEXT,
        CONSTRAINT "PK_login_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_login_logs_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_login_logs_user_id"  ON "login_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_login_logs_login_at" ON "login_logs" ("login_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "login_logs"`);
  }
}
