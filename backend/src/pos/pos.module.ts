import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MenuEntity,
  ProductEntity,
  PosOrderEntity,
  PosOrderItemEntity,
} from './entities';

import { ProductsService } from './services/products.service';
import { MenusService } from './services/menus.service';
import { PosOrdersService } from './services/pos-orders.service';

import { ProductsController } from './controllers/products.controller';
import { MenusController } from './controllers/menus.controller';
import { PosOrdersController } from './controllers/pos-orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuEntity,
      ProductEntity,
      PosOrderEntity,
      PosOrderItemEntity,
    ]),
  ],
  controllers: [ProductsController, MenusController, PosOrdersController],
  providers: [ProductsService, MenusService, PosOrdersService],
  exports: [TypeOrmModule, ProductsService, MenusService, PosOrdersService],
})
export class PosModule {}
