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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestQRAccessTokenDto = exports.RegisterQRDeviceDto = exports.UpdatePenaltyDto = exports.CreatePenaltyDto = exports.UpdateBonusDto = exports.CreateBonusDto = exports.UpdateAdvancePaymentDto = exports.CreateAdvancePaymentDto = exports.UpdateWiFiConfigDto = exports.CreateWiFiConfigDto = exports.CreateQRTokenDto = exports.CreateManualAttendanceDto = exports.UpdateAttendanceDto = exports.AttendanceCheckRequestDto = exports.PublicAttendanceCheckRequestDto = exports.UpdateAttendanceSettingsDto = exports.CreateAttendanceSettingsDto = exports.PenaltyTierDto = exports.CopyWeekScheduleRequestDto = exports.CopyScheduleRequestDto = exports.UpdateWorkScheduleDto = exports.CreateWorkScheduleDto = void 0;
const class_validator_1 = require("class-validator");
class CreateWorkScheduleDto {
    user_id;
    work_date;
    start_time;
    end_time;
    allowed_late_minutes;
}
exports.CreateWorkScheduleDto = CreateWorkScheduleDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWorkScheduleDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkScheduleDto.prototype, "work_date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Must be HH:MM format',
    }),
    __metadata("design:type", String)
], CreateWorkScheduleDto.prototype, "start_time", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Must be HH:MM format',
    }),
    __metadata("design:type", String)
], CreateWorkScheduleDto.prototype, "end_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWorkScheduleDto.prototype, "allowed_late_minutes", void 0);
class UpdateWorkScheduleDto {
    start_time;
    end_time;
    allowed_late_minutes;
    is_active;
}
exports.UpdateWorkScheduleDto = UpdateWorkScheduleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkScheduleDto.prototype, "start_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkScheduleDto.prototype, "end_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateWorkScheduleDto.prototype, "allowed_late_minutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateWorkScheduleDto.prototype, "is_active", void 0);
class CopyScheduleRequestDto {
    user_id;
    from_date;
    to_dates;
}
exports.CopyScheduleRequestDto = CopyScheduleRequestDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CopyScheduleRequestDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CopyScheduleRequestDto.prototype, "from_date", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CopyScheduleRequestDto.prototype, "to_dates", void 0);
class CopyWeekScheduleRequestDto {
    from_week_start;
    to_week_start;
    user_ids;
}
exports.CopyWeekScheduleRequestDto = CopyWeekScheduleRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CopyWeekScheduleRequestDto.prototype, "from_week_start", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CopyWeekScheduleRequestDto.prototype, "to_week_start", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], CopyWeekScheduleRequestDto.prototype, "user_ids", void 0);
class PenaltyTierDto {
    max_minutes;
    penalty_amount;
}
exports.PenaltyTierDto = PenaltyTierDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], PenaltyTierDto.prototype, "max_minutes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PenaltyTierDto.prototype, "penalty_amount", void 0);
class CreateAttendanceSettingsDto {
    allowed_late_minutes;
    penalty_tiers;
    early_checkout_grace_minutes;
    early_checkout_penalty;
    absent_penalty;
    auto_absent_enabled;
    notes;
}
exports.CreateAttendanceSettingsDto = CreateAttendanceSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAttendanceSettingsDto.prototype, "allowed_late_minutes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateAttendanceSettingsDto.prototype, "penalty_tiers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAttendanceSettingsDto.prototype, "early_checkout_grace_minutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAttendanceSettingsDto.prototype, "early_checkout_penalty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAttendanceSettingsDto.prototype, "absent_penalty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAttendanceSettingsDto.prototype, "auto_absent_enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAttendanceSettingsDto.prototype, "notes", void 0);
class UpdateAttendanceSettingsDto {
    allowed_late_minutes;
    penalty_tiers;
    early_checkout_grace_minutes;
    early_checkout_penalty;
    absent_penalty;
    auto_absent_enabled;
    notes;
}
exports.UpdateAttendanceSettingsDto = UpdateAttendanceSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAttendanceSettingsDto.prototype, "allowed_late_minutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateAttendanceSettingsDto.prototype, "penalty_tiers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAttendanceSettingsDto.prototype, "early_checkout_grace_minutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAttendanceSettingsDto.prototype, "early_checkout_penalty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAttendanceSettingsDto.prototype, "absent_penalty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAttendanceSettingsDto.prototype, "auto_absent_enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAttendanceSettingsDto.prototype, "notes", void 0);
class PublicAttendanceCheckRequestDto {
    pin;
    qr_token;
    wifi_ssid;
    wifi_bssid;
}
exports.PublicAttendanceCheckRequestDto = PublicAttendanceCheckRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicAttendanceCheckRequestDto.prototype, "pin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicAttendanceCheckRequestDto.prototype, "qr_token", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicAttendanceCheckRequestDto.prototype, "wifi_ssid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicAttendanceCheckRequestDto.prototype, "wifi_bssid", void 0);
class AttendanceCheckRequestDto {
    pin;
    qr_token;
    wifi_ssid;
    wifi_bssid;
}
exports.AttendanceCheckRequestDto = AttendanceCheckRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceCheckRequestDto.prototype, "pin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceCheckRequestDto.prototype, "qr_token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceCheckRequestDto.prototype, "wifi_ssid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceCheckRequestDto.prototype, "wifi_bssid", void 0);
class UpdateAttendanceDto {
    check_in_time;
    check_out_time;
    notes;
}
exports.UpdateAttendanceDto = UpdateAttendanceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateAttendanceDto.prototype, "check_in_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateAttendanceDto.prototype, "check_out_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAttendanceDto.prototype, "notes", void 0);
class CreateManualAttendanceDto {
    user_id;
    date;
    check_in_time;
    check_out_time;
    notes;
}
exports.CreateManualAttendanceDto = CreateManualAttendanceDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateManualAttendanceDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManualAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateManualAttendanceDto.prototype, "check_in_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateManualAttendanceDto.prototype, "check_out_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManualAttendanceDto.prototype, "notes", void 0);
class CreateQRTokenDto {
    token_type;
}
exports.CreateQRTokenDto = CreateQRTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQRTokenDto.prototype, "token_type", void 0);
class CreateWiFiConfigDto {
    ssid;
    bssid;
    ip_range;
    ip_subnet;
    description;
    is_active;
}
exports.CreateWiFiConfigDto = CreateWiFiConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWiFiConfigDto.prototype, "ssid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWiFiConfigDto.prototype, "bssid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWiFiConfigDto.prototype, "ip_range", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWiFiConfigDto.prototype, "ip_subnet", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWiFiConfigDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateWiFiConfigDto.prototype, "is_active", void 0);
class UpdateWiFiConfigDto {
    ssid;
    bssid;
    ip_range;
    ip_subnet;
    description;
    is_active;
}
exports.UpdateWiFiConfigDto = UpdateWiFiConfigDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWiFiConfigDto.prototype, "ssid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWiFiConfigDto.prototype, "bssid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWiFiConfigDto.prototype, "ip_range", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWiFiConfigDto.prototype, "ip_subnet", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWiFiConfigDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateWiFiConfigDto.prototype, "is_active", void 0);
class CreateAdvancePaymentDto {
    user_id;
    date;
    amount;
    notes;
}
exports.CreateAdvancePaymentDto = CreateAdvancePaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAdvancePaymentDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdvancePaymentDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAdvancePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdvancePaymentDto.prototype, "notes", void 0);
class UpdateAdvancePaymentDto {
    date;
    amount;
    notes;
}
exports.UpdateAdvancePaymentDto = UpdateAdvancePaymentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvancePaymentDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAdvancePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdvancePaymentDto.prototype, "notes", void 0);
class CreateBonusDto {
    user_id;
    date;
    amount;
    notes;
}
exports.CreateBonusDto = CreateBonusDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBonusDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBonusDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBonusDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBonusDto.prototype, "notes", void 0);
class UpdateBonusDto {
    date;
    amount;
    notes;
}
exports.UpdateBonusDto = UpdateBonusDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBonusDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateBonusDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBonusDto.prototype, "notes", void 0);
class CreatePenaltyDto {
    user_id;
    date;
    amount;
    notes;
}
exports.CreatePenaltyDto = CreatePenaltyDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePenaltyDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePenaltyDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePenaltyDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePenaltyDto.prototype, "notes", void 0);
class UpdatePenaltyDto {
    date;
    amount;
    notes;
}
exports.UpdatePenaltyDto = UpdatePenaltyDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePenaltyDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePenaltyDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePenaltyDto.prototype, "notes", void 0);
class RegisterQRDeviceDto {
    device_name;
}
exports.RegisterQRDeviceDto = RegisterQRDeviceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterQRDeviceDto.prototype, "device_name", void 0);
class RequestQRAccessTokenDto {
    device_id;
    purpose;
}
exports.RequestQRAccessTokenDto = RequestQRAccessTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQRAccessTokenDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQRAccessTokenDto.prototype, "purpose", void 0);
//# sourceMappingURL=hr.dto.js.map