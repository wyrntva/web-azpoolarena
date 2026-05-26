import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStaffToCustomerList1780000000001 implements MigrationInterface {
  name = 'AddStaffToCustomerList1780000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thực hiện trong 1 PL/pgSQL block để đảm bảo thứ tự đúng:
    // với mỗi staff có username là SĐT:
    //   1. Tìm player trùng SĐT (nếu có) → gộp stats, chuyển FKs, xóa player
    //   2. Điền phone_number cho staff (sau khi không còn bản trùng)
    // Cuối cùng: đổi tất cả user_type = 'staff' → 'both'
    await queryRunner.query(`
      DO $$
      DECLARE
        staff_rec RECORD;
        player_rec RECORD;
        normalized_phone TEXT;
      BEGIN
        FOR staff_rec IN
          SELECT * FROM users
          WHERE user_type = 'staff'
            AND username ~ '^0[0-9]{9,10}$'
        LOOP
          normalized_phone := '+84' || SUBSTRING(staff_rec.username FROM 2);

          -- Tìm player trùng SĐT
          SELECT * INTO player_rec
          FROM users
          WHERE user_type = 'player' AND phone_number = normalized_phone;

          IF FOUND THEN
            -- Copy stats từ player vào staff
            UPDATE users SET
              points        = COALESCE(player_rec.points, 0),
              wins          = COALESCE(player_rec.wins, 0),
              losses        = COALESCE(player_rec.losses, 0),
              total_games   = COALESCE(player_rec.total_games, 0),
              rank          = COALESCE(player_rec.rank, staff_rec.rank),
              avatar_url    = COALESCE(player_rec.avatar_url, staff_rec.avatar_url),
              gender        = COALESCE(player_rec.gender, staff_rec.gender),
              address       = COALESCE(player_rec.address, staff_rec.address),
              tiktok_url    = COALESCE(player_rec.tiktok_url, staff_rec.tiktok_url),
              facebook_url  = COALESCE(player_rec.facebook_url, staff_rec.facebook_url),
              instagram_url = COALESCE(player_rec.instagram_url, staff_rec.instagram_url)
            WHERE id = staff_rec.id;

            -- Chuyển tournament FKs từ player → staff
            UPDATE tournament_registrations SET user_id    = staff_rec.id WHERE user_id    = player_rec.id;
            UPDATE tournament_matches        SET player1_id = staff_rec.id WHERE player1_id = player_rec.id;
            UPDATE tournament_matches        SET player2_id = staff_rec.id WHERE player2_id = player_rec.id;
            UPDATE tournament_matches        SET winner_id  = staff_rec.id WHERE winner_id  = player_rec.id;

            -- Xóa player record trùng (phone đã được giải phóng)
            DELETE FROM users WHERE id = player_rec.id;
          END IF;

          -- Điền phone_number cho staff (không còn conflict)
          UPDATE users
          SET phone_number = normalized_phone
          WHERE id = staff_rec.id
            AND (phone_number IS NULL OR phone_number = '');

        END LOOP;

        -- Chuyển tất cả staff → both (vừa nhân viên vừa khách hàng)
        UPDATE users SET user_type = 'both' WHERE user_type = 'staff';
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users SET user_type = 'staff' WHERE user_type = 'both'
    `);
  }
}
