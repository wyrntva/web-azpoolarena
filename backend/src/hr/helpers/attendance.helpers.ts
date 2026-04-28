import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository, LessThan, MoreThan, Equal, And } from 'typeorm';
import { AttendanceEntity, WorkScheduleEntity } from '../entities';
import { AttendanceStatus } from '../../common/enums';
import moment from 'moment';

export function getShiftDatetimes(
  workDate: string,
  startTimeStr: string,
  endTimeStr: string,
) {
  const startDt = moment(
    `${workDate} ${startTimeStr}`,
    'YYYY-MM-DD HH:mm',
  ).toDate();
  let endDt = moment(`${workDate} ${endTimeStr}`, 'YYYY-MM-DD HH:mm').toDate();

  if (endDt < startDt) {
    endDt = moment(endDt).add(1, 'days').toDate();
  }
  return { startDt, endDt };
}

export async function findAttendanceAndWorkdate(
  attendanceRepo: Repository<AttendanceEntity>,
  userId: number,
): Promise<{ attendance: AttendanceEntity | null; workDate: string }> {
  const today = moment().format('YYYY-MM-DD');
  const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

  const attendanceToday = await attendanceRepo.findOne({
    where: { user_id: userId, date: today },
  });

  if (attendanceToday) {
    return { attendance: attendanceToday, workDate: today };
  }

  // Look for open attendance from yesterday (check_out_time is null)
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

export function computeShiftWindows(workSchedule: WorkScheduleEntity) {
  const { startDt, endDt } = getShiftDatetimes(
    workSchedule.work_date.toString(),
    workSchedule.start_time,
    workSchedule.end_time,
  );

  const earliestCheckInDt = moment(startDt).subtract(30, 'minutes').toDate();
  const latestCheckInDt = moment(startDt)
    .add(workSchedule.allowed_late_minutes, 'minutes')
    .toDate();

  const earliestAllowedCheckoutDt = moment(endDt)
    .subtract(10, 'minutes')
    .toDate();
  const latestAllowedCheckoutDt = moment(endDt).add(4, 'hours').toDate();

  return {
    startDt,
    endDt,
    earliestCheckInDt,
    latestCheckInDt,
    earliestAllowedCheckoutDt,
    latestAllowedCheckoutDt,
  };
}

export function normalizeManualCheckTimes(
  attendanceDate: string,
  startTimeStr: string,
  endTimeStr: string,
  checkInDt?: Date | null,
  checkOutDt?: Date | null,
) {
  if (!checkInDt && !checkOutDt) {
    return { checkInDt, checkOutDt };
  }

  const startObj = moment(
    `${attendanceDate} ${startTimeStr}`,
    'YYYY-MM-DD HH:mm',
  );
  const endObj = moment(`${attendanceDate} ${endTimeStr}`, 'YYYY-MM-DD HH:mm');
  const isOvernightShift = endObj.isBefore(startObj);

  const newCheckOutDt = checkOutDt ? moment(checkOutDt) : null;
  const newCheckInDt = checkInDt ? moment(checkInDt) : null;

  if (newCheckInDt && newCheckOutDt && newCheckOutDt.isBefore(newCheckInDt)) {
    if (isOvernightShift) {
      if (newCheckOutDt.format('YYYY-MM-DD') === attendanceDate) {
        newCheckOutDt.add(1, 'days');
      }
      while (newCheckOutDt.isBefore(newCheckInDt)) {
        newCheckOutDt.add(1, 'days');
      }
    } else {
      throw new BadRequestException('Check-out cannot be before check-in');
    }
  }

  return {
    checkInDt: newCheckInDt ? newCheckInDt.toDate() : null,
    checkOutDt: newCheckOutDt ? newCheckOutDt.toDate() : null,
  };
}

export function recalculateStatus(
  attendance: AttendanceEntity,
  workSchedule: WorkScheduleEntity,
) {
  if (attendance.check_in_time) {
    const checkInMom = moment(attendance.check_in_time);
    const dateStr =
      typeof attendance.date === 'string'
        ? attendance.date
        : moment(attendance.date).format('YYYY-MM-DD');

    const startMom = moment(
      `${dateStr} ${workSchedule.start_time}`,
      'YYYY-MM-DD HH:mm',
    );
    const latestCheckInMom = startMom
      .clone()
      .add(workSchedule.allowed_late_minutes, 'minutes');

    const isLate = checkInMom.isAfter(latestCheckInMom);
    let isEarlyCheckout = false;

    if (attendance.check_out_time) {
      const endMom = moment(
        `${dateStr} ${workSchedule.end_time}`,
        'YYYY-MM-DD HH:mm',
      );
      const isOvernightShift = endMom.isBefore(startMom);

      const checkOutMom = moment(attendance.check_out_time);

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
      attendance.status = AttendanceStatus.LATE;
    } else if (isEarlyCheckout) {
      attendance.status = AttendanceStatus.EARLY_CHECKOUT;
    } else {
      attendance.status = AttendanceStatus.PRESENT;
    }
  } else {
    attendance.status = AttendanceStatus.ABSENT;
  }
}
