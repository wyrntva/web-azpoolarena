"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShiftDatetimes = getShiftDatetimes;
exports.findAttendanceAndWorkdate = findAttendanceAndWorkdate;
exports.computeShiftWindows = computeShiftWindows;
exports.normalizeManualCheckTimes = normalizeManualCheckTimes;
exports.recalculateStatus = recalculateStatus;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../common/enums");
const moment_1 = __importDefault(require("moment"));
function getShiftDatetimes(workDate, startTimeStr, endTimeStr) {
    const startDt = (0, moment_1.default)(`${workDate} ${startTimeStr}`, 'YYYY-MM-DD HH:mm').toDate();
    let endDt = (0, moment_1.default)(`${workDate} ${endTimeStr}`, 'YYYY-MM-DD HH:mm').toDate();
    if (endDt < startDt) {
        endDt = (0, moment_1.default)(endDt).add(1, 'days').toDate();
    }
    return { startDt, endDt };
}
async function findAttendanceAndWorkdate(attendanceRepo, userId) {
    const today = (0, moment_1.default)().format('YYYY-MM-DD');
    const yesterday = (0, moment_1.default)().subtract(1, 'days').format('YYYY-MM-DD');
    const attendanceToday = await attendanceRepo.findOne({
        where: { user_id: userId, date: today },
    });
    if (attendanceToday) {
        return { attendance: attendanceToday, workDate: today };
    }
    const qb = attendanceRepo
        .createQueryBuilder('att')
        .where('att.user_id = :userId', { userId })
        .andWhere('att.date = :date', { date: yesterday })
        .andWhere('att.check_in_time IS NOT NULL')
        .andWhere('att.check_out_time IS NULL');
    const attendanceYesterdayOpen = await qb.getOne();
    if (attendanceYesterdayOpen) {
        return { attendance: attendanceYesterdayOpen, workDate: yesterday };
    }
    return { attendance: null, workDate: today };
}
function computeShiftWindows(workSchedule) {
    const { startDt, endDt } = getShiftDatetimes(workSchedule.work_date.toString(), workSchedule.start_time, workSchedule.end_time);
    const earliestCheckInDt = (0, moment_1.default)(startDt).subtract(30, 'minutes').toDate();
    const latestCheckInDt = (0, moment_1.default)(startDt)
        .add(workSchedule.allowed_late_minutes, 'minutes')
        .toDate();
    const earliestAllowedCheckoutDt = (0, moment_1.default)(endDt)
        .subtract(10, 'minutes')
        .toDate();
    const latestAllowedCheckoutDt = (0, moment_1.default)(endDt).add(4, 'hours').toDate();
    return {
        startDt,
        endDt,
        earliestCheckInDt,
        latestCheckInDt,
        earliestAllowedCheckoutDt,
        latestAllowedCheckoutDt,
    };
}
function normalizeManualCheckTimes(attendanceDate, startTimeStr, endTimeStr, checkInDt, checkOutDt) {
    if (!checkInDt && !checkOutDt) {
        return { checkInDt, checkOutDt };
    }
    const startObj = (0, moment_1.default)(`${attendanceDate} ${startTimeStr}`, 'YYYY-MM-DD HH:mm');
    const endObj = (0, moment_1.default)(`${attendanceDate} ${endTimeStr}`, 'YYYY-MM-DD HH:mm');
    const isOvernightShift = endObj.isBefore(startObj);
    const newCheckOutDt = checkOutDt ? (0, moment_1.default)(checkOutDt) : null;
    const newCheckInDt = checkInDt ? (0, moment_1.default)(checkInDt) : null;
    if (newCheckInDt && newCheckOutDt && newCheckOutDt.isBefore(newCheckInDt)) {
        if (isOvernightShift) {
            if (newCheckOutDt.format('YYYY-MM-DD') === attendanceDate) {
                newCheckOutDt.add(1, 'days');
            }
            while (newCheckOutDt.isBefore(newCheckInDt)) {
                newCheckOutDt.add(1, 'days');
            }
        }
        else {
            throw new common_1.BadRequestException('Check-out cannot be before check-in');
        }
    }
    return {
        checkInDt: newCheckInDt ? newCheckInDt.toDate() : null,
        checkOutDt: newCheckOutDt ? newCheckOutDt.toDate() : null,
    };
}
function recalculateStatus(attendance, workSchedule) {
    if (attendance.check_in_time) {
        const checkInMom = (0, moment_1.default)(attendance.check_in_time);
        const dateStr = typeof attendance.date === 'string'
            ? attendance.date
            : (0, moment_1.default)(attendance.date).format('YYYY-MM-DD');
        const startMom = (0, moment_1.default)(`${dateStr} ${workSchedule.start_time}`, 'YYYY-MM-DD HH:mm');
        const latestCheckInMom = startMom
            .clone()
            .add(workSchedule.allowed_late_minutes, 'minutes');
        const isLate = checkInMom.isAfter(latestCheckInMom);
        let isEarlyCheckout = false;
        if (attendance.check_out_time) {
            const endMom = (0, moment_1.default)(`${dateStr} ${workSchedule.end_time}`, 'YYYY-MM-DD HH:mm');
            const isOvernightShift = endMom.isBefore(startMom);
            const checkOutMom = (0, moment_1.default)(attendance.check_out_time);
            if (isOvernightShift) {
                if (checkOutMom.isBefore(checkInMom)) {
                    if (checkOutMom.format('YYYY-MM-DD') === dateStr) {
                        checkOutMom.add(1, 'days');
                    }
                    while (checkOutMom.isBefore(checkInMom)) {
                        checkOutMom.add(1, 'days');
                    }
                }
            }
            const endDatetime = endMom.clone();
            if (isOvernightShift) {
                endDatetime.add(1, 'days');
            }
            const earliestAllowedCheckoutMom = endDatetime
                .clone()
                .subtract(10, 'minutes');
            isEarlyCheckout = checkOutMom.isBefore(earliestAllowedCheckoutMom);
        }
        if (isLate) {
            attendance.status = enums_1.AttendanceStatus.LATE;
        }
        else if (isEarlyCheckout) {
            attendance.status = enums_1.AttendanceStatus.EARLY_CHECKOUT;
        }
        else {
            attendance.status = enums_1.AttendanceStatus.PRESENT;
        }
    }
    else {
        attendance.status = enums_1.AttendanceStatus.ABSENT;
    }
}
//# sourceMappingURL=attendance.helpers.js.map