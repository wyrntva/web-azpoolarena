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
exports.AttendanceSettingsController = void 0;
const common_1 = require("@nestjs/common");
const attendance_settings_service_1 = require("../services/attendance-settings.service");
const hr_dto_1 = require("../dto/hr.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const auth_decorators_1 = require("../../auth/decorators/auth.decorators");
let AttendanceSettingsController = class AttendanceSettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getSettings() {
        return this.settingsService.getSettings();
    }
    async updateSettings(dto) {
        return this.settingsService.updateSettings(dto);
    }
    async createSettings(dto) {
        return this.settingsService.createSettings(dto);
    }
};
exports.AttendanceSettingsController = AttendanceSettingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceSettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)(),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.UpdateAttendanceSettingsDto]),
    __metadata("design:returntype", Promise)
], AttendanceSettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.Roles)('admin', 'Super Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_dto_1.CreateAttendanceSettingsDto]),
    __metadata("design:returntype", Promise)
], AttendanceSettingsController.prototype, "createSettings", null);
exports.AttendanceSettingsController = AttendanceSettingsController = __decorate([
    (0, common_1.Controller)('api/attendance-settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [attendance_settings_service_1.AttendanceSettingsService])
], AttendanceSettingsController);
//# sourceMappingURL=attendance-settings.controller.js.map