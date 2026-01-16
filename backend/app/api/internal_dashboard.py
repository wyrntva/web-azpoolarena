"""
Internal Dashboard API - Protected by IP Whitelist
Endpoint này demo việc áp dụng IP whitelist security
Chỉ những request từ các dải IP được cấu hình trong WiFiConfig (is_active=True) mới được phép truy cập
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.permissions import get_current_user_from_whitelisted_ip
from app.models import User, Attendance, WorkSchedule
from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Dict, Any

router = APIRouter(prefix="/api/internal-dashboard", tags=["Internal Dashboard (IP Protected)"])


class DashboardStats(BaseModel):
    """Dashboard statistics response"""
    total_users: int
    total_attendances_today: int
    on_time_today: int
    late_today: int
    absent_today: int
    current_user_info: Dict[str, Any]
    access_info: Dict[str, str]


@router.get("/stats", response_model=DashboardStats, status_code=status.HTTP_200_OK)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_whitelisted_ip)
):
    """
    Lấy thống kê dashboard nội bộ

    **Bảo mật**: Endpoint này chỉ cho phép truy cập từ các IP thuộc whitelist
    - Phải đăng nhập (JWT token)
    - IP phải nằm trong các dải ip_subnet của WiFiConfig (is_active=True)

    Returns:
        DashboardStats: Thống kê về users, attendance hôm nay, v.v.
    """
    from app.models import AttendanceStatus

    today = date.today()

    # Đếm tổng số users
    total_users = db.query(User).filter(User.is_active == True).count()

    # Đếm attendance hôm nay
    total_attendances_today = db.query(Attendance).filter(Attendance.date == today).count()

    # Đếm số người đi làm đúng giờ, muộn, vắng
    on_time_today = db.query(Attendance).filter(
        Attendance.date == today,
        Attendance.status == AttendanceStatus.PRESENT
    ).count()

    late_today = db.query(Attendance).filter(
        Attendance.date == today,
        Attendance.status == AttendanceStatus.LATE
    ).count()

    absent_today = db.query(Attendance).filter(
        Attendance.date == today,
        Attendance.status == AttendanceStatus.ABSENT
    ).count()

    return DashboardStats(
        total_users=total_users,
        total_attendances_today=total_attendances_today,
        on_time_today=on_time_today,
        late_today=late_today,
        absent_today=absent_today,
        current_user_info={
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role": current_user.role.name if current_user.role else "SuperAdmin" if current_user.id == 1 else None
        },
        access_info={
            "message": "Access granted: Your IP is in the approved network range",
            "security_level": "IP Whitelisted + JWT Authentication"
        }
    )


class RecentAttendance(BaseModel):
    """Recent attendance record"""
    id: int
    user_id: int
    user_name: str
    date: date
    check_in_time: datetime | None
    check_out_time: datetime | None
    status: str
    wifi_ssid: str | None
    ip_address: str | None

    class Config:
        from_attributes = True


@router.get("/recent-attendances", response_model=List[RecentAttendance], status_code=status.HTTP_200_OK)
def get_recent_attendances(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_whitelisted_ip)
):
    """
    Lấy danh sách attendance gần đây

    **Bảo mật**: Endpoint này chỉ cho phép truy cập từ các IP thuộc whitelist

    Args:
        limit: Số lượng records tối đa (default: 20)

    Returns:
        List[RecentAttendance]: Danh sách attendance records
    """
    attendances = (
        db.query(Attendance)
        .join(User, Attendance.user_id == User.id)
        .order_by(Attendance.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for att in attendances:
        result.append(RecentAttendance(
            id=att.id,
            user_id=att.user_id,
            user_name=att.user.full_name,
            date=att.date,
            check_in_time=att.check_in_time,
            check_out_time=att.check_out_time,
            status=att.status.value,
            wifi_ssid=att.wifi_ssid,
            ip_address=att.ip_address
        ))

    return result


@router.get("/my-access-info", status_code=status.HTTP_200_OK)
def get_my_access_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_whitelisted_ip)
):
    """
    Kiểm tra thông tin truy cập của bản thân

    **Bảo mật**: Endpoint này chỉ cho phép truy cập từ các IP thuộc whitelist

    Endpoint này hữu ích để test xem IP whitelist có hoạt động không

    Returns:
        Dict: Thông tin về user và quyền truy cập
    """
    return {
        "success": True,
        "message": "You have successfully accessed IP-protected endpoint",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role.name if current_user.role else "SuperAdmin" if current_user.id == 1 else None
        },
        "security": {
            "authentication": "JWT Token",
            "ip_whitelist": "Active",
            "note": "This endpoint requires both valid JWT token and IP from approved network"
        }
    }
