import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SwitchesService } from './switches.service';

@Controller('api/switches')
export class SwitchesController {
  constructor(private readonly switchesService: SwitchesService) {}

  @Get()
  findAll() {
    return this.switchesService.findAll();
  }

  @Post()
  create(@Body() dto: any) {
    return this.switchesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.switchesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.switchesService.remove(id);
  }

  /** ESP polling endpoint: GET /api/switches/esp-status?code=ABC123&ip=192.168.1.134 */
  @Get('esp-status')
  getEspStatus(@Query('code') code: string, @Query('ip') ip?: string) {
    return this.switchesService.getEspStatus(code, ip);
  }

  /** Lắng nghe bản tin qua MQTT siêu tốc từ Master ESP */
  @MessagePattern('azpool/master_esp/report')
  async handleScoreboardReport(@Payload() data: { table_name: string; is_active: boolean }) {
    if (data && data.table_name !== undefined && data.is_active !== undefined) {
      await this.switchesService.updateStatusByReport(data.table_name, data.is_active);
    }
  }

  /** Lắng nghe bản tin thiết bị Cắm-Là-Chạy (Auto Discovery) */
  @MessagePattern('azpool/master_esp/discovery')
  async handleDeviceDiscovery(@Payload() data: { name: string; switch_type: string; is_active?: boolean }) {
    await this.switchesService.handleDiscovery(data);
  }
}
