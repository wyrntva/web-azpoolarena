import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Ga4Service } from './ga4.service';
import { LoginLogEntity } from './entities/login-log.entity';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoginLogEntity, UserEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, Ga4Service],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
