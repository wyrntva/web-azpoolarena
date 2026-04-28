import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TournamentSettingsService } from '../services/tournament-settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/tournament-settings')
export class TournamentSettingsController {
  constructor(private readonly service: TournamentSettingsService) {}

  // Ranks
  @Get('ranks')
  async getRanks() { return this.service.getRanks(); }

  @Get('ranks/:id')
  async getRank(@Param('id', ParseIntPipe) id: number) { return this.service.getRank(id); }

  @Post('ranks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async createRank(@Body() dto: any) { return this.service.createRank(dto); }

  @Put('ranks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async updateRank(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.updateRank(id, dto); }

  @Delete('ranks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async deleteRank(@Param('id', ParseIntPipe) id: number) { return this.service.deleteRank(id); }

  // Rounds
  @Get('rounds')
  async getRounds() { return this.service.getRounds(); }

  @Get('rounds/:id')
  async getRound(@Param('id', ParseIntPipe) id: number) { return this.service.getRound(id); }

  @Post('rounds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async createRound(@Body() dto: any) { return this.service.createRound(dto); }

  @Put('rounds/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async updateRound(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.updateRound(id, dto); }

  @Delete('rounds/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async deleteRound(@Param('id', ParseIntPipe) id: number) { return this.service.deleteRound(id); }

  // Scoring Rules
  @Get('scoring-rules')
  async getScoringRules() { return this.service.getScoringRules(); }

  @Get('scoring-rules/:id')
  async getScoringRule(@Param('id', ParseIntPipe) id: number) { return this.service.getScoringRule(id); }

  @Post('scoring-rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async createScoringRule(@Body() dto: any) { return this.service.createScoringRule(dto); }

  @Put('scoring-rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async updateScoringRule(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.updateScoringRule(id, dto); }

  @Delete('scoring-rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async deleteScoringRule(@Param('id', ParseIntPipe) id: number) { return this.service.deleteScoringRule(id); }
}
