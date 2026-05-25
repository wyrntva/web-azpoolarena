import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class DevicesModule {}
