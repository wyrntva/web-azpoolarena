import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  QRSessionEntity,
  QRAccessTokenEntity,
  WorkScheduleEntity,
} from '../entities';
import { PayrollService } from '../services/payroll.service';
import moment from 'moment';

@Injectable()
export class AttendanceSchedulerService {
  private readonly logger = new Logger(AttendanceSchedulerService.name);

  constructor(
    @InjectRepository(WorkScheduleEntity)
    private readonly scheduleRepo: Repository<WorkScheduleEntity>,
    @InjectRepository(QRSessionEntity)
    private readonly qrSessionRepo: Repository<QRSessionEntity>,
    @InjectRepository(QRAccessTokenEntity)
    private readonly qrAccessTokenRepo: Repository<QRAccessTokenEntity>,
    private readonly payrollService: PayrollService,
  ) {}

  // Every 30 min — re-evaluate penalties for today AND yesterday (catch-up after downtime).
  @Cron('0 */30 * * * *')
  async dailyPenaltyCheck() {
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

    for (const dateStr of [today, yesterday]) {
      const schedules = await this.scheduleRepo.find({
        where: { work_date: dateStr, is_active: true },
      });

      for (const sch of schedules) {
        try {
          await this.payrollService.autoGeneratePenaltyForAttendance(
            sch.user_id,
            dateStr,
          );
        } catch (e: any) {
          this.logger.error(
            `Penalty check failed user_id=${sch.user_id} date=${dateStr}: ${e.message}`,
          );
        }
      }
    }
  }

  // 2:00 AM daily — delete expired QR tokens to prevent table bloat.
  @Cron('0 0 2 * * *')
  async cleanupExpiredQrTokens() {
    const now = new Date();
    const [sessions, oneTime] = await Promise.all([
      this.qrSessionRepo.delete({ expires_at: LessThan(now) }),
      this.qrAccessTokenRepo.delete({ expires_at: LessThan(now) }),
    ]);
    this.logger.log(
      `QR cleanup: removed ${sessions.affected} sessions, ${oneTime.affected} one-time tokens`,
    );
  }
}
