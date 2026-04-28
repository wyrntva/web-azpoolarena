import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  DefaultValuePipe,
} from '@nestjs/common';
import { AttendancesService } from '../services/attendances.service';
import {
  PublicAttendanceCheckRequestDto,
  AttendanceCheckRequestDto,
  UpdateAttendanceDto,
  CreateManualAttendanceDto,
  CreateQRTokenDto,
} from '../dto/hr.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/attendance')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('public-check')
  async publicCheck(
    @Body() dto: PublicAttendanceCheckRequestDto,
    @Request() req,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.attendancesService.publicCheckAttendance(dto, ipAddress);
  }

  @Post('check')
  @UseGuards(JwtAuthGuard)
  async check(@Body() dto: AttendanceCheckRequestDto, @Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.attendancesService.checkAttendance(dto, req.user, ipAddress);
  }

  @Get('timesheet')
  @UseGuards(JwtAuthGuard)
  async getTimesheet(
    @Request() req,
    @Query('user_id') userIdStr?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('status_filter') statusFilter?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('page_size', new DefaultValuePipe(20), ParseIntPipe)
    pageSize?: number,
  ) {
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;
    return this.attendancesService.getTimesheet(
      userId,
      startDate,
      endDate,
      statusFilter,
      page,
      pageSize,
      req.user,
    );
  }

  @Get('my-timesheet')
  @UseGuards(JwtAuthGuard)
  async getMyTimesheet(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('page_size', new DefaultValuePipe(20), ParseIntPipe)
    pageSize?: number,
  ) {
    return this.attendancesService.getTimesheet(
      req.user.id,
      startDate,
      endDate,
      undefined,
      page,
      pageSize,
      req.user,
    );
  }

  @Post('qr/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async generateQrCode(@Body() dto: CreateQRTokenDto, @Request() req) {
    return this.attendancesService.generateQrCode(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async updateAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendancesService.updateAttendance(id, dto);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async createManualAttendance(@Body() dto: CreateManualAttendanceDto) {
    return this.attendancesService.createManualAttendance(dto);
  }
}
