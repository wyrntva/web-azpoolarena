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
exports.AreasController = void 0;
const common_1 = require("@nestjs/common");
const areas_service_1 = require("../services/areas.service");
const area_dto_1 = require("../dto/area.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
let AreasController = class AreasController {
    areasService;
    constructor(areasService) {
        this.areasService = areasService;
    }
    async findAll() {
        return this.areasService.findAll();
    }
    async findOne(id) {
        return this.areasService.findOne(id);
    }
    async create(dto) {
        return this.areasService.create(dto);
    }
    async update(id, dto) {
        return this.areasService.update(id, dto);
    }
    async remove(id) {
        return this.areasService.remove(id);
    }
    async updateTablePositions(id, layoutData) {
        return this.areasService.updateTablePositions(id, layoutData);
    }
    async updateTable(id, tableId, dto) {
        return this.areasService.updateTable(id, tableId, dto);
    }
    async deleteTable(id, tableId) {
        return this.areasService.deleteTable(id, tableId);
    }
    async verifyDevice(dto) {
        return this.areasService.verifyDevice(dto);
    }
    async checkDeviceStatus(dto) {
        return this.areasService.checkDeviceStatus(dto);
    }
};
exports.AreasController = AreasController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [area_dto_1.CreateAreaDto]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, area_dto_1.UpdateAreaDto]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/update_tables_layout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "updateTablePositions", null);
__decorate([
    (0, common_1.Put)(':id/tables/:tableId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('tableId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, area_dto_1.UpdateTableDto]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "updateTable", null);
__decorate([
    (0, common_1.Delete)(':id/tables/:tableId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('tableId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "deleteTable", null);
__decorate([
    (0, common_1.Post)('device/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [area_dto_1.DeviceActivationRequestDto]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "verifyDevice", null);
__decorate([
    (0, common_1.Post)('device/status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [area_dto_1.DeviceStatusRequestDto]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "checkDeviceStatus", null);
exports.AreasController = AreasController = __decorate([
    (0, common_1.Controller)('api/areas'),
    __metadata("design:paramtypes", [areas_service_1.AreasService])
], AreasController);
//# sourceMappingURL=areas.controller.js.map