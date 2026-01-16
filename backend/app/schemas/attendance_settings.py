from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List


class PenaltyTier(BaseModel):
    """
    Penalty tier model for attendance late penalties.
    max_minutes: Maximum minutes late for this tier (None = unlimited, for last tier)
    penalty_amount: Penalty amount in VND
    """
    max_minutes: Optional[int] = Field(None, ge=0, description="Số phút muộn tối đa (None = không giới hạn)")
    penalty_amount: float = Field(ge=0, description="Số tiền phạt (VNĐ)")

    @field_validator('max_minutes')
    @classmethod
    def validate_max_minutes(cls, v):
        if v is not None and v < 0:
            raise ValueError('max_minutes phải >= 0 hoặc None')
        return v


class AttendanceSettingsBase(BaseModel):
    allowed_late_minutes: int = Field(default=15, ge=0, description="Số phút được phép đi muộn")

    # Penalty tiers - flexible array
    penalty_tiers: List[PenaltyTier] = Field(
        default=[
            {"max_minutes": 15, "penalty_amount": 0},
            {"max_minutes": 30, "penalty_amount": 50000},
            {"max_minutes": 60, "penalty_amount": 100000},
            {"max_minutes": None, "penalty_amount": 200000}
        ],
        min_length=1,
        description="Các mức phạt theo độ muộn (có thể thêm/xóa mức)"
    )

    # Early checkout
    early_checkout_grace_minutes: int = Field(default=10, ge=0, description="Được về sớm bao nhiêu phút")
    early_checkout_penalty: float = Field(default=50000, ge=0, description="Tiền phạt về sớm (VNĐ)")

    # Absent penalty
    absent_penalty: float = Field(default=100000, ge=0, description="Tiền phạt vắng mặt (có lịch nhưng không chấm công)")

    # Other settings
    auto_absent_enabled: bool = Field(default=True, description="Tự động đánh vắng nếu không check-in")
    notes: Optional[str] = Field(None, description="Ghi chú")

    @field_validator('penalty_tiers')
    @classmethod
    def validate_penalty_tiers(cls, tiers):
        if not tiers:
            raise ValueError('Phải có ít nhất 1 mức phạt')

        # Check that tiers are sorted by max_minutes (ascending)
        prev_max = -1
        for i, tier in enumerate(tiers):
            if tier.max_minutes is not None:
                if tier.max_minutes <= prev_max:
                    raise ValueError(f'Mức phạt phải được sắp xếp tăng dần theo số phút (mức {i+1} không hợp lệ)')
                prev_max = tier.max_minutes
            else:
                # None should be the last tier
                if i != len(tiers) - 1:
                    raise ValueError('Mức không giới hạn (max_minutes=None) phải là mức cuối cùng')

        return tiers


class AttendanceSettingsCreate(AttendanceSettingsBase):
    pass


class AttendanceSettingsUpdate(BaseModel):
    allowed_late_minutes: Optional[int] = Field(None, ge=0)
    penalty_tiers: Optional[List[PenaltyTier]] = Field(None, min_length=1)
    early_checkout_grace_minutes: Optional[int] = Field(None, ge=0)
    early_checkout_penalty: Optional[float] = Field(None, ge=0)
    absent_penalty: Optional[float] = Field(None, ge=0)
    auto_absent_enabled: Optional[bool] = None
    notes: Optional[str] = None

    @field_validator('penalty_tiers')
    @classmethod
    def validate_penalty_tiers(cls, tiers):
        if tiers is None:
            return tiers

        if not tiers:
            raise ValueError('Phải có ít nhất 1 mức phạt')

        # Check that tiers are sorted by max_minutes (ascending)
        prev_max = -1
        for i, tier in enumerate(tiers):
            if tier.max_minutes is not None:
                if tier.max_minutes <= prev_max:
                    raise ValueError(f'Mức phạt phải được sắp xếp tăng dần theo số phút (mức {i+1} không hợp lệ)')
                prev_max = tier.max_minutes
            else:
                # None should be the last tier
                if i != len(tiers) - 1:
                    raise ValueError('Mức không giới hạn (max_minutes=None) phải là mức cuối cùng')

        return tiers


class AttendanceSettingsResponse(AttendanceSettingsBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
