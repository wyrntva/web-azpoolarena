import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFacebookTables1780000000011 implements MigrationInterface {
  name = 'CreateFacebookTables1780000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(`
      CREATE TYPE "conversation_status_enum" AS ENUM (
        'active',
        'human_support',
        'resolved'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "message_role_enum" AS ENUM ('user', 'assistant')
    `);

    await queryRunner.query(`
      CREATE TYPE "message_source_enum" AS ENUM ('ai', 'human')
    `);

    // Bảng khách hàng Facebook
    await queryRunner.query(`
      CREATE TABLE "fb_customers" (
        "id"                   SERIAL        NOT NULL,
        "psid"                 VARCHAR(100)  NOT NULL,
        "name"                 VARCHAR(255),
        "profile_pic"          VARCHAR(500),
        "conversation_status"  conversation_status_enum NOT NULL DEFAULT 'active',
        "assigned_staff"       VARCHAR(100),
        "created_at"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fb_customers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fb_customers_psid" UNIQUE ("psid")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_fb_customers_psid" ON "fb_customers" ("psid")
    `);

    // Bảng tin nhắn
    await queryRunner.query(`
      CREATE TABLE "fb_messages" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "customer_id"      INTEGER       NOT NULL,
        "role"             message_role_enum NOT NULL,
        "content"          TEXT          NOT NULL,
        "source"           message_source_enum DEFAULT 'ai',
        "model"            VARCHAR(50),
        "tokens_used"      INTEGER       NOT NULL DEFAULT 0,
        "estimated_cost"   DECIMAL(10,8) NOT NULL DEFAULT 0,
        "response_time_ms" INTEGER       NOT NULL DEFAULT 0,
        "created_at"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fb_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fb_messages_customer" FOREIGN KEY ("customer_id")
          REFERENCES "fb_customers" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_fb_messages_customer_id" ON "fb_messages" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_fb_messages_created_at" ON "fb_messages" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fb_messages_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fb_messages_customer_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fb_messages"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fb_customers_psid"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fb_customers"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "message_source_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "message_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conversation_status_enum"`);
  }
}
