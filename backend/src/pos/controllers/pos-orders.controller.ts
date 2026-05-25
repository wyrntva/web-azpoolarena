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
import { PosOrdersService } from '../services/pos-orders.service';
import { PosOrderCreateDto } from '../dto/pos-order.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/pos/orders')
export class PosOrdersController {
  constructor(private readonly posOrdersService: PosOrdersService) {}

  @Post()
  async create(@Body() dto: PosOrderCreateDto) {
    return this.posOrdersService.create(dto);
  }

  @Get()
  async findAll(
    @Query('order_type') orderType?: string,
    @Query('table_id') tableId?: string,
    @Query('area_id') areaId?: string,
  ) {
    return this.posOrdersService.findAll(
      orderType,
      tableId ? parseInt(tableId, 10) : undefined,
      areaId ? parseInt(areaId, 10) : undefined,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PosOrderCreateDto,
  ) {
    return this.posOrdersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.posOrdersService.remove(id);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmScoreboardOrder(@Param('id', ParseIntPipe) id: number) {
    return this.posOrdersService.confirmScoreboardOrder(id);
  }
}
