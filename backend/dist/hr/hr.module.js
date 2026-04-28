"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const attendance_settings_service_1 = require("./services/attendance-settings.service");
const work_schedules_service_1 = require("./services/work-schedules.service");
const attendances_service_1 = require("./services/attendances.service");
const wifi_configs_service_1 = require("./services/wifi-configs.service");
const payroll_service_1 = require("./services/payroll.service");
const qr_access_service_1 = require("./services/qr-access.service");
const attendance_settings_controller_1 = require("./controllers/attendance-settings.controller");
const work_schedules_controller_1 = require("./controllers/work-schedules.controller");
const attendances_controller_1 = require("./controllers/attendances.controller");
const wifi_configs_controller_1 = require("./controllers/wifi-configs.controller");
const payroll_controller_1 = require("./controllers/payroll.controller");
const qr_access_controller_1 = require("./controllers/qr-access.controller");
let HrModule = class HrModule {
};
exports.HrModule = HrModule;
exports.HrModule = HrModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.WiFiConfigEntity,
                entities_1.QRSessionEntity,
                entities_1.WorkScheduleEntity,
                entities_1.AttendanceEntity,
                entities_1.AttendanceSettingsEntity,
                entities_1.AdvancePaymentEntity,
                entities_1.BonusEntity,
                entities_1.PenaltyEntity,
                entities_1.QRAccessDeviceEntity,
                entities_1.QRAccessTokenEntity,
                user_entity_1.UserEntity,
            ]),
        ],
        controllers: [
            attendance_settings_controller_1.AttendanceSettingsController,
            work_schedules_controller_1.WorkSchedulesController,
            attendances_controller_1.AttendancesController,
            wifi_configs_controller_1.WifiConfigsController,
            payroll_controller_1.PayrollController,
            qr_access_controller_1.QrAccessController,
        ],
        providers: [
            attendance_settings_service_1.AttendanceSettingsService,
            work_schedules_service_1.WorkSchedulesService,
            attendances_service_1.AttendancesService,
            wifi_configs_service_1.WifiConfigsService,
            payroll_service_1.PayrollService,
            qr_access_service_1.QrAccessService,
        ],
        exports: [
            attendance_settings_service_1.AttendanceSettingsService,
            work_schedules_service_1.WorkSchedulesService,
            attendances_service_1.AttendancesService,
            wifi_configs_service_1.WifiConfigsService,
            payroll_service_1.PayrollService,
            qr_access_service_1.QrAccessService,
        ],
    })
], HrModule);
//# sourceMappingURL=hr.module.js.map