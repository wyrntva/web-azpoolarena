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
exports.ReceiptsController = void 0;
const common_1 = require("@nestjs/common");
const receipts_service_1 = require("../services/receipts.service");
const finance_dto_1 = require("../dto/finance.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let ReceiptsController = class ReceiptsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async createType(dto) {
        return this.service.createType(dto);
    }
    async findAllTypes() {
        return this.service.findAllTypes();
    }
    async findTypeById(id) {
        return this.service.findTypeById(id);
    }
    async updateType(id, dto) {
        return this.service.updateType(id, dto);
    }
    async deleteType(id) {
        return this.service.deleteType(id);
    }
    async createReceipt(dto, req) {
        return this.service.createReceipt(dto, req.user.id);
    }
    async findAllReceipts(skipStr, limitStr, startDate, endDate, typeIdStr) {
        const skip = skipStr ? parseInt(skipStr, 10) : 0;
        const limit = limitStr ? parseInt(limitStr, 10) : 100;
        const typeId = typeIdStr ? parseInt(typeIdStr, 10) : undefined;
        const [data, total] = await this.service.findAllReceipts(skip, limit, startDate, endDate, typeId);
        return { data, meta: { total, skip, limit } };
    }
    async findReceiptById(id) {
        return this.service.findReceiptById(id);
    }
    async updateReceipt(id, dto) {
        return this.service.updateReceipt(id, dto);
    }
    async deleteReceipt(id) {
        return this.service.deleteReceipt(id);
    }
};
exports.ReceiptsController = ReceiptsController;
__decorate([
    (0, common_1.Post)('receipt-types'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateReceiptTypeDto]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "createType", null);
__decorate([
    (0, common_1.Get)('receipt-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "findAllTypes", null);
__decorate([
    (0, common_1.Get)('receipt-types/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "findTypeById", null);
__decorate([
    (0, common_1.Put)('receipt-types/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, finance_dto_1.UpdateReceiptTypeDto]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "updateType", null);
__decorate([
    (0, common_1.Delete)('receipt-types/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "deleteType", null);
__decorate([
    (0, common_1.Post)('receipts'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateReceiptDto, Object]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "createReceipt", null);
__decorate([
    (0, common_1.Get)('receipts'),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('start_date')),
    __param(3, (0, common_1.Query)('end_date')),
    __param(4, (0, common_1.Query)('receipt_type_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "findAllReceipts", null);
__decorate([
    (0, common_1.Get)('receipts/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "findReceiptById", null);
__decorate([
    (0, common_1.Put)('receipts/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, finance_dto_1.UpdateReceiptDto]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "updateReceipt", null);
__decorate([
    (0, common_1.Delete)('receipts/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "deleteReceipt", null);
exports.ReceiptsController = ReceiptsController = __decorate([
    (0, common_1.Controller)('api'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [receipts_service_1.ReceiptsService])
], ReceiptsController);
//# sourceMappingURL=receipts.controller.js.map