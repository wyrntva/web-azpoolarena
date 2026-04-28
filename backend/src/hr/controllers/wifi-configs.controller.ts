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
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WifiConfigsService } from '../services/wifi-configs.service';
import { CreateWiFiConfigDto, UpdateWiFiConfigDto } from '../dto/hr.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/wifi-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WifiConfigsController {
  constructor(private readonly wifiService: WifiConfigsService) {}

  @Post()
  @Roles('admin', 'Super Admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWiFiConfigDto) {
    return this.wifiService.create(dto);
  }

  @Get()
  @Roles('admin', 'Super Admin')
  async findAll(@Query('is_active') isActiveStr?: string) {
    const isActive =
      isActiveStr === undefined
        ? undefined
        : isActiveStr.toLowerCase() === 'true';
    return this.wifiService.findAll(isActive);
  }

  @Get('approved')
  // Any logged-in user can get approved wifi configs
  async findApproved() {
    return this.wifiService.findApproved();
  }

  @Get(':id')
  @Roles('admin', 'Super Admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wifiService.findOne(id);
  }

  @Put(':id')
  @Roles('admin', 'Super Admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWiFiConfigDto,
  ) {
    return this.wifiService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'Super Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.wifiService.remove(id);
  }
}
