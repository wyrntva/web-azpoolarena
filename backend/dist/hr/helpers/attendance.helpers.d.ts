import { Repository } from 'typeorm';
import { AttendanceEntity, WorkScheduleEntity } from '../entities';
export declare function getShiftDatetimes(workDate: string, startTimeStr: string, endTimeStr: string): {
    startDt: Date;
    endDt: Date;
};
export declare function findAttendanceAndWorkdate(attendanceRepo: Repository<AttendanceEntity>, userId: number): Promise<{
    attendance: AttendanceEntity | null;
    workDate: string;
}>;
export declare function computeShiftWindows(workSchedule: WorkScheduleEntity): {
    startDt: Date;
    endDt: Date;
    earliestCheckInDt: Date;
    latestCheckInDt: Date;
    earliestAllowedCheckoutDt: Date;
    latestAllowedCheckoutDt: Date;
};
export declare function normalizeManualCheckTimes(attendanceDate: string, startTimeStr: string, endTimeStr: string, checkInDt?: Date | null, checkOutDt?: Date | null): {
    checkInDt: null | undefined;
    checkOutDt: null | undefined;
} | {
    checkInDt: Date | null;
    checkOutDt: Date | null;
};
export declare function recalculateStatus(attendance: AttendanceEntity, workSchedule: WorkScheduleEntity): void;
