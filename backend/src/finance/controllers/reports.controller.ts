import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/expense-report')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('monthly')
  async getMonthlyExpenseReport(@Query('month') month: string) {
    if (!month)
      throw new BadRequestException(
        'Month query parameter is required (YYYY-MM)',
      );
    return this.service.getMonthlyExpenseReport(month);
  }
}
