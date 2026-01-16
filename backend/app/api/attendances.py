from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.db.session import get_db
from app.dependencies.permissions import get_current_user
from app.models import User, Attendance, WorkSchedule, QRTokenType, AttendanceStatus
from app.schemas.attendance import (
    AttendanceCheckRequest,
    PublicAttendanceCheckRequest,
    AttendanceCheckResponse,
    TimesheetFilter,
    TimesheetResponse,
    AttendanceWithDetails,
    AttendanceUpdate,
    AttendanceResponse,
    QRSessionResponse,
    ManualAttendanceCreate
)
from app.core.wifi_validator import validate_wifi_connection
from app.core.qr_manager import validate_qr_token, mark_qr_as_used, create_qr_session
from app.core import qr_access_manager
from app.core.security import verify_password
from datetime import datetime, date, time, timedelta
from typing import List
from app.api.attendance_helpers import (
    get_client_ip,
    find_attendance_and_workdate,
    get_work_schedule,
    compute_shift_windows,
    perform_check_in,
    perform_check_out,
    recalculate_status,
    normalize_manual_check_times,
    get_shift_datetimes
)

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


# Shared shift/date/time helpers moved to app.api.attendance_helpers


@router.post("/public-check", response_model=AttendanceCheckResponse)
def public_check_attendance(
    attendance_request: PublicAttendanceCheckRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for attendance check without authentication.
    User is identified by PIN only.

    IMPORTANT: IP address is now automatically detected from request.client.host
    instead of relying on client-provided IP (which could be public IP from ipify.org).
    """
    # Find user by PIN
    if not attendance_request.pin or len(attendance_request.pin) != 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã PIN phải có 4 số"
        )

    user = db.query(User).filter(User.pin == attendance_request.pin).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mã PIN không đúng hoặc không tồn tại"
        )

    # Get REAL IP address from request (not from client payload)
    # This is the IP address that the server sees (local IP if on same network)
    real_ip_address = http_request.client.host if http_request.client else None

    # Validate WiFi connection
    is_valid_wifi, wifi_message = validate_wifi_connection(
        db=db,
        ssid=attendance_request.wifi_ssid,
        bssid=attendance_request.wifi_bssid,
        ip_address=real_ip_address  # Use server-detected IP instead of client-provided
    )

    if not is_valid_wifi:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=wifi_message
        )

    # Validate QR token - Try new QR Access system first, then fall back to old system
    qr_session = None
    using_qr_access = False

    # Try QR Access token (one-time)
    # Allow used tokens within 20s grace period (for attendance after validation page)
    is_valid_access, access_message, access_token, _ = qr_access_manager.validate_qr_access_token(
        db=db,
        access_token=attendance_request.qr_token,
        allow_used=True,
        grace_period_seconds=20
    )

    if is_valid_access:
        # Valid QR Access token - will be consumed after attendance
        using_qr_access = True
    else:
        # Try old QR system (permanent)
        is_valid_qr, qr_message, qr_session = validate_qr_token(
            db=db,
            qr_token=attendance_request.qr_token
        )

        if not is_valid_qr:
            # Neither system recognized this token
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã QR không hợp lệ hoặc đã hết hạn"
            )

    # Find attendance record and work schedule for resolved date
    attendance, work_date_to_use = find_attendance_and_workdate(db, user.id)

    work_schedule = get_work_schedule(db, user.id, work_date_to_use)
    if not work_schedule:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bạn không có lịch làm việc hôm nay ({work_date_to_use})"
        )

    now = datetime.now()
    current_time = now.time()

    windows = compute_shift_windows(work_schedule)
    earliest_check_in_dt = windows["earliest_check_in_dt"]
    latest_check_in_dt = windows["latest_check_in_dt"]

    # Auto-detect mode: determine action based on current state
    if using_qr_access:
        action_type = QRTokenType.ATTENDANCE
    else:
        action_type = qr_session.token_type

    if action_type == QRTokenType.ATTENDANCE:
        if not attendance or not attendance.check_in_time:
            action_type = QRTokenType.CHECK_IN
        else:
            action_type = QRTokenType.CHECK_OUT

    if action_type == QRTokenType.CHECK_IN:
        if attendance and attendance.check_in_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn đã vào ca rồi hôm nay"
            )

        if now < earliest_check_in_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quá sớm để vào ca. Ca làm bắt đầu lúc {work_schedule.start_time}, cho phép check-in từ {earliest_check_in_dt.strftime('%H:%M')}"
            )

        try:
            attendance = perform_check_in(db, attendance, user.id, work_schedule, attendance_request, real_ip_address, now)
            return AttendanceCheckResponse(
                success=True,
                action="check_in",
                message=f"Vào ca thành công lúc {now.strftime('%H:%M:%S')}",
                attendance_id=attendance.id,
                check_in_time=attendance.check_in_time,
                status=attendance.status
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi khi chấm công vào ca: {str(e)}"
            )

    elif action_type == QRTokenType.CHECK_OUT:
        if not attendance or not attendance.check_in_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn phải vào ca trước khi tan ca"
            )

        if attendance.check_out_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn đã tan ca rồi hôm nay"
            )

        try:
            if now < attendance.check_in_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Thời gian tan ca không được trước thời gian vào ca"
                )

            attendance = perform_check_out(db, attendance, work_schedule, attendance_request, now)

            return AttendanceCheckResponse(
                success=True,
                action="check_out",
                message=f"Tan ca thành công lúc {now.strftime('%H:%M:%S')}",
                attendance_id=attendance.id,
                check_in_time=attendance.check_in_time,
                check_out_time=attendance.check_out_time,
                status=attendance.status
            )
        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi khi chấm công tan ca: {str(e)}"
            )


@router.post("/check", response_model=AttendanceCheckResponse)
def check_attendance(
    attendance_request: AttendanceCheckRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Authenticated attendance check endpoint.

    IMPORTANT: IP address is automatically detected from request.client.host.
    """
    if not current_user.is_admin and current_user.role.name not in ["Nhân viên", "Thu ngân"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ nhân viên mới có thể chấm công"
        )

    if not current_user.pin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn chưa có mã PIN. Vui lòng liên hệ quản trị viên"
        )

    if current_user.pin != attendance_request.pin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mã PIN không đúng"
        )

    # Get REAL IP address from request
    real_ip_address = http_request.client.host if http_request.client else None

    is_valid_wifi, wifi_message = validate_wifi_connection(
        db=db,
        ssid=attendance_request.wifi_ssid,
        bssid=attendance_request.wifi_bssid,
        ip_address=real_ip_address  # Use server-detected IP
    )

    if not is_valid_wifi:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=wifi_message
        )

    is_valid_qr, qr_message, qr_session = validate_qr_token(
        db=db,
        qr_token=attendance_request.qr_token
    )

    if not is_valid_qr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=qr_message
        )

    attendance, work_date_to_use = find_attendance_and_workdate(db, current_user.id)

    work_schedule = get_work_schedule(db, current_user.id, work_date_to_use)
    if not work_schedule:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have a work schedule for today ({work_date_to_use})"
        )

    now = datetime.now()
    current_time = now.time()

    windows = compute_shift_windows(work_schedule)

    # Auto-detect mode: if ATTENDANCE type, determine action based on current state
    action_type = qr_session.token_type
    if action_type == QRTokenType.ATTENDANCE:
        if not attendance or not attendance.check_in_time:
            action_type = QRTokenType.CHECK_IN
        else:
            action_type = QRTokenType.CHECK_OUT

    if action_type == QRTokenType.CHECK_IN:
        # Allow check-in 30 minutes before shift start time (use full datetimes anchored to work_date)
        earliest_check_in_dt = windows["earliest_check_in_dt"]
        if attendance and attendance.check_in_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already checked in today"
            )

        if now < earliest_check_in_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Too early to check in. Work starts at {work_schedule.start_time}, earliest check-in is {earliest_check_in_dt.strftime('%H:%M')}"
            )

        try:
            attendance = perform_check_in(db, attendance, current_user.id, work_schedule, attendance_request, real_ip_address, now)
            return AttendanceCheckResponse(
                success=True,
                action="check_in",
                message=f"Vào ca thành công lúc {now.strftime('%H:%M:%S')}",
                attendance_id=attendance.id,
                check_in_time=attendance.check_in_time,
                status=attendance.status
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi khi chấm công vào ca: {str(e)}"
            )

    elif action_type == QRTokenType.CHECK_OUT:
        if not attendance or not attendance.check_in_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must check in before checking out"
            )

        if attendance.check_out_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already checked out today"
            )

        try:
            # Validation: check-out cannot be before check-in
            if now < attendance.check_in_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Check-out time cannot be before check-in time"
                )

            attendance = perform_check_out(db, attendance, work_schedule, attendance_request, now)

            return AttendanceCheckResponse(
                success=True,
                action="check_out",
                message=f"Tan ca thành công lúc {now.strftime('%H:%M:%S')}",
                attendance_id=attendance.id,
                check_in_time=attendance.check_in_time,
                check_out_time=attendance.check_out_time,
                status=attendance.status
            )
        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi khi chấm công tan ca: {str(e)}"
            )


