import { Controller, Get, Patch, Put, Post, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StoreSettingsService } from '../services/store-settings.service';
import { UpdateStoreSettingsDto } from '../dto/store-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/store-settings')
export class StoreSettingsController {
  constructor(private readonly service: StoreSettingsService) {}

  @Get()
  async getSettings() {
    return this.service.getSettings();
  }

  @Get('public')
  async getPublicSettings() {
    return this.service.getSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async updateSettings(@Body() dto: UpdateStoreSettingsDto) {
    return this.service.updateSettings(dto);
  }

  // PUT mapped from frontend `storeSettingsAPI.update`
  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async putSettings(@Body() dto: UpdateStoreSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Post('banner/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${req.params.type}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadBanner(
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = `/uploads/${file.filename}`;
    return this.service.addBanner(type, url);
  }

  @Delete('banner/:type/:index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async deleteMultiBanner(
    @Param('type') type: string,
    @Param('index') index: string,
  ) {
    return this.service.removeBanner(type, parseInt(index, 10));
  }

  @Delete('banner/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async deleteSingleBanner(@Param('type') type: string) {
    return this.service.removeSingleBanner(type);
  }
}
