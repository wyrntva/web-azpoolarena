"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
const entities_2 = require("../finance/entities");
const user_entity_1 = require("../users/entities/user.entity");
const categories_service_1 = require("./services/categories.service");
const units_service_1 = require("./services/units.service");
const inventories_service_1 = require("./services/inventories.service");
const inventory_transactions_service_1 = require("./services/inventory-transactions.service");
const categories_controller_1 = require("./controllers/categories.controller");
const units_controller_1 = require("./controllers/units.controller");
const inventories_controller_1 = require("./controllers/inventories.controller");
const inventory_transactions_controller_1 = require("./controllers/inventory-transactions.controller");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.CategoryEntity,
                entities_1.UnitEntity,
                entities_1.InventoryEntity,
                entities_1.InventoryTransactionEntity,
                entities_1.InventoryTransactionDetailEntity,
                entities_2.ReceiptEntity,
                entities_2.ReceiptTypeEntity,
                user_entity_1.UserEntity,
            ]),
        ],
        controllers: [
            categories_controller_1.CategoriesController,
            units_controller_1.UnitsController,
            inventories_controller_1.InventoriesController,
            inventory_transactions_controller_1.InventoryTransactionsController,
        ],
        providers: [
            categories_service_1.CategoriesService,
            units_service_1.UnitsService,
            inventories_service_1.InventoriesService,
            inventory_transactions_service_1.InventoryTransactionsService,
        ],
        exports: [
            categories_service_1.CategoriesService,
            units_service_1.UnitsService,
            inventories_service_1.InventoriesService,
            inventory_transactions_service_1.InventoryTransactionsService,
        ],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map