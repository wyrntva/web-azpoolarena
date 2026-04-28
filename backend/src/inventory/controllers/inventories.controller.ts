import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoriesService } from '../services/inventories.service';
import { CreateInventoryDto, UpdateInventoryDto } from '../dto/inventory.dto';
import { InventoryStatus } from '../entities';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/inventories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Post()
  @Roles('admin', 'Super Admin')
  async create(@Body() dto: CreateInventoryDto, @Request() req) {
    return this.inventoriesService.create(dto, req.user.id);
  }

  @Get()
  async findAll(
    @Query('skip') skipStr?: string,
    @Query('limit') limitStr?: string,
    @Query('status_filter') statusFilter?: InventoryStatus,
    @Query('search') search?: string,
  ) {
    const skip = skipStr ? parseInt(skipStr, 10) : 0;
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    return this.inventoriesService.findAll(skip, limit, statusFilter, search);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'Super Admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'Super Admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoriesService.remove(id);
  }
}
