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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Sse,
  MessageEvent,
  Header,
  Request,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { filter, map } from 'rxjs/operators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TournamentsService } from '../services/tournaments.service';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  CreateMatchDto,
  UpdateMatchDto,
} from '../dto/tournaments.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/tournaments')
export class TournamentsController {
  private readonly logger = new Logger(TournamentsController.name);

  constructor(private readonly service: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async create(@Body() dto: CreateTournamentDto) {
    return this.service.create(dto);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/tournaments',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const imageType = (req.query.image_type as string) || 'image';
          cb(null, `tournament-${imageType}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadImage(
    @Query('image_type') imageType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = `/uploads/tournaments/${file.filename}`;
    return { url };
  }

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

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTournamentDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { success: true };
  }

  @Delete(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Query('image_type') imageType: string,
    @Query('sponsor_index') sponsorIndex?: string,
  ) {
    const idx = sponsorIndex !== undefined ? parseInt(sponsorIndex, 10) : undefined;
    return this.service.removeImage(id, imageType, idx);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id/matches')
  async getMatches(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMatches(id);
  }

  @Sse(':id/matches/live')
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache')
  liveMatches(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMatchUpdatesStream().pipe(
      filter((event) => event.tournamentId === id),
      map((event) => ({
        data: event.match,
      } as MessageEvent)),
    );
  }

  @Sse(':id/payment/live')
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache')
  livePayment(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) userId: number) {
    return this.service.getPaymentStream().pipe(
      filter((event) => event.tournamentId === id && event.userId === userId),
      map(() => ({ data: { success: true } } as MessageEvent)),
    );
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

  @Get('slug/:slug/registrations')
  async getRegistrationsBySlug(@Param('slug') slug: string) {
    return this.service.getRegistrationsBySlug(slug);
  }

  @Get('slug/:slug/matches')
  async getMatchesBySlug(@Param('slug') slug: string) {
    return this.service.getMatchesBySlug(slug);
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

  @Post('device/active-match/:id/table-fee-payment')
  async createTableFeePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { elapsed_sec: number },
  ) {
    return this.service.createTableFeePayment(id, dto.elapsed_sec);
  }

  @Get('device/active-match/:id/table-fee-payment/status')
  async getTableFeePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('code') code: string,
  ) {
    return this.service.getTableFeePaymentStatus(id, code);
  }

  @Post('device/active-match/:id/table-fee-payment/cancel')
  async cancelTableFeePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body('code') code: string,
  ) {
    await this.service.cancelTableFeePayment(id, code);
    return { success: true };
  }

  // ==== ADMIN / WEB BRACKET & REGISTRATION API ==== //

  @Get(':id/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async getPayments(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.service.getTournamentPayments(id);
    } catch (err) {
      this.logger.error(`getTournamentPayments(${id}) failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException(err?.message ?? 'Unknown error');
    }
  }

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

  @Post(':id/payment-code')
  @UseGuards(JwtAuthGuard)
  async createPaymentCode(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const code = await this.service.createPaymentCode(id, req.user.id);
    return { code };
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
