import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  WiFiConfigEntity,
  QRSessionEntity,
  WorkScheduleEntity,
  AttendanceEntity,
  AttendanceSettingsEntity,
  AdvancePaymentEntity,
  BonusEntity,
  PenaltyEntity,
  QRAccessDeviceEntity,
  QRAccessTokenEntity,
} from './entities';
import { UserEntity } from '../users/entities/user.entity';

import { AttendanceSettingsService } from './services/attendance-settings.service';
import { WorkSchedulesService } from './services/work-schedules.service';
import { AttendancesService } from './services/attendances.service';
import { WifiConfigsService } from './services/wifi-configs.service';
import { PayrollService } from './services/payroll.service';
import { QrAccessService } from './services/qr-access.service';

import { AttendanceSettingsController } from './controllers/attendance-settings.controller';
import { WorkSchedulesController } from './controllers/work-schedules.controller';
import { AttendancesController } from './controllers/attendances.controller';
import { WifiConfigsController } from './controllers/wifi-configs.controller';
import { PayrollController } from './controllers/payroll.controller';
import { QrAccessController } from './controllers/qr-access.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WiFiConfigEntity,
      QRSessionEntity,
      WorkScheduleEntity,
      AttendanceEntity,
      AttendanceSettingsEntity,
      AdvancePaymentEntity,
      BonusEntity,
      PenaltyEntity,
      QRAccessDeviceEntity,
      QRAccessTokenEntity,
      UserEntity,
    ]),
  ],
  controllers: [
    AttendanceSettingsController,
    WorkSchedulesController,
    AttendancesController,
    WifiConfigsController,
    PayrollController,
    QrAccessController,
  ],
  providers: [
    AttendanceSettingsService,
    WorkSchedulesService,
    AttendancesService,
    WifiConfigsService,
    PayrollService,
    QrAccessService,
  ],
  exports: [
    AttendanceSettingsService,
    WorkSchedulesService,
    AttendancesService,
    WifiConfigsService,
    PayrollService,
    QrAccessService,
  ],
})
export class HrModule {}
