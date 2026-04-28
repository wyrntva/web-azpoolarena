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
exports.WorkSchedulesController = void 0;
const common_1 = require("@nestjs/common");
const work_schedules_service_1 = require("../services/work-schedules.service");
const hr_dto_1 = require("../dto/hr.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let WorkSchedulesController = class WorkSchedulesController {
    schedulesService;
    constructor(schedulesService) {
        this.schedulesService = schedulesService;
    }
    async create(dto) {
        return this.schedulesService.create(dto);
    }
    async findAll(req, userIdStr, startDate, endDate, isActiveStr) {
        const userRole = req.user.role?.name;
        const isPrivileged = req.user.is_admin ||
            ['Thu ngân', 'accountant'].includes(userRole) ||
            req.user.role_id === 5;
        if (!isPrivileged) {
            return this.schedulesService.findMySchedules(req.user.id, startDate, endDate);
        }
        const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
        const isActive = isActiveStr
            ? isActiveStr.toLowerCase() === 'true'
            : undefined;
        return this.schedulesService.findAll(userId, startDate, endDate, isActive);
    }
    async getMySchedules(req, startDate, endDate) {
        return this.schedulesService.findMySchedules(req.user.id, startDate, endDate);
    }
    async findOne(id, req) {
        return this.schedulesService.findOne(id, req.user.id, req.user.is_admin);
    }
    async update(id, dto) {
        return this.schedulesService.update(id, dto);
    }
    async remove(id) {
        return this.schedulesService.remove(id);
    }
    async copySchedule(dto) {
        return this.schedulesService.copySchedule(dto);
    }
    async copyWeekSchedule(dto) {
        return this.schedulesService.copyWeekSchedule(dto);
    }
};
exports.WorkSchedulesController = WorkSchedulesController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateWorkScheduleDto]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('user_id')),
    __param(2, (0, common_1.Query)('start_date')),
    __param(3, (0, common_1.Query)('end_date')),
    __param(4, (0, common_1.Query)('is_active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('start_date')),
    __param(2, (0, common_1.Query)('end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "getMySchedules", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hr_dto_1.UpdateWorkScheduleDto]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('copy-schedule'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CopyScheduleRequestDto]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "copySchedule", null);
__decorate([
    (0, common_1.Post)('copy-week-schedule'),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CopyWeekScheduleRequestDto]),
    __metadata("design:returntype", Promise)
], WorkSchedulesController.prototype, "copyWeekSchedule", null);
exports.WorkSchedulesController = WorkSchedulesController = __decorate([
    (0, common_1.Controller)('api/work-schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [work_schedules_service_1.WorkSchedulesService])
], WorkSchedulesController);
//# sourceMappingURL=work-schedules.controller.js.map