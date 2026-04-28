import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AreasService } from '../services/areas.service';
import {
  CreateAreaDto,
  UpdateAreaDto,
  TablePositionUpdateDto,
  UpdateTableDto,
  DeviceActivationRequestDto,
  DeviceStatusRequestDto,
} from '../dto/area.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  async findAll() {
    return this.areasService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAreaDto,
  ) {
    return this.areasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.remove(id);
  }

  @Put(':id/update_tables_layout')
  @UseGuards(JwtAuthGuard)
  async updateTablePositions(
    @Param('id', ParseIntPipe) id: number,
    @Body() layoutData: TablePositionUpdateDto[],
  ) {
    return this.areasService.updateTablePositions(id, layoutData);
  }

  @Put(':id/tables/:tableId')
  @UseGuards(JwtAuthGuard)
  async updateTable(
    @Param('id', ParseIntPipe) id: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() dto: UpdateTableDto,
  ) {
    return this.areasService.updateTable(id, tableId, dto);
  }

  @Delete(':id/tables/:tableId')
  @UseGuards(JwtAuthGuard)
  async deleteTable(
    @Param('id', ParseIntPipe) id: number,
    @Param('tableId', ParseIntPipe) tableId: number,
  ) {
    return this.areasService.deleteTable(id, tableId);
  }

  // Devices endpoints
  @Post('device/verify')
  async verifyDevice(@Body() dto: DeviceActivationRequestDto) {
    return this.areasService.verifyDevice(dto);
  }

  @Post('device/status')
  async checkDeviceStatus(@Body() dto: DeviceStatusRequestDto) {
    return this.areasService.checkDeviceStatus(dto);
  }
}
