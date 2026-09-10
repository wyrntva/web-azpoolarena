import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('expense-report/monthly')
  async getMonthlyExpenseReport(@Query('month') month: string) {
    if (!month)
      throw new BadRequestException(
        'Month query parameter is required (YYYY-MM)',
      );
    return this.service.getMonthlyExpenseReport(month);
  }

  @Get('finance/reports/daily-manual')
  async getDailyManualReports(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.service.getDailyManualReports(startDate, endDate);
  }

  @Post('finance/reports/daily-manual')
  async upsertDailyManualReport(
    @Body()
    dto: {
      report_date: string;
      cash_income?: number;
      cash_expense?: number;
      bank_exchange?: number;
      bank_income?: number;
      bank_expense?: number;
      system_revenue?: number;
      note?: string;
    },
  ) {
    return this.service.upsertDailyManualReport(dto);
  }

  @Get('finance/reports/monthly-summary')
  async getMonthlyFinancialReport(@Query('month') month: string) {
    if (!month)
      throw new BadRequestException(
        'Month query parameter is required (YYYY-MM)',
      );
    return this.service.getMonthlyFinancialReport(month);
  }

  @Post('finance/reports/monthly-summary')
  async upsertMonthlyFinancialReport(
    @Body()
    dto: {
      month: string;
      salary?: number;
      fixed_cost?: number;
      premises?: number;
      yard?: number;
      cloth?: number;
      prev_month_cash_balance?: number;
    },
  ) {
    return this.service.upsertMonthlyFinancialReport(dto);
  }
}
