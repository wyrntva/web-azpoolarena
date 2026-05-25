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
import { PayrollService } from '../services/payroll.service';
import {
  CreateAdvancePaymentDto,
  UpdateAdvancePaymentDto,
  CreateBonusDto,
  UpdateBonusDto,
  CreatePenaltyDto,
  UpdatePenaltyDto,
} from '../dto/hr.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ==================== Advances ====================
  @Get('advances')
  async getAdvances(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('user_id') userIdStr?: string,
  ) {
    const isAdmin = req.user.is_admin || ['admin', 'Quản trị', 'Quản lý'].includes(req.user.role?.name);
    const userId = isAdmin 
        ? (userIdStr ? parseInt(userIdStr, 10) : undefined)
        : req.user.id;
    return this.payrollService.findAllAdvances(userId, startDate, endDate);
  }

  @Post('advances')
  @Roles('admin', 'Super Admin')
  async createAdvance(@Body() dto: CreateAdvancePaymentDto, @Request() req) {
    return this.payrollService.createAdvance(dto, req.user.id);
  }

  @Put('advances/:id')
  @Roles('admin', 'Super Admin')
  async updateAdvance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdvancePaymentDto,
  ) {
    return this.payrollService.updateAdvance(id, dto);
  }

  @Delete('advances/:id')
  @Roles('admin', 'Super Admin')
  async deleteAdvance(@Param('id', ParseIntPipe) id: number) {
    await this.payrollService.deleteAdvance(id);
    return { message: 'Advance payment deleted successfully' };
  }

  // ==================== Bonuses ====================
  @Get('bonuses')
  async getBonuses(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('user_id') userIdStr?: string,
  ) {
    const isAdmin = req.user.is_admin || ['admin', 'Quản trị', 'Quản lý'].includes(req.user.role?.name);
    const userId = isAdmin 
        ? (userIdStr ? parseInt(userIdStr, 10) : undefined)
        : req.user.id;
    return this.payrollService.findAllBonuses(userId, startDate, endDate);
  }

  @Post('bonuses')
  @Roles('admin', 'Super Admin')
  async createBonus(@Body() dto: CreateBonusDto, @Request() req) {
    return this.payrollService.createBonus(dto, req.user.id);
  }

  @Put('bonuses/:id')
  @Roles('admin', 'Super Admin')
  async updateBonus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBonusDto,
  ) {
    return this.payrollService.updateBonus(id, dto);
  }

  @Delete('bonuses/:id')
  @Roles('admin', 'Super Admin')
  async deleteBonus(@Param('id', ParseIntPipe) id: number) {
    await this.payrollService.deleteBonus(id);
    return { message: 'Bonus deleted successfully' };
  }

  // ==================== Penalties ====================
  @Get('penalties')
  async getPenalties(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('user_id') userIdStr?: string,
  ) {
    const isAdmin = req.user.is_admin || ['admin', 'Quản trị', 'Quản lý'].includes(req.user.role?.name);
    const userId = isAdmin 
        ? (userIdStr ? parseInt(userIdStr, 10) : undefined)
        : req.user.id;
    return this.payrollService.findAllPenalties(userId, startDate, endDate);
  }

  @Post('penalties')
  @Roles('admin', 'Super Admin')
  async createPenalty(@Body() dto: CreatePenaltyDto, @Request() req) {
    return this.payrollService.createPenalty(dto, req.user.id);
  }

  @Put('penalties/:id')
  @Roles('admin', 'Super Admin')
  async updatePenalty(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePenaltyDto,
  ) {
    return this.payrollService.updatePenalty(id, dto);
  }

  @Delete('penalties/:id')
  @Roles('admin', 'Super Admin')
  async deletePenalty(@Param('id', ParseIntPipe) id: number) {
    await this.payrollService.deletePenalty(id);
    return { message: 'Penalty deleted successfully' };
  }

  // ==================== Summary ====================
  @Get('summary')
  async getSummary(@Request() req, @Query('month') month: string) {
    const summary = await this.payrollService.getSummary(month);
    const isAdmin = req.user.is_admin || ['admin', 'Quản trị', 'Quản lý'].includes(req.user.role?.name);
    if (!isAdmin) {
      return summary.filter(item => item.user_id === req.user.id);
    }
    return summary;
  }

  @Post('auto-generate-penalties')
  @Roles('admin', 'Super Admin')
  async autoGeneratePenalties(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req,
  ) {
    return this.payrollService.autoGeneratePenalties(
      startDate,
      endDate,
      req.user.id,
    );
  }
}
