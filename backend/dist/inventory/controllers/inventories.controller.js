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
exports.InventoriesController = void 0;
const common_1 = require("@nestjs/common");
const inventories_service_1 = require("../services/inventories.service");
const inventory_dto_1 = require("../dto/inventory.dto");
const entities_1 = require("../entities");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let InventoriesController = class InventoriesController {
    inventoriesService;
    constructor(inventoriesService) {
        this.inventoriesService = inventoriesService;
    }
    async create(dto, req) {
        return this.inventoriesService.create(dto, req.user.id);
    }
    async findAll(skipStr, limitStr, statusFilter, search) {
        const skip = skipStr ? parseInt(skipStr, 10) : 0;
        const limit = limitStr ? parseInt(limitStr, 10) : 100;
        return this.inventoriesService.findAll(skip, limit, statusFilter, search);
    }
    async findOne(id) {
        return this.inventoriesService.findOne(id);
    }
    async update(id, dto) {
        return this.inventoriesService.update(id, dto);
    }
    async remove(id) {
        return this.inventoriesService.remove(id);
    }
};
exports.InventoriesController = InventoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateInventoryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status_filter')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventory_dto_1.UpdateInventoryDto]),
    __metadata("design:returntype", Promise)
], InventoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoriesController.prototype, "remove", null);
exports.InventoriesController = InventoriesController = __decorate([
    (0, common_1.Controller)('api/inventories'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [inventories_service_1.InventoriesService])
], InventoriesController);
//# sourceMappingURL=inventories.controller.js.map