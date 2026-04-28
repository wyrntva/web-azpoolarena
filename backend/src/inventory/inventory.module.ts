import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  CategoryEntity,
  UnitEntity,
  InventoryEntity,
  InventoryTransactionEntity,
  InventoryTransactionDetailEntity,
} from './entities';
import { ReceiptEntity, ReceiptTypeEntity } from '../finance/entities';
import { UserEntity } from '../users/entities/user.entity';

import { CategoriesService } from './services/categories.service';
import { UnitsService } from './services/units.service';
import { InventoriesService } from './services/inventories.service';
import { InventoryTransactionsService } from './services/inventory-transactions.service';

import { CategoriesController } from './controllers/categories.controller';
import { UnitsController } from './controllers/units.controller';
import { InventoriesController } from './controllers/inventories.controller';
import { InventoryTransactionsController } from './controllers/inventory-transactions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      UnitEntity,
      InventoryEntity,
      InventoryTransactionEntity,
      InventoryTransactionDetailEntity,
      ReceiptEntity,
      ReceiptTypeEntity,
      UserEntity,
    ]),
  ],
  controllers: [
    CategoriesController,
    UnitsController,
    InventoriesController,
    InventoryTransactionsController,
  ],
  providers: [
    CategoriesService,
    UnitsService,
    InventoriesService,
    InventoryTransactionsService,
  ],
  exports: [
    CategoriesService,
    UnitsService,
    InventoriesService,
    InventoryTransactionsService,
  ],
})
export class InventoryModule {}
