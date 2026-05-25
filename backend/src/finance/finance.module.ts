import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ReceiptTypeEntity,
  ReceiptEntity,
  RevenueEntity,
  ExchangeEntity,
  SafeEntity,
  DebtEntity,
} from './entities';
import { UserEntity } from '../users/entities/user.entity';
import { AttendanceEntity, BonusEntity } from '../hr/entities';

import { ReceiptsService } from './services/receipts.service';
import { CashflowService } from './services/cashflow.service';
import { ReportsService } from './services/reports.service';

import { ReceiptsController } from './controllers/receipts.controller';
import { CashflowController } from './controllers/cashflow.controller';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReceiptTypeEntity,
      ReceiptEntity,
      RevenueEntity,
      ExchangeEntity,
      SafeEntity,
      DebtEntity,
      UserEntity,
      AttendanceEntity,
      BonusEntity,
    ]),
  ],
  controllers: [ReceiptsController, CashflowController, ReportsController],
  providers: [ReceiptsService, CashflowService, ReportsService],
  exports: [TypeOrmModule],
})
export class FinanceModule {}
