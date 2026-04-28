import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreSettingsEntity } from './entities';
import { StoreSettingsService } from './services/store-settings.service';
import { StoreSettingsController } from './controllers/store-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoreSettingsEntity])],
  controllers: [StoreSettingsController],
  providers: [StoreSettingsService],
  exports: [StoreSettingsService],
})
export class StoreSettingsModule {}
