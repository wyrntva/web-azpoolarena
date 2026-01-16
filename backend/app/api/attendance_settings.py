from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.permissions import get_current_user
from app.models import User, AttendanceSettings
from app.schemas.attendance_settings import (
    AttendanceSettingsCreate,
    AttendanceSettingsUpdate,
    AttendanceSettingsResponse
)
from datetime import datetime
import json

router = APIRouter(prefix="/api/attendance-settings", tags=["Attendance Settings"])


def get_default_penalty_tiers():
    """Return default penalty tiers as JSON string"""
    return json.dumps([
        {"max_minutes": 15, "penalty_amount": 0},
        {"max_minutes": 30, "penalty_amount": 50000},
        {"max_minutes": 60, "penalty_amount": 100000},
        {"max_minutes": None, "penalty_amount": 200000}
    ])


@router.get("/", response_model=AttendanceSettingsResponse)
def get_attendance_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get active attendance settings.
    If no settings exist, create default settings.
    """
    settings = db.query(AttendanceSettings).filter(
        AttendanceSettings.is_active == True
    ).first()

    if not settings:
        # Create default settings
        settings = AttendanceSettings(
            allowed_late_minutes=15,
            penalty_tiers=get_default_penalty_tiers(),
            early_checkout_grace_minutes=10,
            early_checkout_penalty=50000,
            absent_penalty=100000,
            auto_absent_enabled=True,
            is_active=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Parse penalty_tiers from JSON string to dict for response
    settings_dict = {
        "id": settings.id,
        "allowed_late_minutes": settings.allowed_late_minutes,
        "penalty_tiers": json.loads(settings.penalty_tiers),
        "early_checkout_grace_minutes": settings.early_checkout_grace_minutes,
        "early_checkout_penalty": settings.early_checkout_penalty,
        "absent_penalty": settings.absent_penalty,
        "auto_absent_enabled": settings.auto_absent_enabled,
        "notes": settings.notes,
        "is_active": settings.is_active,
        "created_at": settings.created_at,
        "updated_at": settings.updated_at
    }

    return settings_dict


@router.put("/", response_model=AttendanceSettingsResponse)
def update_attendance_settings(
    settings_update: AttendanceSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update attendance settings (admin only).
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có thể cập nhật thiết lập chấm công"
        )

    # Get or create settings
    settings = db.query(AttendanceSettings).filter(
        AttendanceSettings.is_active == True
    ).first()

    if not settings:
        # Create default settings first
        settings = AttendanceSettings(
            allowed_late_minutes=15,
            penalty_tiers=get_default_penalty_tiers(),
            early_checkout_grace_minutes=10,
            early_checkout_penalty=50000,
            absent_penalty=100000,
            auto_absent_enabled=True,
            is_active=True
        )
        db.add(settings)

    # Update fields if provided
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "penalty_tiers":
            # Convert penalty_tiers list to JSON string
            # Handle both dict and Pydantic model objects
            if value and isinstance(value[0], dict):
                settings.penalty_tiers = json.dumps(value)
            else:
                settings.penalty_tiers = json.dumps([tier.model_dump() for tier in value])
        else:
            setattr(settings, field, value)

    settings.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(settings)

    # Parse penalty_tiers from JSON string for response
    settings_dict = {
        "id": settings.id,
        "allowed_late_minutes": settings.allowed_late_minutes,
        "penalty_tiers": json.loads(settings.penalty_tiers),
        "early_checkout_grace_minutes": settings.early_checkout_grace_minutes,
        "early_checkout_penalty": settings.early_checkout_penalty,
        "absent_penalty": settings.absent_penalty,
        "auto_absent_enabled": settings.auto_absent_enabled,
        "notes": settings.notes,
        "is_active": settings.is_active,
        "created_at": settings.created_at,
        "updated_at": settings.updated_at
    }

    return settings_dict


@router.post("/", response_model=AttendanceSettingsResponse)
def create_attendance_settings(
    settings_create: AttendanceSettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new attendance settings (admin only).
    Deactivates any existing active settings.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có thể tạo thiết lập chấm công"
        )

    # Deactivate existing settings
    existing_settings = db.query(AttendanceSettings).filter(
        AttendanceSettings.is_active == True
    ).all()

    for existing in existing_settings:
        existing.is_active = False

    # Create new settings
    data = settings_create.model_dump()
    # Handle both dict and Pydantic model objects
    if settings_create.penalty_tiers and isinstance(settings_create.penalty_tiers[0], dict):
        data["penalty_tiers"] = json.dumps(settings_create.penalty_tiers)
    else:
        data["penalty_tiers"] = json.dumps([tier.model_dump() for tier in settings_create.penalty_tiers])

    new_settings = AttendanceSettings(
        **data,
        is_active=True
    )

    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)

    # Parse penalty_tiers from JSON string for response
    settings_dict = {
        "id": new_settings.id,
        "allowed_late_minutes": new_settings.allowed_late_minutes,
        "penalty_tiers": json.loads(new_settings.penalty_tiers),
        "early_checkout_grace_minutes": new_settings.early_checkout_grace_minutes,
        "early_checkout_penalty": new_settings.early_checkout_penalty,
        "absent_penalty": new_settings.absent_penalty,
        "auto_absent_enabled": new_settings.auto_absent_enabled,
        "notes": new_settings.notes,
        "is_active": new_settings.is_active,
        "created_at": new_settings.created_at,
        "updated_at": new_settings.updated_at
    }

    return settings_dict
