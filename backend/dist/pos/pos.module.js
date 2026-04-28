"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
const products_service_1 = require("./services/products.service");
const menus_service_1 = require("./services/menus.service");
const pos_orders_service_1 = require("./services/pos-orders.service");
const products_controller_1 = require("./controllers/products.controller");
const menus_controller_1 = require("./controllers/menus.controller");
const pos_orders_controller_1 = require("./controllers/pos-orders.controller");
let PosModule = class PosModule {
};
exports.PosModule = PosModule;
exports.PosModule = PosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.MenuEntity,
                entities_1.ProductEntity,
                entities_1.PosOrderEntity,
                entities_1.PosOrderItemEntity,
            ]),
        ],
        controllers: [products_controller_1.ProductsController, menus_controller_1.MenusController, pos_orders_controller_1.PosOrdersController],
        providers: [products_service_1.ProductsService, menus_service_1.MenusService, pos_orders_service_1.PosOrdersService],
        exports: [typeorm_1.TypeOrmModule, products_service_1.ProductsService, menus_service_1.MenusService, pos_orders_service_1.PosOrdersService],
    })
], PosModule);
//# sourceMappingURL=pos.module.js.map