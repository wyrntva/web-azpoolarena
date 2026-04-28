import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UploadsService } from '../services/uploads.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Get('admin/orphans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async getOrphans() {
    return this.service.getOrphans(false);
  }

  @Post('admin/orphans/cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async cleanupOrphans() {
    return this.service.getOrphans(true);
  }
}
