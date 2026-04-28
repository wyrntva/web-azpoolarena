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
exports.QRAccessTokenEntity = exports.QRAccessDeviceEntity = exports.PenaltyEntity = exports.BonusEntity = exports.AdvancePaymentEntity = exports.AttendanceSettingsEntity = exports.AttendanceEntity = exports.WorkScheduleEntity = exports.QRSessionEntity = exports.WiFiConfigEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../common/enums");
let WiFiConfigEntity = class WiFiConfigEntity {
    id;
    ssid;
    bssid;
    ip_range;
    ip_subnet;
    description;
    is_active;
    created_at;
    updated_at;
};
exports.WiFiConfigEntity = WiFiConfigEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WiFiConfigEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], WiFiConfigEntity.prototype, "ssid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 17, nullable: true }),
    __metadata("design:type", String)
], WiFiConfigEntity.prototype, "bssid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], WiFiConfigEntity.prototype, "ip_range", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], WiFiConfigEntity.prototype, "ip_subnet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], WiFiConfigEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], WiFiConfigEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WiFiConfigEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WiFiConfigEntity.prototype, "updated_at", void 0);
exports.WiFiConfigEntity = WiFiConfigEntity = __decorate([
    (0, typeorm_1.Entity)('wifi_configs')
], WiFiConfigEntity);
let QRSessionEntity = class QRSessionEntity {
    id;
    qr_token;
    token_type;
    expires_at;
    is_used;
    used_by;
    used_at;
    created_at;
};
exports.QRSessionEntity = QRSessionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QRSessionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], QRSessionEntity.prototype, "qr_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.QRTokenType }),
    __metadata("design:type", String)
], QRSessionEntity.prototype, "token_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], QRSessionEntity.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], QRSessionEntity.prototype, "is_used", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], QRSessionEntity.prototype, "used_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], QRSessionEntity.prototype, "used_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QRSessionEntity.prototype, "created_at", void 0);
exports.QRSessionEntity = QRSessionEntity = __decorate([
    (0, typeorm_1.Entity)('qr_sessions')
], QRSessionEntity);
let WorkScheduleEntity = class WorkScheduleEntity {
    id;
    user_id;
    work_date;
    start_time;
    end_time;
    allowed_late_minutes;
    is_active;
    created_at;
    updated_at;
    attendances;
    user;
};
exports.WorkScheduleEntity = WorkScheduleEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WorkScheduleEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WorkScheduleEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], WorkScheduleEntity.prototype, "work_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5 }),
    __metadata("design:type", String)
], WorkScheduleEntity.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5 }),
    __metadata("design:type", String)
], WorkScheduleEntity.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkScheduleEntity.prototype, "allowed_late_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], WorkScheduleEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkScheduleEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkScheduleEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AttendanceEntity, (a) => a.work_schedule),
    __metadata("design:type", Array)
], WorkScheduleEntity.prototype, "attendances", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('UserEntity'),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], WorkScheduleEntity.prototype, "user", void 0);
exports.WorkScheduleEntity = WorkScheduleEntity = __decorate([
    (0, typeorm_1.Entity)('work_schedules')
], WorkScheduleEntity);
let AttendanceEntity = class AttendanceEntity {
    id;
    user_id;
    work_schedule_id;
    date;
    check_in_time;
    check_out_time;
    check_in_qr_token;
    check_out_qr_token;
    wifi_ssid;
    wifi_bssid;
    ip_address;
    status;
    notes;
    created_at;
    updated_at;
    work_schedule;
    user;
};
exports.AttendanceEntity = AttendanceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AttendanceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AttendanceEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AttendanceEntity.prototype, "work_schedule_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AttendanceEntity.prototype, "check_in_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AttendanceEntity.prototype, "check_out_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "check_in_qr_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "check_out_qr_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "wifi_ssid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 17, nullable: true }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "wifi_bssid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.AttendanceStatus,
        default: enums_1.AttendanceStatus.ABSENT,
    }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AttendanceEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => WorkScheduleEntity, (ws) => ws.attendances),
    (0, typeorm_1.JoinColumn)({ name: 'work_schedule_id' }),
    __metadata("design:type", WorkScheduleEntity)
], AttendanceEntity.prototype, "work_schedule", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('UserEntity'),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], AttendanceEntity.prototype, "user", void 0);
exports.AttendanceEntity = AttendanceEntity = __decorate([
    (0, typeorm_1.Entity)('attendances')
], AttendanceEntity);
let AttendanceSettingsEntity = class AttendanceSettingsEntity {
    id;
    allowed_late_minutes;
    penalty_tiers;
    early_checkout_grace_minutes;
    early_checkout_penalty;
    absent_penalty;
    auto_absent_enabled;
    notes;
    is_active;
    created_at;
    updated_at;
};
exports.AttendanceSettingsEntity = AttendanceSettingsEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AttendanceSettingsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 15 }),
    __metadata("design:type", Number)
], AttendanceSettingsEntity.prototype, "allowed_late_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AttendanceSettingsEntity.prototype, "penalty_tiers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 10 }),
    __metadata("design:type", Number)
], AttendanceSettingsEntity.prototype, "early_checkout_grace_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 50000 }),
    __metadata("design:type", Number)
], AttendanceSettingsEntity.prototype, "early_checkout_penalty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 100000 }),
    __metadata("design:type", Number)
], AttendanceSettingsEntity.prototype, "absent_penalty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AttendanceSettingsEntity.prototype, "auto_absent_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AttendanceSettingsEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AttendanceSettingsEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceSettingsEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceSettingsEntity.prototype, "updated_at", void 0);
exports.AttendanceSettingsEntity = AttendanceSettingsEntity = __decorate([
    (0, typeorm_1.Entity)('attendance_settings')
], AttendanceSettingsEntity);
let AdvancePaymentEntity = class AdvancePaymentEntity {
    id;
    user_id;
    date;
    amount;
    notes;
    created_by;
    created_at;
    updated_at;
};
exports.AdvancePaymentEntity = AdvancePaymentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AdvancePaymentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AdvancePaymentEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], AdvancePaymentEntity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], AdvancePaymentEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdvancePaymentEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AdvancePaymentEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AdvancePaymentEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AdvancePaymentEntity.prototype, "updated_at", void 0);
exports.AdvancePaymentEntity = AdvancePaymentEntity = __decorate([
    (0, typeorm_1.Entity)('advance_payments')
], AdvancePaymentEntity);
let BonusEntity = class BonusEntity {
    id;
    user_id;
    date;
    amount;
    notes;
    created_by;
    created_at;
    updated_at;
};
exports.BonusEntity = BonusEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BonusEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BonusEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], BonusEntity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], BonusEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BonusEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BonusEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BonusEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BonusEntity.prototype, "updated_at", void 0);
exports.BonusEntity = BonusEntity = __decorate([
    (0, typeorm_1.Entity)('bonuses')
], BonusEntity);
let PenaltyEntity = class PenaltyEntity {
    id;
    user_id;
    date;
    amount;
    notes;
    created_by;
    created_at;
    updated_at;
};
exports.PenaltyEntity = PenaltyEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PenaltyEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PenaltyEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PenaltyEntity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], PenaltyEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PenaltyEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PenaltyEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PenaltyEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PenaltyEntity.prototype, "updated_at", void 0);
exports.PenaltyEntity = PenaltyEntity = __decorate([
    (0, typeorm_1.Entity)('penalties')
], PenaltyEntity);
let QRAccessDeviceEntity = class QRAccessDeviceEntity {
    id;
    device_id;
    device_name;
    api_key_hash;
    is_active;
    last_used_at;
    created_at;
};
exports.QRAccessDeviceEntity = QRAccessDeviceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QRAccessDeviceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], QRAccessDeviceEntity.prototype, "device_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], QRAccessDeviceEntity.prototype, "device_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], QRAccessDeviceEntity.prototype, "api_key_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], QRAccessDeviceEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], QRAccessDeviceEntity.prototype, "last_used_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QRAccessDeviceEntity.prototype, "created_at", void 0);
exports.QRAccessDeviceEntity = QRAccessDeviceEntity = __decorate([
    (0, typeorm_1.Entity)('qr_access_devices')
], QRAccessDeviceEntity);
let QRAccessTokenEntity = class QRAccessTokenEntity {
    id;
    access_token;
    device_id;
    purpose;
    expires_at;
    is_used;
    used_at;
    used_by_pin;
    created_at;
    device;
};
exports.QRAccessTokenEntity = QRAccessTokenEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QRAccessTokenEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], QRAccessTokenEntity.prototype, "access_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], QRAccessTokenEntity.prototype, "device_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], QRAccessTokenEntity.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], QRAccessTokenEntity.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], QRAccessTokenEntity.prototype, "is_used", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], QRAccessTokenEntity.prototype, "used_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 4, nullable: true }),
    __metadata("design:type", String)
], QRAccessTokenEntity.prototype, "used_by_pin", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QRAccessTokenEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => QRAccessDeviceEntity),
    (0, typeorm_1.JoinColumn)({ name: 'device_id', referencedColumnName: 'device_id' }),
    __metadata("design:type", QRAccessDeviceEntity)
], QRAccessTokenEntity.prototype, "device", void 0);
exports.QRAccessTokenEntity = QRAccessTokenEntity = __decorate([
    (0, typeorm_1.Entity)('qr_access_tokens')
], QRAccessTokenEntity);
//# sourceMappingURL=entities.js.map