import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { AttendanceSettingsService } from '../services/attendance-settings.service';
import {
  CreateAttendanceSettingsDto,
  UpdateAttendanceSettingsDto,
} from '../dto/hr.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/attendance-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceSettingsController {
  constructor(private readonly settingsService: AttendanceSettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @Roles('admin', 'Super Admin')
  async updateSettings(@Body() dto: UpdateAttendanceSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Post()
  @Roles('admin', 'Super Admin')
  async createSettings(@Body() dto: CreateAttendanceSettingsDto) {
    return this.settingsService.createSettings(dto);
  }
}
