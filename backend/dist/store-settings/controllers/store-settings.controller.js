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
exports.StoreSettingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const store_settings_service_1 = require("../services/store-settings.service");
const store_settings_dto_1 = require("../dto/store-settings.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let StoreSettingsController = class StoreSettingsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSettings() {
        return this.service.getSettings();
    }
    async getPublicSettings() {
        return this.service.getSettings();
    }
    async updateSettings(dto) {
        return this.service.updateSettings(dto);
    }
    async putSettings(dto) {
        return this.service.updateSettings(dto);
    }
    async uploadBanner(type, file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        const url = `/uploads/${file.filename}`;
        return this.service.addBanner(type, url);
    }
    async deleteMultiBanner(type, index) {
        return this.service.removeBanner(type, parseInt(index, 10));
    }
    async deleteSingleBanner(type) {
        return this.service.removeSingleBanner(type);
    }
};
exports.StoreSettingsController = StoreSettingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StoreSettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StoreSettingsController.prototype, "getPublicSettings", null);
__decorate([
    (0, common_1.Patch)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [store_settings_dto_1.UpdateStoreSettingsDto]),
    __metadata("design:returntype", Promise)
], StoreSettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [store_settings_dto_1.UpdateStoreSettingsDto]),
    __metadata("design:returntype", Promise)
], StoreSettingsController.prototype, "putSettings", null);
__decorate([
    (0, common_1.Post)('banner/:type'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                cb(null, `${req.params.type}-${uniqueSuffix}${ext}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StoreSettingsController.prototype, "uploadBanner", null);
__decorate([
    (0, common_1.Delete)('banner/:type/:index'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('index')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StoreSettingsController.prototype, "deleteMultiBanner", null);
__decorate([
    (0, common_1.Delete)('banner/:type'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoreSettingsController.prototype, "deleteSingleBanner", null);
exports.StoreSettingsController = StoreSettingsController = __decorate([
    (0, common_1.Controller)('api/store-settings'),
    __metadata("design:paramtypes", [store_settings_service_1.StoreSettingsService])
], StoreSettingsController);
//# sourceMappingURL=store-settings.controller.js.map