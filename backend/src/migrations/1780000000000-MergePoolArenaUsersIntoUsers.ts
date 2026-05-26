import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergePoolArenaUsersIntoUsers1780000000000
  implements MigrationInterface
{
  name = 'MergePoolArenaUsersIntoUsers1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Thêm cột user_type vào users
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "user_type" varchar(10) NOT NULL DEFAULT 'staff',
        ADD COLUMN IF NOT EXISTS "phone_number" varchar(20),
        ADD COLUMN IF NOT EXISTS "gender" varchar(10),
        ADD COLUMN IF NOT EXISTS "address" varchar(255),
        ADD COLUMN IF NOT EXISTS "rank" varchar(10),
        ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500),
        ADD COLUMN IF NOT EXISTS "is_phone_verified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "is_email_verified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "points" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "tiktok_url" varchar(500),
        ADD COLUMN IF NOT EXISTS "facebook_url" varchar(500),
        ADD COLUMN IF NOT EXISTS "instagram_url" varchar(500),
        ADD COLUMN IF NOT EXISTS "total_games" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "wins" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "losses" integer NOT NULL DEFAULT 0
    `);

    // 2. Cho phép role_id và username là NULL (player không có những field này)
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL
    `);

    // 3. Thêm unique constraint cho phone_number
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "users_phone_number_key" UNIQUE ("phone_number")
    `);

    // 4. Drop FK constraints trỏ vào pool_arena_users (cả 2 bộ tên: custom và TypeORM auto-generated)
    await queryRunner.query(`
      ALTER TABLE "tournament_registrations"
        DROP CONSTRAINT IF EXISTS "tournament_registrations_user_id_fkey",
        DROP CONSTRAINT IF EXISTS "FK_ca269aa26624da44fe02ec20f83"
    `);
    await queryRunner.query(`
      ALTER TABLE "tournament_matches"
        DROP CONSTRAINT IF EXISTS "tournament_matches_player1_id_fkey",
        DROP CONSTRAINT IF EXISTS "tournament_matches_player2_id_fkey",
        DROP CONSTRAINT IF EXISTS "tournament_matches_winner_id_fkey",
        DROP CONSTRAINT IF EXISTS "FK_b861c4e658ead3ad35a8f54448b",
        DROP CONSTRAINT IF EXISTS "FK_0cbf67b46121b71e3a94c8b0e30",
        DROP CONSTRAINT IF EXISTS "FK_b674515b15e7f92e72a77a30bac"
    `);

    // 5. Tạo bảng tạm lưu mapping old_id → new_id
    await queryRunner.query(`
      CREATE TEMP TABLE pool_arena_user_id_map (
        old_id INTEGER,
        new_id INTEGER
      )
    `);

    // 6. Insert từng player từ pool_arena_users vào users (PG tự tạo ID mới)
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_user_id INTEGER;
      BEGIN
        FOR rec IN SELECT * FROM pool_arena_users LOOP
          INSERT INTO users (
            user_type,
            full_name,
            email,
            phone_number,
            hashed_password,
            gender,
            address,
            rank,
            avatar_url,
            is_active,
            is_phone_verified,
            is_email_verified,
            points,
            tiktok_url,
            facebook_url,
            instagram_url,
            total_games,
            wins,
            losses,
            created_at,
            updated_at
          ) VALUES (
            'player',
            rec.full_name,
            rec.email,
            rec.phone_number,
            rec.hashed_password,
            rec.gender::varchar,
            rec.address,
            rec.rank,
            rec.avatar_url,
            rec.is_active,
            rec.is_phone_verified,
            rec.is_email_verified,
            rec.points,
            rec.tiktok_url,
            rec.facebook_url,
            rec.instagram_url,
            rec.total_games,
            rec.wins,
            rec.losses,
            rec.created_at,
            rec.updated_at
          )
          RETURNING id INTO new_user_id;

          INSERT INTO pool_arena_user_id_map (old_id, new_id)
          VALUES (rec.id, new_user_id);
        END LOOP;
      END $$;
    `);

    // 7. Cập nhật FK trong tournament_registrations
    await queryRunner.query(`
      UPDATE tournament_registrations tr
      SET user_id = m.new_id
      FROM pool_arena_user_id_map m
      WHERE tr.user_id = m.old_id
    `);

    // 8. Cập nhật FK trong tournament_matches
    await queryRunner.query(`
      UPDATE tournament_matches tm
      SET player1_id = m.new_id
      FROM pool_arena_user_id_map m
      WHERE tm.player1_id = m.old_id
    `);
    await queryRunner.query(`
      UPDATE tournament_matches tm
      SET player2_id = m.new_id
      FROM pool_arena_user_id_map m
      WHERE tm.player2_id = m.old_id
    `);
    await queryRunner.query(`
      UPDATE tournament_matches tm
      SET winner_id = m.new_id
      FROM pool_arena_user_id_map m
      WHERE tm.winner_id = m.old_id
    `);

    // 9. Reset sequence để tránh conflict ID
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"users"', 'id'), (SELECT MAX(id) FROM users))
    `);

    // 10. Thêm lại FK constraints trỏ vào bảng users
    await queryRunner.query(`
      ALTER TABLE "tournament_registrations"
        ADD CONSTRAINT "tournament_registrations_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "tournament_matches"
        ADD CONSTRAINT "tournament_matches_player1_id_fkey"
        FOREIGN KEY ("player1_id") REFERENCES "users"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "tournament_matches_player2_id_fkey"
        FOREIGN KEY ("player2_id") REFERENCES "users"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "tournament_matches_winner_id_fkey"
        FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // 11. Xóa bảng cũ
    await queryRunner.query(`DROP TABLE IF EXISTS "pool_arena_users"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Khôi phục lại pool_arena_users từ users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pool_arena_users" (
        id SERIAL PRIMARY KEY,
        full_name varchar(100) NOT NULL,
        gender varchar(10),
        address varchar(255),
        rank varchar(10),
        phone_number varchar(20) UNIQUE NOT NULL,
        email varchar(100) UNIQUE,
        avatar_url varchar(500),
        hashed_password varchar(255) NOT NULL,
        role varchar(50) NOT NULL DEFAULT 'player',
        is_active boolean NOT NULL DEFAULT true,
        is_phone_verified boolean NOT NULL DEFAULT false,
        is_email_verified boolean NOT NULL DEFAULT false,
        points integer NOT NULL DEFAULT 0,
        tiktok_url varchar(500),
        facebook_url varchar(500),
        instagram_url varchar(500),
        total_games integer NOT NULL DEFAULT 0,
        wins integer NOT NULL DEFAULT 0,
        losses integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      INSERT INTO pool_arena_users (
        full_name, gender, address, rank, phone_number, email,
        avatar_url, hashed_password, is_active, is_phone_verified,
        is_email_verified, points, tiktok_url, facebook_url,
        instagram_url, total_games, wins, losses, created_at, updated_at
      )
      SELECT
        full_name, gender, address, rank, phone_number, email,
        avatar_url, hashed_password, is_active, is_phone_verified,
        is_email_verified, points, tiktok_url, facebook_url,
        instagram_url, total_games, wins, losses, created_at, updated_at
      FROM users
      WHERE user_type = 'player'
    `);

    // Xóa các cột đã thêm
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "user_type",
        DROP COLUMN IF EXISTS "phone_number",
        DROP COLUMN IF EXISTS "gender",
        DROP COLUMN IF EXISTS "address",
        DROP COLUMN IF EXISTS "rank",
        DROP COLUMN IF EXISTS "avatar_url",
        DROP COLUMN IF EXISTS "is_phone_verified",
        DROP COLUMN IF EXISTS "is_email_verified",
        DROP COLUMN IF EXISTS "points",
        DROP COLUMN IF EXISTS "tiktok_url",
        DROP COLUMN IF EXISTS "facebook_url",
        DROP COLUMN IF EXISTS "instagram_url",
        DROP COLUMN IF EXISTS "total_games",
        DROP COLUMN IF EXISTS "wins",
        DROP COLUMN IF EXISTS "losses"
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL
    `);
  }
}
