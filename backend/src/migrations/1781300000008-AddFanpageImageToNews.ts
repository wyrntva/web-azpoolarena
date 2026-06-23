import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFanpageImageToNews1781300000008 implements MigrationInterface {
  name = 'AddFanpageImageToNews1781300000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "news_articles"
      ADD COLUMN IF NOT EXISTS "fanpage_image" VARCHAR(1000) NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "news_articles" DROP COLUMN IF EXISTS "fanpage_image"
    `);
  }
}
