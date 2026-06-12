import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/overview
   * Trả về toàn bộ dữ liệu dashboard một lần:
   *   - GA4: sessions, users, pageviews, bounce_rate, avg_session_duration, top_pages
   *   - new_users_today: { count, growth_percent }
   *   - new_users_chart: [{ date, count }] — 30 ngày gần nhất
   *   - returning_users_chart: [{ date, count }] — tài khoản cũ đăng nhập lại 30 ngày
   *
   * Query params:
   *   startDate — GA4 date string, e.g. "30daysAgo" hoặc "2024-01-01"  (default: "30daysAgo")
   *   endDate   — GA4 date string, e.g. "today" hoặc "2024-01-31"       (default: "today")
   */
  @Get('overview')
  async getOverview(
    @Query('startDate') startDate = '30daysAgo',
    @Query('endDate') endDate = 'today',
  ) {
    return this.analyticsService.getOverview(startDate, endDate);
  }

  /**
   * GET /api/analytics/new-users
   * Chỉ lấy thống kê tài khoản mới (tách riêng nếu muốn poll nhanh).
   */
  @Get('new-users')
  async getNewUsers() {
    const [today, chart] = await Promise.all([
      this.analyticsService.getNewUsersToday(),
      this.analyticsService.getNewUsersByDay(),
    ]);
    return { today, chart };
  }

  /**
   * GET /api/analytics/returning-users
   * Chỉ lấy retention chart (tài khoản cũ quay lại).
   */
  @Get('returning-users')
  async getReturningUsers() {
    return { chart: await this.analyticsService.getReturningUsersByDay() };
  }
}
