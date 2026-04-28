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
exports.QrAccessController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const qr_access_service_1 = require("../services/qr-access.service");
const internal_api_guard_1 = require("../guards/internal-api.guard");
let QrAccessController = class QrAccessController {
    qrAccessService;
    configService;
    constructor(qrAccessService, configService) {
        this.qrAccessService = qrAccessService;
        this.configService = configService;
    }
    async createToken(body) {
        const token = await this.qrAccessService.createToken(body.device_id, body.purpose, body.ttl_seconds);
        const baseUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const qrUrl = `${baseUrl}/attendance/check-in?token=${token.access_token}&type=attendance`;
        return {
            success: true,
            access_token: token.access_token,
            expires_at: token.expires_at,
            qr_url: qrUrl,
            ttl_seconds: body.ttl_seconds || 60,
            message: 'Token created successfully',
        };
    }
    async getDeviceStats(deviceId) {
        return this.qrAccessService.getDeviceStats(deviceId);
    }
    async getTokenStatus(accessToken) {
        return this.qrAccessService.getTokenStatus(accessToken);
    }
    async validateToken(body) {
        const result = await this.qrAccessService.validateToken(body.access_token);
        if (!result.valid) {
            return {
                valid: false,
                message: result.message,
                error_code: result.code,
            };
        }
        return {
            valid: true,
            message: 'Token hợp lệ. Có thể truy cập trang chấm công',
            redirect_url: '/attendance/check-in',
            expires_in_seconds: result.expires_in_seconds,
        };
    }
    async consumeToken(body) {
        await this.qrAccessService.consumeToken(body.access_token, body.user_pin);
        return {
            success: true,
            message: 'Token đã được đánh dấu đã sử dụng',
        };
    }
};
exports.QrAccessController = QrAccessController;
__decorate([
    (0, common_1.Post)('api/internal/qr-access/create'),
    (0, common_1.UseGuards)(internal_api_guard_1.InternalApiGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QrAccessController.prototype, "createToken", null);
__decorate([
    (0, common_1.Get)('api/internal/qr-access/device/:device_id/stats'),
    (0, common_1.UseGuards)(internal_api_guard_1.InternalApiGuard),
    __param(0, (0, common_1.Param)('device_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QrAccessController.prototype, "getDeviceStats", null);
__decorate([
    (0, common_1.Get)('api/internal/qr-access/token-status/:access_token'),
    (0, common_1.UseGuards)(internal_api_guard_1.InternalApiGuard),
    __param(0, (0, common_1.Param)('access_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QrAccessController.prototype, "getTokenStatus", null);
__decorate([
    (0, common_1.Post)('api/qr-access/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QrAccessController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('api/qr-access/consume'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QrAccessController.prototype, "consumeToken", null);
exports.QrAccessController = QrAccessController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [qr_access_service_1.QrAccessService,
        config_1.ConfigService])
], QrAccessController);
//# sourceMappingURL=qr-access.controller.js.map