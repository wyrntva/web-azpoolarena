import { AppDataSource } from './data-source';
import {
  WorkScheduleEntity,
  AttendanceEntity,
  AdvancePaymentEntity,
  BonusEntity,
  PenaltyEntity,
  AttendanceSettingsEntity,
} from './hr/entities';
import { UserEntity } from './users/entities/user.entity';
import { recalculateStatus } from './hr/helpers/attendance.helpers';
import { PayrollService } from './hr/services/payroll.service';

async function bootstrap() {
  console.log('Initializing database connection via AppDataSource...');
  await AppDataSource.initialize();
  console.log('Database connected successfully (bypassed NestJS startup migrations)!');

  const scheduleRepo = AppDataSource.getRepository(WorkScheduleEntity);
  const attendanceRepo = AppDataSource.getRepository(AttendanceEntity);

  const targetDate = '2026-05-21';
  console.log(`Fetching active work schedules for ${targetDate}...`);

  const schedules = await scheduleRepo.find({
    where: { work_date: targetDate, is_active: true },
  });

  console.log(`Found ${schedules.length} active schedules. Creating PayrollService instance...`);

  const payrollService = new PayrollService(
    AppDataSource,
    AppDataSource.getRepository(AdvancePaymentEntity),
    AppDataSource.getRepository(BonusEntity),
    AppDataSource.getRepository(PenaltyEntity),
    attendanceRepo,
    scheduleRepo,
    AppDataSource.getRepository(AttendanceSettingsEntity),
    AppDataSource.getRepository(UserEntity),
  );

  for (const ws of schedules) {
    try {
      // 1. Recalculate attendance status if it exists
      const att = await attendanceRepo.findOne({
        where: { user_id: ws.user_id, date: ws.work_date },
      });
      if (att) {
        recalculateStatus(att, ws);
        await attendanceRepo.save(att);
        console.log(`Updated attendance status for user_id: ${ws.user_id} to ${att.status}`);
      } else {
        console.log(`No attendance record found for user_id: ${ws.user_id}`);
      }

      // 2. Recalculate auto penalties (which deletes old ones and creates/does not create new ones)
      await payrollService.autoGeneratePenaltyForAttendance(ws.user_id, ws.work_date);
      console.log(`Successfully recalculated & synchronized penalties for user_id: ${ws.user_id}`);
    } catch (err) {
      console.error(`Error recalculating for user_id: ${ws.user_id}:`, err);
    }
  }

  await AppDataSource.destroy();
  console.log('Recalculation script completed successfully!');
}

bootstrap().catch((err) => {
  console.error('Fatal error running recalculation script:', err);
  process.exit(1);
});
