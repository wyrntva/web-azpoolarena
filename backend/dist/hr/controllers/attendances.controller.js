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
exports.AttendancesController = void 0;
const common_1 = require("@nestjs/common");
const attendances_service_1 = require("../services/attendances.service");
const hr_dto_1 = require("../dto/hr.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let AttendancesController = class AttendancesController {
    attendancesService;
    constructor(attendancesService) {
        this.attendancesService = attendancesService;
    }
    async publicCheck(dto, req) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        return this.attendancesService.publicCheckAttendance(dto, ipAddress);
    }
    async check(dto, req) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        return this.attendancesService.checkAttendance(dto, req.user, ipAddress);
    }
    async getTimesheet(req, userIdStr, startDate, endDate, statusFilter, page, pageSize) {
        const userId = userIdStr ? parseInt(userIdStr, 10) : null;
        return this.attendancesService.getTimesheet(userId, startDate, endDate, statusFilter, page, pageSize, req.user);
    }
    async getMyTimesheet(req, startDate, endDate, page, pageSize) {
        return this.attendancesService.getTimesheet(req.user.id, startDate, endDate, undefined, page, pageSize, req.user);
    }
    async generateQrCode(dto, req) {
        return this.attendancesService.generateQrCode(dto, req.user.id);
    }
    async updateAttendance(id, dto) {
        return this.attendancesService.updateAttendance(id, dto);
    }
    async createManualAttendance(dto) {
        return this.attendancesService.createManualAttendance(dto);
    }
};
exports.AttendancesController = AttendancesController;
__decorate([
    (0, common_1.Post)('public-check'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.PublicAttendanceCheckRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AttendancesController.prototype, "publicCheck", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.AttendanceCheckRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AttendancesController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('timesheet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('user_id')),
    __param(2, (0, common_1.Query)('start_date')),
    __param(3, (0, common_1.Query)('end_date')),
    __param(4, (0, common_1.Query)('status_filter')),
    __param(5, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(6, (0, common_1.Query)('page_size', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AttendancesController.prototype, "getTimesheet", null);
__decorate([
    (0, common_1.Get)('my-timesheet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('start_date')),
    __param(2, (0, common_1.Query)('end_date')),
    __param(3, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('page_size', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AttendancesController.prototype, "getMyTimesheet", null);
__decorate([
    (0, common_1.Post)('qr/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateQRTokenDto, Object]),
    __metadata("design:returntype", Promise)
], AttendancesController.prototype, "generateQrCode", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hr_dto_1.UpdateAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendancesController.prototype, "updateAttendance", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateManualAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendancesController.prototype, "createManualAttendance", null);
exports.AttendancesController = AttendancesController = __decorate([
    (0, common_1.Controller)('api/attendance'),
    __metadata("design:paramtypes", [attendances_service_1.AttendancesService])
], AttendancesController);
//# sourceMappingURL=attendances.controller.js.map