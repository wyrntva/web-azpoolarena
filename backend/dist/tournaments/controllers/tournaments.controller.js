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
exports.TournamentsController = void 0;
const common_1 = require("@nestjs/common");
const tournaments_service_1 = require("../services/tournaments.service");
const tournaments_dto_1 = require("../dto/tournaments.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let TournamentsController = class TournamentsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(skipStr, limitStr) {
        const skip = skipStr ? parseInt(skipStr, 10) : 0;
        const limit = limitStr ? parseInt(limitStr, 10) : 50;
        const [data, total] = await this.service.findAll(skip, limit);
        return { data, meta: { total, skip, limit } };
    }
    async findOne(id) {
        return this.service.findOne(id);
    }
    async findBySlug(slug) {
        return this.service.findBySlug(slug);
    }
    async getMatches(id) {
        return this.service.getMatches(id);
    }
    async updateMatch(id, dto) {
        return this.service.updateMatch(id, dto);
    }
    async generateMatches(id, body) {
        return this.service.generateMatches(id, body.matches);
    }
    async getRegistrations(id) {
        return this.service.getRegistrations(id);
    }
    async getActiveMatch(tableName) {
        return this.service.getActiveMatchForDevice(tableName);
    }
    async updateDeviceMatchScore(id, dto) {
        return this.service.updateDeviceMatchScore(id, dto);
    }
    async updateDeviceMatchCheckIn(id, dto) {
        return this.service.updateDeviceMatchCheckIn(id, dto);
    }
};
exports.TournamentsController = TournamentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)(':id/matches'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getMatches", null);
__decorate([
    (0, common_1.Put)('matches/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, tournaments_dto_1.UpdateMatchDto]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "updateMatch", null);
__decorate([
    (0, common_1.Post)(':id/matches/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "generateMatches", null);
__decorate([
    (0, common_1.Get)(':id/registrations'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getRegistrations", null);
__decorate([
    (0, common_1.Get)('device/active-match'),
    __param(0, (0, common_1.Query)('table_name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getActiveMatch", null);
__decorate([
    (0, common_1.Put)('device/active-match/:id/score'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "updateDeviceMatchScore", null);
__decorate([
    (0, common_1.Put)('device/active-match/:id/check-in'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "updateDeviceMatchCheckIn", null);
exports.TournamentsController = TournamentsController = __decorate([
    (0, common_1.Controller)('api/tournaments'),
    __metadata("design:paramtypes", [tournaments_service_1.TournamentsService])
], TournamentsController);
//# sourceMappingURL=tournaments.controller.js.map