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
exports.PosOrdersController = void 0;
const common_1 = require("@nestjs/common");
const pos_orders_service_1 = require("../services/pos-orders.service");
const pos_order_dto_1 = require("../dto/pos-order.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
let PosOrdersController = class PosOrdersController {
    posOrdersService;
    constructor(posOrdersService) {
        this.posOrdersService = posOrdersService;
    }
    async create(dto) {
        return this.posOrdersService.create(dto);
    }
    async findAll(orderType, tableId, areaId) {
        return this.posOrdersService.findAll(orderType, tableId ? parseInt(tableId, 10) : undefined, areaId ? parseInt(areaId, 10) : undefined);
    }
    async update(id, dto) {
        return this.posOrdersService.update(id, dto);
    }
    async remove(id) {
        return this.posOrdersService.remove(id);
    }
    async confirmScoreboardOrder(id) {
        return this.posOrdersService.confirmScoreboardOrder(id);
    }
};
exports.PosOrdersController = PosOrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_order_dto_1.PosOrderCreateDto]),
    __metadata("design:returntype", Promise)
], PosOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('order_type')),
    __param(1, (0, common_1.Query)('table_id')),
    __param(2, (0, common_1.Query)('area_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PosOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pos_order_dto_1.PosOrderCreateDto]),
    __metadata("design:returntype", Promise)
], PosOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PosOrdersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PosOrdersController.prototype, "confirmScoreboardOrder", null);
exports.PosOrdersController = PosOrdersController = __decorate([
    (0, common_1.Controller)('api/pos/orders'),
    __metadata("design:paramtypes", [pos_orders_service_1.PosOrdersService])
], PosOrdersController);
//# sourceMappingURL=pos-orders.controller.js.map