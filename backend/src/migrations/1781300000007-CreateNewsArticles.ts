import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsArticles1781300000007 implements MigrationInterface {
  name = 'CreateNewsArticles1781300000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "news_articles" (
        "id"         SERIAL PRIMARY KEY,
        "title"      VARCHAR(500)  NOT NULL,
        "category"   VARCHAR(100)  NOT NULL DEFAULT 'Tin tức',
        "date"       VARCHAR(50)   NOT NULL,
        "author"     VARCHAR(255)  NOT NULL,
        "image"      VARCHAR(1000) NOT NULL DEFAULT '',
        "excerpt"    TEXT          NOT NULL,
        "content"    JSONB         NOT NULL DEFAULT '[]',
        "featured"   BOOLEAN       NOT NULL DEFAULT false,
        "created_at" TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP     NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "news_articles"`);
  }
}