@router.get("/timesheet", response_model=TimesheetResponse)
def get_timesheet(
    user_id: int = None,
    start_date: date = None,
    end_date: date = None,
    status_filter: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_admin:
        query = db.query(Attendance)
        if user_id:
            query = query.filter(Attendance.user_id == user_id)
    else:
        query = db.query(Attendance).filter(Attendance.user_id == current_user.id)

    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if status_filter:
        try:
            status_enum = AttendanceStatus(status_filter)
            query = query.filter(Attendance.status == status_enum)
        except ValueError:
            pass

    query = query.order_by(Attendance.date.desc(), Attendance.check_in_time.desc())

    total = query.count()

    offset = (page - 1) * page_size
    attendances = query.offset(offset).limit(page_size).all()

    items = []
    for att in attendances:
        items.append(AttendanceWithDetails(
            id=att.id,
            user_id=att.user_id,
            work_schedule_id=att.work_schedule_id,
            date=att.date,
            check_in_time=att.check_in_time,
            check_out_time=att.check_out_time,
            wifi_ssid=att.wifi_ssid,
            wifi_bssid=att.wifi_bssid,
            ip_address=att.ip_address,
            status=att.status,
            notes=att.notes,
            created_at=att.created_at,
            updated_at=att.updated_at,
            user={
                "id": att.user.id,
                "full_name": att.user.full_name,
                "username": att.user.username,
                "email": att.user.email
            },
            work_schedule={
                "id": att.work_schedule.id,
                "work_date": str(att.work_schedule.work_date),
                "start_time": att.work_schedule.start_time,
                "end_time": att.work_schedule.end_time,
                "allowed_late_minutes": att.work_schedule.allowed_late_minutes
            }
        ))

    return TimesheetResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get("/my-timesheet", response_model=TimesheetResponse)
def get_my_timesheet(
    start_date: date = None,
    end_date: date = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_timesheet(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
        db=db,
        current_user=current_user
    )


@router.post("/qr/generate", response_model=QRSessionResponse)
def generate_qr_code(
    token_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can generate QR codes"
        )

    try:
        qr_type = QRTokenType(token_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type. Must be 'check_in', 'check_out', or 'attendance'"
        )

    qr_session = create_qr_session(db, qr_type)

    return QRSessionResponse(
        id=qr_session.id,
        qr_token=qr_session.qr_token,
        token_type=qr_session.token_type,
        expires_at=qr_session.expires_at,
        is_used=qr_session.is_used,
        used_by=qr_session.used_by,
        used_at=qr_session.used_at,
        created_at=qr_session.created_at
    )


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update attendance record (admin only).
    Allows updating check_in_time, check_out_time, and notes.
    Set check_in_time or check_out_time to null to clear them.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có thể chỉnh sửa chấm công"
        )

    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bản ghi chấm công"
        )

    # Update fields if provided
    # Allow explicitly setting check_in_time to None to clear it
    if "check_in_time" in attendance_update.model_dump(exclude_unset=True):
        attendance.check_in_time = attendance_update.check_in_time

    # Allow explicitly setting check_out_time to None to clear it
    if "check_out_time" in attendance_update.model_dump(exclude_unset=True):
        attendance.check_out_time = attendance_update.check_out_time

    if attendance_update.notes is not None:
        attendance.notes = attendance_update.notes

    # Recalculate status based on updated times
    work_schedule = db.query(WorkSchedule).filter(WorkSchedule.id == attendance.work_schedule_id).first()
    if work_schedule:
        recalculate_status(attendance, work_schedule)

    attendance.updated_at = datetime.now()

    db.commit()
    db.refresh(attendance)

    return attendance


