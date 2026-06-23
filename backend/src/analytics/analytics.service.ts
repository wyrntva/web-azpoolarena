import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LoginLogEntity } from './entities/login-log.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Ga4Service } from './ga4.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LoginLogEntity)
    private readonly loginLogRepo: Repository<LoginLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly ga4: Ga4Service,
  ) {}

  // ─── Login Logging ────────────────────────────────────────────────────────

  async logLogin(
    userId: number,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    const log = this.loginLogRepo.create({
      user_id: userId,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });
    await this.loginLogRepo.save(log).catch(() => {
      // Lỗi ghi log không được ảnh hưởng đến luồng đăng nhập
    });
  }

  // ─── New Users Today ──────────────────────────────────────────────────────

  async getNewUsersToday(): Promise<{
    count: number;
    growth_percent: number | null;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const [todayCount, yesterdayCount] = await Promise.all([
      this.userRepo.count({
        where: { created_at: Between(todayStart, tomorrowStart) },
      }),
      this.userRepo.count({
        where: { created_at: Between(yesterdayStart, todayStart) },
      }),
    ]);

    const growth_percent =
      yesterdayCount === 0
        ? null
        : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 1000) /
          10;

    return { count: todayCount, growth_percent };
  }

  // ─── New Users By Day (Line Chart) ────────────────────────────────────────

  async getNewUsersByDay(
    days = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const rows: Array<{ date: string; count: string }> =
      await this.userRepo.query(
        `
        SELECT
          TO_CHAR(DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS count
        FROM users
        WHERE created_at >= NOW() - ($1 || ' days')::interval
        GROUP BY DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
        ORDER BY date ASC
        `,
        [days],
      );

    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  // ─── Returning (Old) Users By Day (Retention Line Chart) ─────────────────

  async getReturningUsersByDay(
    days = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const rows: Array<{ date: string; count: string }> =
      await this.loginLogRepo.query(
        `
        SELECT
          TO_CHAR(DATE(ll.login_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS date,
          COUNT(DISTINCT ll.user_id)::int AS count
        FROM login_logs ll
        INNER JOIN users u ON u.id = ll.user_id
        WHERE ll.login_at >= NOW() - ($1 || ' days')::interval
          AND DATE(u.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
              < DATE(ll.login_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
        GROUP BY DATE(ll.login_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
        ORDER BY date ASC
        `,
        [days],
      );

    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  // ─── Combined Overview ────────────────────────────────────────────────────

  async getOverview(startDate: string, endDate: string) {
    const [ga4, newUsersToday, newUsersChart, returningUsersChart] =
      await Promise.all([
        this.ga4.getMetrics(startDate, endDate),
        this.getNewUsersToday(),
        this.getNewUsersByDay(),
        this.getReturningUsersByDay(),
      ]);

    return {
      ga4,
      new_users_today: newUsersToday,
      new_users_chart: newUsersChart,
      returning_users_chart: returningUsersChart,
    };
  }
}
