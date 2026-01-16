from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Optional
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"
    EARLY_CHECKOUT = "early_checkout"


class QRTokenType(str, Enum):
    CHECK_IN = "check_in"
    CHECK_OUT = "check_out"
    ATTENDANCE = "attendance"


class WiFiConfigBase(BaseModel):
    ssid: str = Field(..., min_length=1, max_length=100)
    bssid: Optional[str] = Field(None, max_length=17)
    ip_range: Optional[str] = Field(None, max_length=50)
    ip_subnet: Optional[str] = Field(None, max_length=32, description="IP subnet for whitelist (e.g., '192.168.10.0/24' or '10.0.50.0/24')")
    description: Optional[str] = None
    is_active: bool = True


class WiFiConfigCreate(WiFiConfigBase):
    pass


class WiFiConfigUpdate(BaseModel):
    ssid: Optional[str] = Field(None, min_length=1, max_length=100)
    bssid: Optional[str] = Field(None, max_length=17)
    ip_range: Optional[str] = Field(None, max_length=50)
    ip_subnet: Optional[str] = Field(None, max_length=32, description="IP subnet for whitelist (e.g., '192.168.10.0/24' or '10.0.50.0/24')")
    description: Optional[str] = None
    is_active: Optional[bool] = None


class WiFiConfigResponse(WiFiConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QRSessionResponse(BaseModel):
    id: int
    qr_token: str
    token_type: QRTokenType
    expires_at: datetime
    is_used: bool
    used_by: Optional[int] = None
    used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkScheduleBase(BaseModel):
    user_id: int
    work_date: date
    start_time: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    end_time: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    allowed_late_minutes: int = Field(default=0, ge=0)
    is_active: bool = True


class WorkScheduleCreate(WorkScheduleBase):
    pass


class WorkScheduleUpdate(BaseModel):
    work_date: Optional[date] = None
    start_time: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    end_time: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    allowed_late_minutes: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class WorkScheduleResponse(WorkScheduleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkScheduleWithUser(WorkScheduleResponse):
    user: dict


class AttendanceCheckRequest(BaseModel):
    qr_token: str = Field(..., min_length=1)
    pin: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")
    wifi_ssid: str = Field(..., min_length=1, max_length=100)
    wifi_bssid: Optional[str] = Field(None, max_length=17)
    ip_address: Optional[str] = Field(None, max_length=50)


class PublicAttendanceCheckRequest(BaseModel):
    """Request for checking attendance without authentication"""
    qr_token: str = Field(..., min_length=1)
    pin: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")
    wifi_ssid: str = Field(..., min_length=1, max_length=100)
    wifi_bssid: Optional[str] = Field(None, max_length=17)
    ip_address: Optional[str] = Field(None, max_length=50)


class AttendanceCheckResponse(BaseModel):
    success: bool
    action: str
    message: str
    attendance_id: Optional[int] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: Optional[AttendanceStatus] = None


class AttendanceBase(BaseModel):
    user_id: int
    work_schedule_id: int
    date: date
    status: AttendanceStatus = AttendanceStatus.ABSENT
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class ManualAttendanceCreate(BaseModel):
    """Schema for manually creating attendance record (admin only)"""
    user_id: int
    date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: int
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    wifi_ssid: Optional[str] = None
    wifi_bssid: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceWithDetails(AttendanceResponse):
    user: dict
    work_schedule: dict


class TimesheetFilter(BaseModel):
    user_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[AttendanceStatus] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class TimesheetResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AttendanceWithDetails]
