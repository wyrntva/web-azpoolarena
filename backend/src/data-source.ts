import * as pg from 'pg';
pg.types.setTypeParser(1114, (stringValue) => stringValue);

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

if (process.env.DOCKER !== 'true') {
  config({ path: join(__dirname, '..', '.env') });
}

/**
 * DataSource used by the TypeORM CLI for generating and running migrations.
 * Run via: npm run migration:generate / migration:run / migration:revert
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    // Individual *.entity.ts files (areas, devices, roles, switches, users, etc.)
    join(__dirname, '**', '*.entity.{ts,js}'),
    // Module-level barrel files that contain entity class definitions
    join(__dirname, '**', 'entities.{ts,js}'),
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: false,
});
