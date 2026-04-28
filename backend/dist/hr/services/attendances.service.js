"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendancesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const user_entity_1 = require("../../users/entities/user.entity");
const enums_1 = require("../../common/enums");
const attendance_helpers_1 = require("../helpers/attendance.helpers");
const moment_1 = __importDefault(require("moment"));
const crypto = __importStar(require("crypto"));
let AttendancesService = class AttendancesService {
    attendanceRepo;
    scheduleRepo;
    userRepo;
    qrSessionRepo;
    qrAccessTokenRepo;
    wifiConfigRepo;
    constructor(attendanceRepo, scheduleRepo, userRepo, qrSessionRepo, qrAccessTokenRepo, wifiConfigRepo) {
        this.attendanceRepo = attendanceRepo;
        this.scheduleRepo = scheduleRepo;
        this.userRepo = userRepo;
        this.qrSessionRepo = qrSessionRepo;
        this.qrAccessTokenRepo = qrAccessTokenRepo;
        this.wifiConfigRepo = wifiConfigRepo;
    }
    async validateWifiConnection(ssid, bssid, ipAddress) {
        const wifiConfigs = await this.wifiConfigRepo.find({
            where: { is_active: true },
        });
        if (wifiConfigs.length === 0)
            return {
                isValid: true,
                message: 'Wifi validation skipped (no active configs)',
            };
        if (!ssid)
            return {
                isValid: false,
                message: 'Bạn phải kết nối WiFi của cửa hàng để chấm công',
            };
        for (const config of wifiConfigs) {
            if (config.ssid === ssid) {
                if (!config.bssid ||
                    !bssid ||
                    config.bssid.toLowerCase() === bssid.toLowerCase()) {
                    return { isValid: true, message: 'Valid' };
                }
            }
        }
        return {
            isValid: false,
            message: `WiFi ${ssid} không hợp lệ hoặc sai địa chỉ BSSID`,
        };
    }
    async validateQrAccessToken(token) {
        const qrSession = await this.qrSessionRepo.findOne({
            where: { qr_token: token },
        });
        if (qrSession) {
            if (qrSession.expires_at < new Date())
                return {
                    isValid: false,
                    tokenType: qrSession.token_type,
                    session: qrSession,
                };
            return {
                isValid: true,
                tokenType: qrSession.token_type,
                session: qrSession,
            };
        }
        const qrAccess = await this.qrAccessTokenRepo.findOne({
            where: { access_token: token },
        });
        if (qrAccess) {
            const gracePeriod = (0, moment_1.default)(qrAccess.used_at).add(60, 'seconds').toDate();
            if (qrAccess.is_used && new Date() > gracePeriod) {
                return { isValid: false, tokenType: enums_1.QRTokenType.ATTENDANCE };
            }
            if (!qrAccess.is_used && qrAccess.expires_at < new Date()) {
                return { isValid: false, tokenType: enums_1.QRTokenType.ATTENDANCE };
            }
            return { isValid: true, tokenType: enums_1.QRTokenType.ATTENDANCE };
        }
        return { isValid: false, tokenType: enums_1.QRTokenType.ATTENDANCE };
    }
    async consumeQrAccessToken(token, userPin) {
        const qrAccess = await this.qrAccessTokenRepo.findOne({
            where: { access_token: token, is_used: false },
        });
        if (qrAccess) {
            qrAccess.is_used = true;
            qrAccess.used_at = new Date();
            qrAccess.used_by_pin = userPin;
            await this.qrAccessTokenRepo.save(qrAccess);
        }
    }
    async generateQrCode(dto, currentUserId) {
        const tokenType = dto.token_type;
        if (!Object.values(enums_1.QRTokenType).includes(tokenType)) {
            throw new common_1.BadRequestException("Invalid token type. Must be 'check_in', 'check_out', or 'attendance'");
        }
        const qrToken = crypto.randomUUID();
        const expiresAt = (0, moment_1.default)().add(24, 'hours').toDate();
        const qrSession = this.qrSessionRepo.create({
            qr_token: qrToken,
            token_type: tokenType,
            expires_at: expiresAt,
            is_used: false,
        });
        await this.qrSessionRepo.save(qrSession);
        return qrSession;
    }
    async publicCheckAttendance(dto, ipAddress) {
        const user = await this.userRepo.findOne({ where: { pin: dto.pin } });
        if (!user)
            throw new common_1.NotFoundException('Mã PIN không đúng hoặc không tồn tại');
        const qrStatus = await this.validateQrAccessToken(dto.qr_token);
        if (!qrStatus.isValid)
            throw new common_1.BadRequestException('Mã QR không hợp lệ hoặc đã hết hạn');
        const { attendance: currentAtt, workDate } = await (0, attendance_helpers_1.findAttendanceAndWorkdate)(this.attendanceRepo, user.id);
        const workSchedule = await this.scheduleRepo.findOne({
            where: { user_id: user.id, work_date: workDate, is_active: true },
        });
        if (!workSchedule) {
            throw new common_1.ForbiddenException(`Bạn không có lịch làm việc hôm nay (${workDate})`);
        }
        const now = new Date();
        const windows = (0, attendance_helpers_1.computeShiftWindows)(workSchedule);
        let actionType = qrStatus.tokenType;
        let attendance = currentAtt;
        if (actionType === enums_1.QRTokenType.ATTENDANCE) {
            if (!attendance || !attendance.check_in_time) {
                actionType = enums_1.QRTokenType.CHECK_IN;
            }
            else {
                if (now > windows.latestAllowedCheckoutDt) {
                    const today = (0, moment_1.default)().format('YYYY-MM-DD');
                    if (workDate !== today) {
                        const todaySchedule = await this.scheduleRepo.findOne({
                            where: { user_id: user.id, work_date: today, is_active: true },
                        });
                        if (todaySchedule) {
                            attendance = null;
                            Object.assign(workSchedule, todaySchedule);
                            Object.assign(windows, (0, attendance_helpers_1.computeShiftWindows)(workSchedule));
                            actionType = enums_1.QRTokenType.CHECK_IN;
                        }
                        else {
                            actionType = enums_1.QRTokenType.CHECK_OUT;
                        }
                    }
                    else {
                        actionType = enums_1.QRTokenType.CHECK_OUT;
                    }
                }
                else {
                    actionType = enums_1.QRTokenType.CHECK_OUT;
                }
            }
        }
        if (actionType === enums_1.QRTokenType.CHECK_IN) {
            if (attendance && attendance.check_in_time) {
                throw new common_1.BadRequestException('Bạn đã vào ca rồi hôm nay');
            }
            if (now < windows.earliestCheckInDt) {
                throw new common_1.BadRequestException(`Quá sớm để vào ca. Ca làm bắt đầu lúc ${workSchedule.start_time}, cho phép check-in từ ${(0, moment_1.default)(windows.earliestCheckInDt).format('HH:mm')}`);
            }
            if (now > windows.endDt) {
                throw new common_1.BadRequestException(`Đã quá giờ kết thúc ca (${workSchedule.end_time}), không thể vào ca`);
            }
            const status = now <= windows.latestCheckInDt
                ? enums_1.AttendanceStatus.PRESENT
                : enums_1.AttendanceStatus.LATE;
            const newAttendance = this.attendanceRepo.create({
                user_id: user.id,
                work_schedule_id: workSchedule.id,
                date: workSchedule.work_date,
                check_in_time: now,
                check_in_qr_token: dto.qr_token,
                ip_address: ipAddress,
                status: status,
            });
            await this.attendanceRepo.save(newAttendance);
            await this.consumeQrAccessToken(dto.qr_token, user.pin);
            return {
                success: true,
                action: 'check_in',
                message: `Vào ca thành công lúc ${(0, moment_1.default)(now).format('HH:mm:ss')}`,
                attendance_id: newAttendance.id,
                check_in_time: newAttendance.check_in_time,
                status: newAttendance.status,
            };
        }
        else if (actionType === enums_1.QRTokenType.CHECK_OUT) {
            if (!attendance || !attendance.check_in_time) {
                throw new common_1.BadRequestException('Bạn phải vào ca trước khi tan ca');
            }
            if (attendance.check_out_time) {
                throw new common_1.BadRequestException('Bạn đã tan ca rồi hôm nay');
            }
            if (now < attendance.check_in_time) {
                throw new common_1.BadRequestException('Thời gian tan ca không được trước thời gian vào ca');
            }
            if (now > windows.latestAllowedCheckoutDt) {
                throw new common_1.BadRequestException('Đã quá thời gian cho phép tan ca (hoặc bạn quên tan ca hôm trước)');
            }
            const earliestAllowedCheckout = (0, moment_1.default)(windows.endDt)
                .subtract(10, 'minutes')
                .toDate();
            if (now < earliestAllowedCheckout &&
                attendance.status === enums_1.AttendanceStatus.PRESENT) {
                attendance.status = enums_1.AttendanceStatus.EARLY_CHECKOUT;
            }
            attendance.check_out_time = now;
            attendance.check_out_qr_token = dto.qr_token;
            await this.attendanceRepo.save(attendance);
            await this.consumeQrAccessToken(dto.qr_token, user.pin);
            return {
                success: true,
                action: 'check_out',
                message: `Tan ca thành công lúc ${(0, moment_1.default)(now).format('HH:mm:ss')}`,
                attendance_id: attendance.id,
                check_in_time: attendance.check_in_time,
                check_out_time: attendance.check_out_time,
                status: attendance.status,
            };
        }
    }
    async checkAttendance(dto, user, ipAddress) {
        if (user.role?.name !== 'Nhân viên' &&
            user.role?.name !== 'Thu ngân' &&
            !user.is_admin) {
            throw new common_1.ForbiddenException('Chỉ nhân viên mới có thể chấm công');
        }
        if (!user.pin) {
            throw new common_1.BadRequestException('Bạn chưa có mã PIN. Vui lòng liên hệ quản trị viên');
        }
        if (user.pin !== dto.pin) {
            throw new common_1.UnauthorizedException('Mã PIN không đúng');
        }
        const wifiStatus = await this.validateWifiConnection(dto.wifi_ssid, dto.wifi_bssid, ipAddress);
        if (!wifiStatus.isValid) {
            throw new common_1.ForbiddenException(wifiStatus.message);
        }
        return this.publicCheckAttendance({ pin: dto.pin, qr_token: dto.qr_token }, ipAddress);
    }
    async getTimesheet(userId, startDate, endDate, statusFilter, page = 1, pageSize = 20, currentUser = null) {
        const isPrivileged = currentUser.is_admin ||
            ['Thu ngân', 'accountant'].includes(currentUser.role?.name) ||
            currentUser.role_id === 5;
        let targetUserId = userId;
        if (!isPrivileged) {
            targetUserId = currentUser.id;
        }
        const qb = this.attendanceRepo
            .createQueryBuilder('att')
            .leftJoinAndSelect('att.user', 'user')
            .leftJoinAndSelect('att.work_schedule', 'work_schedule')
            .orderBy('att.date', 'DESC')
            .addOrderBy('att.check_in_time', 'DESC');
        if (targetUserId) {
            qb.andWhere('att.user_id = :userId', { userId: targetUserId });
        }
        if (startDate) {
            qb.andWhere('att.date >= :startDate', { startDate });
        }
        if (endDate) {
            qb.andWhere('att.date <= :endDate', { endDate });
        }
        if (statusFilter) {
            qb.andWhere('att.status = :status', { status: statusFilter });
        }
        const total = await qb.getCount();
        const items = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getMany();
        return {
            total,
            page,
            page_size: pageSize,
            items: items.map((att) => ({
                id: att.id,
                user_id: att.user_id,
                work_schedule_id: att.work_schedule_id,
                date: att.date,
                check_in_time: att.check_in_time,
                check_out_time: att.check_out_time,
                wifi_ssid: att.wifi_ssid,
                wifi_bssid: att.wifi_bssid,
                ip_address: att.ip_address,
                status: att.status,
                notes: att.notes,
                created_at: att.created_at,
                updated_at: att.updated_at,
                user: {
                    id: att.user?.id,
                    full_name: att.user?.full_name,
                    username: att.user?.username,
                    email: att.user?.email,
                },
                work_schedule: att.work_schedule
                    ? {
                        id: att.work_schedule.id,
                        work_date: att.work_schedule.work_date,
                        start_time: att.work_schedule.start_time,
                        end_time: att.work_schedule.end_time,
                        allowed_late_minutes: att.work_schedule.allowed_late_minutes,
                    }
                    : null,
            })),
        };
    }
    async updateAttendance(id, dto) {
        const attendance = await this.attendanceRepo.findOne({
            where: { id },
            relations: ['work_schedule'],
        });
        if (!attendance)
            throw new common_1.NotFoundException('Không tìm thấy bản ghi chấm công');
        if (dto.check_in_time !== undefined)
            attendance.check_in_time = dto.check_in_time;
        if (dto.check_out_time !== undefined)
            attendance.check_out_time = dto.check_out_time;
        if (dto.notes !== undefined)
            attendance.notes = dto.notes;
        if (attendance.work_schedule) {
            (0, attendance_helpers_1.recalculateStatus)(attendance, attendance.work_schedule);
        }
        await this.attendanceRepo.save(attendance);
        return attendance;
    }
    async createManualAttendance(dto) {
        const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy nhân viên');
        const existing = await this.attendanceRepo.findOne({
            where: { user_id: dto.user_id, date: dto.date },
        });
        if (existing)
            throw new common_1.BadRequestException('Đã có bản ghi chấm công cho nhân viên này vào ngày này');
        const checkSchedule = await this.scheduleRepo.findOne({
            where: { user_id: dto.user_id, work_date: dto.date, is_active: true },
        });
        if (!checkSchedule) {
            throw new common_1.BadRequestException('Không có lịch làm việc cho nhân viên này vào ngày này');
        }
        const { checkInDt, checkOutDt } = (0, attendance_helpers_1.normalizeManualCheckTimes)(dto.date, checkSchedule.start_time, checkSchedule.end_time, dto.check_in_time, dto.check_out_time);
        const attendance = this.attendanceRepo.create({
            user_id: dto.user_id,
            work_schedule_id: checkSchedule.id,
            date: dto.date,
            check_in_time: checkInDt,
            check_out_time: checkOutDt,
            notes: dto.notes,
        });
        (0, attendance_helpers_1.recalculateStatus)(attendance, checkSchedule);
        await this.attendanceRepo.save(attendance);
        return attendance;
    }
};
exports.AttendancesService = AttendancesService;
exports.AttendancesService = AttendancesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.AttendanceEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.WorkScheduleEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.QRSessionEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.QRAccessTokenEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.WiFiConfigEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AttendancesService);
//# sourceMappingURL=attendances.service.js.map