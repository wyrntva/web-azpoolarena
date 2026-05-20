import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkScheduleEntity } from '../entities';
import { PayrollService } from '../services/payroll.service';
import moment from 'moment';

@Injectable()
export class AttendanceSchedulerService {
  private readonly logger = new Logger(AttendanceSchedulerService.name);

  constructor(
    @InjectRepository(WorkScheduleEntity)
    private readonly scheduleRepo: Repository<WorkScheduleEntity>,
    private readonly payrollService: PayrollService,
  ) {}

  // Runs every 30 minutes — re-evaluates all penalties for today's schedules.
  // Handles LATE (respecting allowed_late_minutes grace), MISSING_CHECKOUT
  // (only 2h+ after shift end), and ABSENT (only after shift ends).
  // When attendance is edited, autoGeneratePenaltyForAttendance is also called
  // directly from AttendancesService, so penalties always stay in sync.
  @Cron('0 */30 * * * *')
  async dailyPenaltyCheck() {
    const today = moment().format('YYYY-MM-DD');
    const schedules = await this.scheduleRepo.find({
      where: { work_date: today, is_active: true },
    });

    for (const sch of schedules) {
      try {
        await this.payrollService.autoGeneratePenaltyForAttendance(
          sch.user_id,
          today,
        );
      } catch (e: any) {
        this.logger.error(
          `Penalty check failed for user_id=${sch.user_id}: ${e.message}`,
        );
      }
    }
  }
}
