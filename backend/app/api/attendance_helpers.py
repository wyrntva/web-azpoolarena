from datetime import datetime, date, timedelta
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Attendance, WorkSchedule, AttendanceStatus


def get_shift_datetimes(work_date: date, start_time_str: str, end_time_str: str) -> Tuple[datetime, datetime]:
    start_time_obj = datetime.strptime(start_time_str, "%H:%M").time()
    end_time_obj = datetime.strptime(end_time_str, "%H:%M").time()

    start_dt = datetime.combine(work_date, start_time_obj)
    if end_time_obj < start_time_obj:
        end_dt = datetime.combine(work_date + timedelta(days=1), end_time_obj)
    else:
        end_dt = datetime.combine(work_date, end_time_obj)

    return start_dt, end_dt


def get_client_ip(request) -> Optional[str]:
    return request.client.host if request and getattr(request, "client", None) else None


def find_attendance_and_workdate(db: Session, user_id: int) -> Tuple[Optional[Attendance], date]:
    today = date.today()
    yesterday = today - timedelta(days=1)

    attendance_today = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == today
    ).first()

    attendance_yesterday_open = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == yesterday,
        Attendance.check_in_time != None,
        Attendance.check_out_time == None
    ).first()

    if attendance_today:
        return attendance_today, today
    elif attendance_yesterday_open:
        return attendance_yesterday_open, yesterday
    else:
        return None, today


def get_work_schedule(db: Session, user_id: int, work_date: date) -> Optional[WorkSchedule]:
    return db.query(WorkSchedule).filter(
        WorkSchedule.user_id == user_id,
        WorkSchedule.work_date == work_date,
        WorkSchedule.is_active == True
    ).first()


def compute_shift_windows(work_schedule: WorkSchedule):
    start_dt, end_dt = get_shift_datetimes(work_schedule.work_date, work_schedule.start_time, work_schedule.end_time)
    allowed_late = timedelta(minutes=work_schedule.allowed_late_minutes)
    earliest_check_in_dt = start_dt - timedelta(minutes=30)
    latest_check_in_dt = start_dt + allowed_late

    early_checkout_grace = timedelta(minutes=10)
    earliest_allowed_checkout_dt = end_dt - early_checkout_grace
    latest_allowed_checkout_dt = end_dt + timedelta(hours=4)

    return {
        "start_dt": start_dt,
        "end_dt": end_dt,
        "earliest_check_in_dt": earliest_check_in_dt,
        "latest_check_in_dt": latest_check_in_dt,
        "earliest_allowed_checkout_dt": earliest_allowed_checkout_dt,
        "latest_allowed_checkout_dt": latest_allowed_checkout_dt,
    }


def perform_check_in(db: Session, attendance: Optional[Attendance], user_id: int, work_schedule: WorkSchedule, attendance_request, ip_address: Optional[str], now: datetime) -> Attendance:
    # determine status
    start_dt, _ = get_shift_datetimes(work_schedule.work_date, work_schedule.start_time, work_schedule.end_time)
    allowed_late = timedelta(minutes=work_schedule.allowed_late_minutes)
    latest_check_in_dt = start_dt + allowed_late

    if now <= latest_check_in_dt:
        attendance_status = AttendanceStatus.PRESENT
    else:
        attendance_status = AttendanceStatus.LATE

    if not attendance:
        attendance = Attendance(
            user_id=user_id,
            work_schedule_id=work_schedule.id,
            date=work_schedule.work_date,
            check_in_time=now,
            check_in_qr_token=attendance_request.qr_token,
            wifi_ssid=attendance_request.wifi_ssid,
            wifi_bssid=attendance_request.wifi_bssid,
            ip_address=ip_address,
            status=attendance_status
        )
        db.add(attendance)
    else:
        attendance.check_in_time = now
        attendance.check_in_qr_token = attendance_request.qr_token
        attendance.wifi_ssid = attendance_request.wifi_ssid
        attendance.wifi_bssid = attendance_request.wifi_bssid
        attendance.ip_address = ip_address
        attendance.status = attendance_status

    db.commit()
    db.refresh(attendance)
    return attendance


