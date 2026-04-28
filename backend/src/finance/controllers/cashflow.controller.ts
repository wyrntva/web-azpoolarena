import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CashflowService } from '../services/cashflow.service';
import {
  CreateRevenueDto,
  UpdateRevenueDto,
  CreateExchangeDto,
  CreateSafeDto,
  CreateDebtDto,
  UpdateDebtDto,
} from '../dto/finance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashflowController {
  constructor(private readonly service: CashflowService) {}

  // ================= Revenues =================
  @Get('revenues/:date')
  async getRevenue(@Param('date') date: string) {
    return this.service.findRevenueByDate(date);
  }

  @Get('revenues/month/:month')
  async getMonthRevenue(@Param('month') month: string) {
    return this.service.getRevenuesByMonth(month);
  }

  @Post('revenues/:date')
  @Roles('admin', 'Super Admin')
  async upsertRevenue(
    @Param('date') date: string,
    @Body() dto: CreateRevenueDto | UpdateRevenueDto,
    @Request() req,
  ) {
    return this.service.upsertRevenue(dto, date, req.user.id);
  }

  // ================= Exchanges =================
  @Post('exchanges')
  @Roles('admin', 'Super Admin')
  async createExchange(@Body() dto: CreateExchangeDto, @Request() req) {
    return this.service.createExchange(dto, req.user.id);
  }

  @Get('exchanges')
  async getExchanges(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.service.findExchanges(startDate, endDate);
  }

  @Delete('exchanges/:id')
  @Roles('admin', 'Super Admin')
  async deleteExchange(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteExchange(id);
  }

  // ================= Safes =================
  @Post('safes')
  @Roles('admin', 'Super Admin')
  async createSafe(@Body() dto: CreateSafeDto, @Request() req) {
    return this.service.createSafe(dto, req.user.id);
  }

  @Get('safes')
  async getSafes(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.service.findSafes(startDate, endDate);
  }

  @Delete('safes/:id')
  @Roles('admin', 'Super Admin')
  async deleteSafe(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteSafe(id);
  }

  // ================= Debts =================
  @Post('debts')
  @Roles('admin', 'Super Admin')
  async createDebt(@Body() dto: CreateDebtDto, @Request() req) {
    return this.service.createDebt(dto, req.user.id);
  }

  @Get('debts')
  async getDebts(@Query('is_paid') isPaidStr?: string) {
    let isPaid: boolean | undefined = undefined;
    if (isPaidStr === 'true') isPaid = true;
    if (isPaidStr === 'false') isPaid = false;
    return this.service.findDebts(isPaid);
  }

  @Put('debts/:id')
  @Roles('admin', 'Super Admin')
  async updateDebt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDebtDto,
  ) {
    return this.service.updateDebt(id, dto);
  }

  @Delete('debts/:id')
  @Roles('admin', 'Super Admin')
  async deleteDebt(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteDebt(id);
  }
}
