import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { convertToWebp } from '../../common/utils/image.utils';
import { PoolArenaService } from '../services/pool-arena.service';
import {
  CreatePoolArenaUserDto,
  UpdatePoolArenaUserDto,
} from '../dto/pool-arena.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/pool-arena/users')
export class PoolArenaController {
  constructor(private readonly service: PoolArenaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async create(@Body() dto: CreatePoolArenaUserDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(
    @Query('skip') skipStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('rank') rank?: string,
    @Query('gender') gender?: string,
  ) {
    const skip = skipStr ? parseInt(skipStr, 10) : 0;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const [data, total] = await this.service.findAll(skip, limit, search, rank, gender);
    return { data, total, meta: { total, skip, limit } };
  }

  @Get('rankings')
  async getRankings(@Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    return this.service.getRankings(limit);
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
    @Body() dto: UpdatePoolArenaUserDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePoolArenaUserDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { message: 'User deleted' };
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const webpPath = await convertToWebp(file.path);
    const filename = webpPath.split(/[\\/]/).pop();
    const avatarUrl = `/uploads/avatars/${filename}`;
    await this.service.updateAvatar(id, avatarUrl);
    return { avatar_url: avatarUrl };
  }

  @Delete(':id/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async deleteAvatar(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteAvatar(id);
    return { message: 'Avatar removed' };
  }
}
