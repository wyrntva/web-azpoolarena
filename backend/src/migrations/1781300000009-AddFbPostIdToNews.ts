import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFbPostIdToNews1781300000009 implements MigrationInterface {
  name = 'AddFbPostIdToNews1781300000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "news_articles"
      ADD COLUMN IF NOT EXISTS "fb_post_id" VARCHAR(255) DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "news_articles" DROP COLUMN IF EXISTS "fb_post_id"
    `);
  }
}
