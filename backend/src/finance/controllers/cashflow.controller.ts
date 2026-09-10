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
  @Get('revenues')
  async getRevenues(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.service.findRevenues(
      startDate,
      endDate,
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }

  @Get('revenues/:date')
  async getRevenue(@Param('date') date: string) {
    return this.service.findRevenueByDate(date);
  }

  @Get('revenues/month/:month')
  async getMonthRevenue(@Param('month') month: string) {
    return this.service.getRevenuesByMonth(month);
  }

  @Post('revenues')
  @Roles('admin', 'Super Admin')
  async createRevenue(
    @Body() dto: CreateRevenueDto,
    @Request() req,
  ) {
    return this.service.createRevenue(dto, req.user.id);
  }

  @Post('revenues/:date')
  @Roles('admin', 'Super Admin')
  async upsertRevenue(
    @Param('date') date: string,
    @Body() dto: CreateRevenueDto,
    @Request() req,
  ) {
    return this.service.createRevenue({ ...dto, revenue_date: date }, req.user.id);
  }

  @Put('revenues/:id')
  @Roles('admin', 'Super Admin')
  async updateRevenue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRevenueDto,
  ) {
    return this.service.updateRevenue(id, dto);
  }

  @Delete('revenues/:id')
  @Roles('admin', 'Super Admin')
  async deleteRevenue(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteRevenue(id);
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
  @Get('safes/balance')
  async getSafeBalance(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.service.getSafeBalance(m, y);
  }

  @Post('safes')
  @Roles('admin', 'Super Admin')
  async createSafe(@Body() dto: CreateSafeDto, @Request() req) {
    return this.service.createSafe(dto, req.user.id);
  }

  @Get('safes')
  async getSafes(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.service.findSafes(
      startDate,
      endDate,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
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
  async getDebts(
    @Query('is_paid') isPaidStr?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    let isPaid: boolean | undefined = undefined;
    if (isPaidStr === 'true') isPaid = true;
    if (isPaidStr === 'false') isPaid = false;
    return this.service.findDebts(isPaid, startDate, endDate);
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
