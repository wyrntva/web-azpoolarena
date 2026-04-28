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
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkSchedulesService } from '../services/work-schedules.service';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  CopyScheduleRequestDto,
  CopyWeekScheduleRequestDto,
} from '../dto/hr.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/work-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkSchedulesController {
  constructor(private readonly schedulesService: WorkSchedulesService) {}

  @Post()
  @Roles('admin', 'Super Admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWorkScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('user_id') userIdStr?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('is_active') isActiveStr?: string,
  ) {
    const userRole = req.user.role?.name;
    const isPrivileged =
      req.user.is_admin ||
      ['Thu ngân', 'accountant'].includes(userRole) ||
      req.user.role_id === 5;

    if (!isPrivileged) {
      return this.schedulesService.findMySchedules(
        req.user.id,
        startDate,
        endDate,
      );
    }

    const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
    const isActive = isActiveStr
      ? isActiveStr.toLowerCase() === 'true'
      : undefined;

    return this.schedulesService.findAll(userId, startDate, endDate, isActive);
  }

  @Get('my')
  async getMySchedules(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.schedulesService.findMySchedules(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.schedulesService.findOne(id, req.user.id, req.user.is_admin);
  }

  @Put(':id')
  @Roles('admin', 'Super Admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkScheduleDto,
  ) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'Super Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }

  @Post('copy-schedule')
  @Roles('admin', 'Super Admin')
  async copySchedule(@Body() dto: CopyScheduleRequestDto) {
    return this.schedulesService.copySchedule(dto);
  }

  @Post('copy-week-schedule')
  @Roles('admin', 'Super Admin')
  async copyWeekSchedule(@Body() dto: CopyWeekScheduleRequestDto) {
    return this.schedulesService.copyWeekSchedule(dto);
  }
}
