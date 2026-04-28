import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwitchEntity } from './entities/switch.entity';
import { SwitchesController } from './switches.controller';
import { SwitchesService } from './switches.service';
import { SwitchSchedulerService } from './scheduler/switch-scheduler.service';
import { AreaEntity, TableEntity } from '../areas/entities/area.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SwitchEntity, AreaEntity, TableEntity])],
  controllers: [SwitchesController],
  providers: [SwitchesService, SwitchSchedulerService],
  exports: [SwitchesService],
})
export class SwitchesModule {}
