import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiConversations1780000000010 implements MigrationInterface {
  name = 'CreateAiConversations1780000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_conversations" (
        "id"                UUID          NOT NULL DEFAULT gen_random_uuid(),
        "session_id"        VARCHAR(100)  NOT NULL,
        "role"              VARCHAR(20)   NOT NULL,
        "content"           TEXT          NOT NULL,
        "model"             VARCHAR(50),
        "tokens_used"       INTEGER       NOT NULL DEFAULT 0,
        "conversation_type" VARCHAR(20)   NOT NULL DEFAULT 'staff',
        "created_at"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_conversations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_conversations_session_id"
        ON "ai_conversations" ("session_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_conversations_conversation_type"
        ON "ai_conversations" ("conversation_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_conversations_created_at"
        ON "ai_conversations" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ai_conversations_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ai_conversations_conversation_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ai_conversations_session_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_conversations"`);
  }
}
