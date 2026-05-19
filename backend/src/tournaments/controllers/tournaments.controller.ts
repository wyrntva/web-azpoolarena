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
} from '@nestjs/common';
import { TournamentsService } from '../services/tournaments.service';
import {
  UpdateTournamentDto,
  CreateMatchDto,
  UpdateMatchDto,
} from '../dto/tournaments.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/tournaments')
export class TournamentsController {
  constructor(private readonly service: TournamentsService) {}

  @Get()
  async findAll(
    @Query('skip') skipStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const skip = skipStr ? parseInt(skipStr, 10) : 0;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const [data, total] = await this.service.findAll(skip, limit);
    return { data, meta: { total, skip, limit } };
  }

  @Get('public')
  async findPublic(
    @Query('skip') skipStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const skip = skipStr ? parseInt(skipStr, 10) : 0;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const [data, total] = await this.service.findPublic(skip, limit);
    return { data, meta: { total, skip, limit } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id/matches')
  async getMatches(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMatches(id);
  }

  @Put('matches/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async updateMatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMatchDto,
  ) {
    return this.service.updateMatch(id, dto);
  }

  @Post(':id/matches/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async generateMatches(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { matches: CreateMatchDto[] },
  ) {
    return this.service.generateMatches(id, body.matches);
  }

  @Get(':id/registrations')
  async getRegistrations(@Param('id', ParseIntPipe) id: number) {
    return this.service.getRegistrations(id);
  }

  // ==== DEVICE API ==== //

  @Get('device/active-match')
  async getActiveMatch(@Query('table_name') tableName: string) {
    return this.service.getActiveMatchForDevice(tableName);
  }

  @Put('device/active-match/:id/score')
  async updateDeviceMatchScore(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateDeviceMatchScore(id, dto);
  }

  @Put('device/active-match/:id/check-in')
  async updateDeviceMatchCheckIn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateDeviceMatchCheckIn(id, dto);
  }
}
