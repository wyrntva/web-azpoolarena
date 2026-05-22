import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WorkSchedulesService } from './hr/services/work-schedules.service';
import { DataSource } from 'typeorm';
import { WorkScheduleEntity } from './hr/entities';

async function bootstrap() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const workSchedulesService = app.get(WorkSchedulesService);
  const dataSource = app.get(DataSource);

  const targetDate = '2026-05-21';
  console.log(`Fetching active work schedules for ${targetDate}...`);

  const schedules = await dataSource.getRepository(WorkScheduleEntity).find({
    where: { work_date: targetDate, is_active: true },
  });

  console.log(`Found ${schedules.length} active schedules. Starting recalculation...`);

  for (const ws of schedules) {
    try {
      await workSchedulesService.update(ws.id, {});
      console.log(`Successfully recalculated & synchronized penalties for user_id: ${ws.user_id}`);
    } catch (err) {
      console.error(`Error recalculating for user_id: ${ws.user_id}:`, err);
    }
  }

  await app.close();
  console.log('Recalculation script completed successfully!');
}

bootstrap().catch((err) => {
  console.error('Fatal error running recalculation script:', err);
  process.exit(1);
});
