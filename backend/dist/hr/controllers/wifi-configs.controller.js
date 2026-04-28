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
exports.WifiConfigsController = void 0;
const common_1 = require("@nestjs/common");
const wifi_configs_service_1 = require("../services/wifi-configs.service");
const hr_dto_1 = require("../dto/hr.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let WifiConfigsController = class WifiConfigsController {
    wifiService;
    constructor(wifiService) {
        this.wifiService = wifiService;
    }
    async create(dto) {
        return this.wifiService.create(dto);
    }
    async findAll(isActiveStr) {
        const isActive = isActiveStr === undefined
            ? undefined
            : isActiveStr.toLowerCase() === 'true';
        return this.wifiService.findAll(isActive);
    }
    async findApproved() {
        return this.wifiService.findApproved();
    }
    async findOne(id) {
        return this.wifiService.findOne(id);
    }
    async update(id, dto) {
        return this.wifiService.update(id, dto);
    }
    async remove(id) {
        return this.wifiService.remove(id);
    }
};
exports.WifiConfigsController = WifiConfigsController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateWiFiConfigDto]),
    __metadata("design:returntype", Promise)
], WifiConfigsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Query)('is_active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WifiConfigsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WifiConfigsController.prototype, "findApproved", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WifiConfigsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hr_dto_1.UpdateWiFiConfigDto]),
    __metadata("design:returntype", Promise)
], WifiConfigsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WifiConfigsController.prototype, "remove", null);
exports.WifiConfigsController = WifiConfigsController = __decorate([
    (0, common_1.Controller)('api/wifi-configs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [wifi_configs_service_1.WifiConfigsService])
], WifiConfigsController);
//# sourceMappingURL=wifi-configs.controller.js.map