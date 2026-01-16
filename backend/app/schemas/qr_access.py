"""
Pydantic schemas for QR Access System
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# Request Schemas
class QRAccessTokenCreateRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=100, description="Unique device identifier")
    purpose: str = Field(default="attendance_access", max_length=50, description="Purpose of access")
    ttl_seconds: int = Field(default=60, ge=30, le=300, description="Time-to-live in seconds (30-300)")


class QRAccessTokenValidateRequest(BaseModel):
    access_token: str = Field(..., min_length=1, description="Access token to validate")
    user_pin: Optional[str] = Field(None, min_length=4, max_length=4, pattern=r"^\d{4}$", description="Optional user PIN")


class QRAccessTokenConsumeRequest(BaseModel):
    access_token: str = Field(..., min_length=1, description="Access token to consume")
    user_pin: Optional[str] = Field(None, min_length=4, max_length=4, pattern=r"^\d{4}$", description="Optional user PIN")


# Response Schemas
class QRAccessTokenCreateResponse(BaseModel):
    success: bool
    access_token: str
    expires_at: datetime
    qr_url: str
    ttl_seconds: int
    message: str = "Token created successfully"


class QRAccessTokenValidateResponse(BaseModel):
    valid: bool
    message: str
    redirect_url: Optional[str] = None
    expires_in_seconds: Optional[int] = None
    error_code: Optional[str] = None


class QRAccessTokenConsumeResponse(BaseModel):
    success: bool
    message: str


class QRAccessDeviceResponse(BaseModel):
    id: int
    device_id: str
    device_name: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QRAccessTokenResponse(BaseModel):
    id: int
    access_token: str
    device_id: str
    purpose: str
    expires_at: datetime
    is_used: bool
    used_at: Optional[datetime] = None
    used_by_pin: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QRAccessDeviceStatsResponse(BaseModel):
    device_id: str
    device_name: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    total_tokens: int
    used_tokens: int
    active_tokens: int
