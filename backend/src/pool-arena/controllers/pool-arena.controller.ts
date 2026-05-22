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
}
