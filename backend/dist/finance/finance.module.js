"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const entities_2 = require("../hr/entities");
const receipts_service_1 = require("./services/receipts.service");
const cashflow_service_1 = require("./services/cashflow.service");
const reports_service_1 = require("./services/reports.service");
const receipts_controller_1 = require("./controllers/receipts.controller");
const cashflow_controller_1 = require("./controllers/cashflow.controller");
const reports_controller_1 = require("./controllers/reports.controller");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.ReceiptTypeEntity,
                entities_1.ReceiptEntity,
                entities_1.RevenueEntity,
                entities_1.ExchangeEntity,
                entities_1.SafeEntity,
                entities_1.DebtEntity,
                user_entity_1.UserEntity,
                entities_2.AttendanceEntity,
                entities_2.BonusEntity,
            ]),
        ],
        controllers: [receipts_controller_1.ReceiptsController, cashflow_controller_1.CashflowController, reports_controller_1.ReportsController],
        providers: [receipts_service_1.ReceiptsService, cashflow_service_1.CashflowService, reports_service_1.ReportsService],
        exports: [typeorm_1.TypeOrmModule],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map