@router.post("/manual", response_model=AttendanceResponse)
def create_manual_attendance(
    attendance_data: ManualAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create attendance record manually (admin only).
    For backdating or manually entering attendance data.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có thể tạo chấm công thủ công"
        )

    # Check if user exists
    user = db.query(User).filter(User.id == attendance_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy nhân viên"
        )

    # Check if attendance already exists for this user and date
    existing = db.query(Attendance).filter(
        and_(
            Attendance.user_id == attendance_data.user_id,
            Attendance.date == attendance_data.date
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đã có bản ghi chấm công cho nhân viên này vào ngày này"
        )

    # Get work schedule for validation
    work_schedule = db.query(WorkSchedule).filter(
        and_(
            WorkSchedule.user_id == attendance_data.user_id,
            WorkSchedule.work_date == attendance_data.date,
            WorkSchedule.is_active == True
        )
    ).first()

    if not work_schedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có lịch làm việc cho nhân viên này vào ngày này"
        )

    # Normalize manual times (handle overnight normalization) and recalculate final status
    try:
        check_in_dt, check_out_dt = normalize_manual_check_times(
            attendance_data.date,
            work_schedule.start_time,
            work_schedule.end_time,
            attendance_data.check_in_time,
            attendance_data.check_out_time
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    attendance = Attendance(
        user_id=attendance_data.user_id,
        work_schedule_id=work_schedule.id,
        date=attendance_data.date,
        check_in_time=check_in_dt,
        check_out_time=check_out_dt,
        notes=attendance_data.notes,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    # Determine status using centralized logic
    recalculate_status(attendance, work_schedule)

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance
