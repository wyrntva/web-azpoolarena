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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("../services/payroll.service");
const hr_dto_1 = require("../dto/hr.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let PayrollController = class PayrollController {
    payrollService;
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async getAdvances(startDate, endDate, userIdStr) {
        const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
        return this.payrollService.findAllAdvances(userId, startDate, endDate);
    }
    async createAdvance(dto, req) {
        return this.payrollService.createAdvance(dto, req.user.id);
    }
    async updateAdvance(id, dto) {
        return this.payrollService.updateAdvance(id, dto);
    }
    async deleteAdvance(id) {
        await this.payrollService.deleteAdvance(id);
        return { message: 'Advance payment deleted successfully' };
    }
    async getBonuses(startDate, endDate, userIdStr) {
        const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
        return this.payrollService.findAllBonuses(userId, startDate, endDate);
    }
    async createBonus(dto, req) {
        return this.payrollService.createBonus(dto, req.user.id);
    }
    async updateBonus(id, dto) {
        return this.payrollService.updateBonus(id, dto);
    }
    async deleteBonus(id) {
        await this.payrollService.deleteBonus(id);
        return { message: 'Bonus deleted successfully' };
    }
    async getPenalties(startDate, endDate, userIdStr) {
        const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
        return this.payrollService.findAllPenalties(userId, startDate, endDate);
    }
    async createPenalty(dto, req) {
        return this.payrollService.createPenalty(dto, req.user.id);
    }
    async updatePenalty(id, dto) {
        return this.payrollService.updatePenalty(id, dto);
    }
    async deletePenalty(id) {
        await this.payrollService.deletePenalty(id);
        return { message: 'Penalty deleted successfully' };
    }
    async getSummary(month) {
        return this.payrollService.getSummary(month);
    }
    async autoGeneratePenalties(startDate, endDate, req) {
        return this.payrollService.autoGeneratePenalties(startDate, endDate, req.user.id);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('advances'),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __param(2, (0, common_1.Query)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getAdvances", null);
__decorate([
    (0, common_1.Post)('advances'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateAdvancePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createAdvance", null);
__decorate([
    (0, common_1.Put)('advances/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hr_dto_1.UpdateAdvancePaymentDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "updateAdvance", null);
__decorate([
    (0, common_1.Delete)('advances/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "deleteAdvance", null);
__decorate([
    (0, common_1.Get)('bonuses'),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __param(2, (0, common_1.Query)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getBonuses", null);
__decorate([
    (0, common_1.Post)('bonuses'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateBonusDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createBonus", null);
__decorate([
    (0, common_1.Put)('bonuses/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hr_dto_1.UpdateBonusDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "updateBonus", null);
__decorate([
    (0, common_1.Delete)('bonuses/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "deleteBonus", null);
__decorate([
    (0, common_1.Get)('penalties'),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __param(2, (0, common_1.Query)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPenalties", null);
__decorate([
    (0, common_1.Post)('penalties'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreatePenaltyDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createPenalty", null);
__decorate([
    (0, common_1.Put)('penalties/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hr_dto_1.UpdatePenaltyDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "updatePenalty", null);
__decorate([
    (0, common_1.Delete)('penalties/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "deletePenalty", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('auto-generate-penalties'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "autoGeneratePenalties", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('api/payroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map