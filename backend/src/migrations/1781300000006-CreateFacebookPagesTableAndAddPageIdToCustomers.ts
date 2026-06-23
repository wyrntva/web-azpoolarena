import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFacebookPagesTableAndAddPageIdToCustomers1781300000006 implements MigrationInterface {
  name = 'CreateFacebookPagesTableAndAddPageIdToCustomers1781300000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tạo bảng fb_pages
    await queryRunner.query(`
      CREATE TABLE "fb_pages" (
        "id"           VARCHAR(100)  NOT NULL,
        "name"         VARCHAR(255)  NOT NULL,
        "access_token" TEXT          NOT NULL,
        "is_active"    BOOLEAN       NOT NULL DEFAULT true,
        "created_at"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fb_pages" PRIMARY KEY ("id")
      )
    `);

    // 2. Thêm cột page_id vào bảng fb_customers
    await queryRunner.query(`
      ALTER TABLE "fb_customers" ADD COLUMN "page_id" VARCHAR(100)
    `);

    // 3. Cập nhật các dòng dữ liệu cũ nếu có
    // Chúng ta sẽ đặt giá trị mặc định là 'default' hoặc chuỗi rỗng để không bị null
    await queryRunner.query(`
      UPDATE "fb_customers" SET "page_id" = 'default' WHERE "page_id" IS NULL
    `);

    // 4. Thay đổi cột page_id thành NOT NULL
    await queryRunner.query(`
      ALTER TABLE "fb_customers" ALTER COLUMN "page_id" SET NOT NULL
    `);

    // 5. Thay đổi index và unique constraint trên fb_customers
    // Xóa unique constraint và index cũ
    await queryRunner.query(`
      ALTER TABLE "fb_customers" DROP CONSTRAINT IF EXISTS "UQ_fb_customers_psid"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_fb_customers_psid"
    `);

    // Tạo unique index mới trên (psid, page_id)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_fb_customers_psid_page_id" ON "fb_customers" ("psid", "page_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Hoàn tác
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_fb_customers_psid_page_id"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_fb_customers_psid" ON "fb_customers" ("psid")
    `);

    await queryRunner.query(`
      ALTER TABLE "fb_customers" ADD CONSTRAINT "UQ_fb_customers_psid" UNIQUE ("psid")
    `);

    await queryRunner.query(`
      ALTER TABLE "fb_customers" DROP COLUMN IF EXISTS "page_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "fb_pages"
    `);
  }
}
