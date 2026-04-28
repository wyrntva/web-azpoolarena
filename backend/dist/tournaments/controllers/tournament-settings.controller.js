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
exports.TournamentSettingsController = void 0;
const common_1 = require("@nestjs/common");
const tournament_settings_service_1 = require("../services/tournament-settings.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let TournamentSettingsController = class TournamentSettingsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getRanks() { return this.service.getRanks(); }
    async getRank(id) { return this.service.getRank(id); }
    async createRank(dto) { return this.service.createRank(dto); }
    async updateRank(id, dto) { return this.service.updateRank(id, dto); }
    async deleteRank(id) { return this.service.deleteRank(id); }
    async getRounds() { return this.service.getRounds(); }
    async getRound(id) { return this.service.getRound(id); }
    async createRound(dto) { return this.service.createRound(dto); }
    async updateRound(id, dto) { return this.service.updateRound(id, dto); }
    async deleteRound(id) { return this.service.deleteRound(id); }
    async getScoringRules() { return this.service.getScoringRules(); }
    async getScoringRule(id) { return this.service.getScoringRule(id); }
    async createScoringRule(dto) { return this.service.createScoringRule(dto); }
    async updateScoringRule(id, dto) { return this.service.updateScoringRule(id, dto); }
    async deleteScoringRule(id) { return this.service.deleteScoringRule(id); }
};
exports.TournamentSettingsController = TournamentSettingsController;
__decorate([
    (0, common_1.Get)('ranks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "getRanks", null);
__decorate([
    (0, common_1.Get)('ranks/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "getRank", null);
__decorate([
    (0, common_1.Post)('ranks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "createRank", null);
__decorate([
    (0, common_1.Put)('ranks/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "updateRank", null);
__decorate([
    (0, common_1.Delete)('ranks/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "deleteRank", null);
__decorate([
    (0, common_1.Get)('rounds'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "getRounds", null);
__decorate([
    (0, common_1.Get)('rounds/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "getRound", null);
__decorate([
    (0, common_1.Post)('rounds'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "createRound", null);
__decorate([
    (0, common_1.Put)('rounds/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "updateRound", null);
__decorate([
    (0, common_1.Delete)('rounds/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "deleteRound", null);
__decorate([
    (0, common_1.Get)('scoring-rules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "getScoringRules", null);
__decorate([
    (0, common_1.Get)('scoring-rules/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "getScoringRule", null);
__decorate([
    (0, common_1.Post)('scoring-rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "createScoringRule", null);
__decorate([
    (0, common_1.Put)('scoring-rules/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "updateScoringRule", null);
__decorate([
    (0, common_1.Delete)('scoring-rules/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TournamentSettingsController.prototype, "deleteScoringRule", null);
exports.TournamentSettingsController = TournamentSettingsController = __decorate([
    (0, common_1.Controller)('api/tournament-settings'),
    __metadata("design:paramtypes", [tournament_settings_service_1.TournamentSettingsService])
], TournamentSettingsController);
//# sourceMappingURL=tournament-settings.controller.js.map