"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryTransactionsController = void 0;
const common_1 = require("@nestjs/common");
const inventory_transactions_service_1 = require("../services/inventory-transactions.service");
const inventory_dto_1 = require("../dto/inventory.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let InventoryTransactionsController = class InventoryTransactionsController {
    txService;
    constructor(txService) {
        this.txService = txService;
    }
    async createIn(dto, req) {
        return this.txService.createInTransaction(dto, req.user.id);
    }
    async getIns(skipStr, limitStr) {
        const skip = skipStr ? parseInt(skipStr, 10) : 0;
        const limit = limitStr ? parseInt(limitStr, 10) : 100;
        return this.txService.findIns(skip, limit);
    }
    async createOut(dto, req) {
        return this.txService.createOutTransaction(dto, req.user.id);
    }
    async getOuts(skipStr, limitStr) {
        const skip = skipStr ? parseInt(skipStr, 10) : 0;
        const limit = limitStr ? parseInt(limitStr, 10) : 100;
        return this.txService.findOuts(skip, limit);
    }
};
exports.InventoryTransactionsController = InventoryTransactionsController;
__decorate([
    (0, common_1.Post)('inventory-in'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryTransactionsController.prototype, "createIn", null);
__decorate([
    (0, common_1.Get)('inventory-in'),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryTransactionsController.prototype, "getIns", null);
__decorate([
    (0, common_1.Post)('inventory-out'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryTransactionsController.prototype, "createOut", null);
__decorate([
    (0, common_1.Get)('inventory-out'),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryTransactionsController.prototype, "getOuts", null);
exports.InventoryTransactionsController = InventoryTransactionsController = __decorate([
    (0, common_1.Controller)('api'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [inventory_transactions_service_1.InventoryTransactionsService])
], InventoryTransactionsController);
//# sourceMappingURL=inventory-transactions.controller.js.map