def perform_check_out(db: Session, attendance: Attendance, work_schedule: WorkSchedule, attendance_request, now: datetime) -> Attendance:
    # validate ordering
    if now < attendance.check_in_time:
        raise ValueError("Check-out before check-in")

    # Anchor shift datetimes to the attendance record's date to handle overnight shifts
    try:
        shift_start_dt, shift_end_dt = get_shift_datetimes(attendance.date, work_schedule.start_time, work_schedule.end_time)
    except Exception:
        # Fallback to work_schedule date if attendance date not usable
        shift_start_dt, shift_end_dt = get_shift_datetimes(work_schedule.work_date, work_schedule.start_time, work_schedule.end_time)

    if now < shift_start_dt:
        raise ValueError("Too early to check out")

    # early checkout / latest allowed check out
    early_checkout_grace = timedelta(minutes=10)
    earliest_allowed_checkout_dt = shift_end_dt - early_checkout_grace
    latest_allowed_checkout_dt = shift_end_dt + timedelta(hours=4)

    if now > latest_allowed_checkout_dt:
        raise ValueError("Too late to check out")

    if now < earliest_allowed_checkout_dt and attendance.status == AttendanceStatus.PRESENT:
        attendance.status = AttendanceStatus.EARLY_CHECKOUT

    attendance.check_out_time = now
    attendance.check_out_qr_token = attendance_request.qr_token

    db.commit()
    db.refresh(attendance)
    return attendance


def normalize_manual_check_times(attendance_date: date, start_time_str: str, end_time_str: str, check_in_dt: Optional[datetime], check_out_dt: Optional[datetime]) -> Tuple[Optional[datetime], Optional[datetime]]:
    if not check_in_dt and not check_out_dt:
        return check_in_dt, check_out_dt

    start_time_obj = datetime.strptime(start_time_str, "%H:%M").time()
    end_time_obj = datetime.strptime(end_time_str, "%H:%M").time()
    is_overnight_shift = end_time_obj < start_time_obj

    # normalize check_out if it is before check_in for overnight shifts
    if check_in_dt and check_out_dt and check_out_dt < check_in_dt:
        if is_overnight_shift:
            if check_out_dt.date() == attendance_date:
                check_out_dt = check_out_dt + timedelta(days=1)
            while check_out_dt < check_in_dt:
                check_out_dt = check_out_dt + timedelta(days=1)
        else:
            raise ValueError("Check-out cannot be before check-in")

    return check_in_dt, check_out_dt


def recalculate_status(attendance: Attendance, work_schedule: WorkSchedule) -> None:
    if attendance.check_in_time:
        check_in_time = attendance.check_in_time.time()
        start_time_obj = datetime.strptime(work_schedule.start_time, "%H:%M").time()
        allowed_late = timedelta(minutes=work_schedule.allowed_late_minutes)
        latest_check_in = (datetime.combine(attendance.date, start_time_obj) + allowed_late).time()

        is_late = check_in_time > latest_check_in

        is_early_checkout = False
        if attendance.check_out_time:
            end_time_obj = datetime.strptime(work_schedule.end_time, "%H:%M").time()
            early_checkout_grace = timedelta(minutes=10)
            is_overnight_shift = end_time_obj < start_time_obj

            # If overnight, normalize check_out_time so its date is on/after attendance.date
            check_out_dt = attendance.check_out_time
            if is_overnight_shift:
                # If check_out is before check_in, assume next day(s)
                if check_out_dt < attendance.check_in_time:
                    # If check_out has same date as attendance.date, add one day
                    if check_out_dt.date() == attendance.date:
                        check_out_dt = check_out_dt + timedelta(days=1)
                    # If still before check_in, keep adding days until it's after
                    while check_out_dt < attendance.check_in_time:
                        check_out_dt = check_out_dt + timedelta(days=1)
            else:
                check_out_dt = attendance.check_out_time

            if is_overnight_shift:
                end_datetime = datetime.combine(attendance.date + timedelta(days=1), end_time_obj)
            else:
                end_datetime = datetime.combine(attendance.date, end_time_obj)

            earliest_allowed_checkout_dt = end_datetime - early_checkout_grace
            is_early_checkout = check_out_dt < earliest_allowed_checkout_dt

        if is_late:
            attendance.status = AttendanceStatus.LATE
        elif is_early_checkout:
            attendance.status = AttendanceStatus.EARLY_CHECKOUT
        else:
            attendance.status = AttendanceStatus.PRESENT
    else:
        attendance.status = AttendanceStatus.ABSENT
