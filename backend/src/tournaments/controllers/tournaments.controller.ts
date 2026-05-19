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

  // ==== ADMIN / WEB BRACKET & REGISTRATION API ==== //

  @Get(':id/bracket')
  async getBracket(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMatches(id);
  }

  @Put(':id/matches/:matchNo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async upsertMatch(
    @Param('id', ParseIntPipe) id: number,
    @Param('matchNo', ParseIntPipe) matchNo: number,
    @Body() dto: UpdateMatchDto,
  ) {
    return this.service.upsertMatch(id, matchNo, dto);
  }

  @Get(':id/eligible-users')
  async getEligibleUsers(
    @Param('id', ParseIntPipe) id: number,
    @Query('search') search?: string,
  ) {
    return this.service.getEligibleUsers(id, search);
  }

  @Post(':id/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async registerPlayer(
    @Param('id', ParseIntPipe) id: number,
    @Body('user_id', ParseIntPipe) userId: number,
  ) {
    return this.service.registerPlayer(id, userId);
  }

  @Delete(':id/registrations/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async unregisterPlayer(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.service.unregisterPlayer(id, userId);
    return { success: true };
  }
}
