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
exports.CashflowController = void 0;
const common_1 = require("@nestjs/common");
const cashflow_service_1 = require("../services/cashflow.service");
const finance_dto_1 = require("../dto/finance.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let CashflowController = class CashflowController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getRevenue(date) {
        return this.service.findRevenueByDate(date);
    }
    async getMonthRevenue(month) {
        return this.service.getRevenuesByMonth(month);
    }
    async upsertRevenue(date, dto, req) {
        return this.service.upsertRevenue(dto, date, req.user.id);
    }
    async createExchange(dto, req) {
        return this.service.createExchange(dto, req.user.id);
    }
    async getExchanges(startDate, endDate) {
        return this.service.findExchanges(startDate, endDate);
    }
    async deleteExchange(id) {
        return this.service.deleteExchange(id);
    }
    async createSafe(dto, req) {
        return this.service.createSafe(dto, req.user.id);
    }
    async getSafes(startDate, endDate) {
        return this.service.findSafes(startDate, endDate);
    }
    async deleteSafe(id) {
        return this.service.deleteSafe(id);
    }
    async createDebt(dto, req) {
        return this.service.createDebt(dto, req.user.id);
    }
    async getDebts(isPaidStr) {
        let isPaid = undefined;
        if (isPaidStr === 'true')
            isPaid = true;
        if (isPaidStr === 'false')
            isPaid = false;
        return this.service.findDebts(isPaid);
    }
    async updateDebt(id, dto) {
        return this.service.updateDebt(id, dto);
    }
    async deleteDebt(id) {
        return this.service.deleteDebt(id);
    }
};
exports.CashflowController = CashflowController;
__decorate([
    (0, common_1.Get)('revenues/:date'),
    __param(0, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('revenues/month/:month'),
    __param(0, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "getMonthRevenue", null);
__decorate([
    (0, common_1.Post)('revenues/:date'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('date')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "upsertRevenue", null);
__decorate([
    (0, common_1.Post)('exchanges'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateExchangeDto, Object]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "createExchange", null);
__decorate([
    (0, common_1.Get)('exchanges'),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "getExchanges", null);
__decorate([
    (0, common_1.Delete)('exchanges/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "deleteExchange", null);
__decorate([
    (0, common_1.Post)('safes'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateSafeDto, Object]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "createSafe", null);
__decorate([
    (0, common_1.Get)('safes'),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "getSafes", null);
__decorate([
    (0, common_1.Delete)('safes/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "deleteSafe", null);
__decorate([
    (0, common_1.Post)('debts'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateDebtDto, Object]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "createDebt", null);
__decorate([
    (0, common_1.Get)('debts'),
    __param(0, (0, common_1.Query)('is_paid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "getDebts", null);
__decorate([
    (0, common_1.Put)('debts/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, finance_dto_1.UpdateDebtDto]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "updateDebt", null);
__decorate([
    (0, common_1.Delete)('debts/:id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CashflowController.prototype, "deleteDebt", null);
exports.CashflowController = CashflowController = __decorate([
    (0, common_1.Controller)('api'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [cashflow_service_1.CashflowService])
], CashflowController);
//# sourceMappingURL=cashflow.controller.js.map