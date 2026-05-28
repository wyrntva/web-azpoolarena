import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentCodeEntity1779929077697 implements MigrationInterface {
    name = 'AddPaymentCodeEntity1779929077697'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop old manually-named FK constraints if they exist (may not exist on all envs)
        await queryRunner.query(`ALTER TABLE "tournament_registrations" DROP CONSTRAINT IF EXISTS "tournament_registrations_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" DROP CONSTRAINT IF EXISTS "tournament_matches_winner_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" DROP CONSTRAINT IF EXISTS "tournament_matches_player2_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" DROP CONSTRAINT IF EXISTS "tournament_matches_player1_id_fkey"`);

        // Add missing columns to tournament_registrations
        await queryRunner.query(`ALTER TABLE "tournament_registrations" ADD COLUMN IF NOT EXISTS "points" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "tournament_registrations" ADD COLUMN IF NOT EXISTS "rank" character varying(10)`);

        // Create payment codes table
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tournament_payment_codes" ("id" SERIAL NOT NULL, "code" character varying(19) NOT NULL, "tournament_id" integer NOT NULL, "user_id" integer NOT NULL, "used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fcc22331ccfad8042f46f077cad" UNIQUE ("code"), CONSTRAINT "PK_abad914feb59e86326bd38597af" PRIMARY KEY ("id"))`);

        // Add FK constraints only if they don't already exist
        await queryRunner.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ca269aa26624da44fe02ec20f83') THEN
              ALTER TABLE "tournament_registrations" ADD CONSTRAINT "FK_ca269aa26624da44fe02ec20f83" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            END IF;
          END $$;
        `);
        await queryRunner.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_b861c4e658ead3ad35a8f54448b') THEN
              ALTER TABLE "tournament_matches" ADD CONSTRAINT "FK_b861c4e658ead3ad35a8f54448b" FOREIGN KEY ("player1_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            END IF;
          END $$;
        `);
        await queryRunner.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_0cbf67b46121b71e3a94c8b0e30') THEN
              ALTER TABLE "tournament_matches" ADD CONSTRAINT "FK_0cbf67b46121b71e3a94c8b0e30" FOREIGN KEY ("player2_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            END IF;
          END $$;
        `);
        await queryRunner.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_b674515b15e7f92e72a77a30bac') THEN
              ALTER TABLE "tournament_matches" ADD CONSTRAINT "FK_b674515b15e7f92e72a77a30bac" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            END IF;
          END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournament_matches" DROP CONSTRAINT IF EXISTS "FK_b674515b15e7f92e72a77a30bac"`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" DROP CONSTRAINT IF EXISTS "FK_0cbf67b46121b71e3a94c8b0e30"`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" DROP CONSTRAINT IF EXISTS "FK_b861c4e658ead3ad35a8f54448b"`);
        await queryRunner.query(`ALTER TABLE "tournament_registrations" DROP CONSTRAINT IF EXISTS "FK_ca269aa26624da44fe02ec20f83"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tournament_payment_codes"`);
        await queryRunner.query(`ALTER TABLE "tournament_registrations" DROP COLUMN IF EXISTS "rank"`);
        await queryRunner.query(`ALTER TABLE "tournament_registrations" DROP COLUMN IF EXISTS "points"`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
