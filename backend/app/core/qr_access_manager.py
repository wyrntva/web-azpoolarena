"""
QR Access Manager - One-time QR code system for attendance access
Handles token generation, validation, and consumption with security measures
"""
import uuid
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import update
from app.models import QRAccessDevice, QRAccessToken
from typing import Optional, Tuple


def generate_access_token() -> str:
    """Generate secure UUID-based access token"""
    return str(uuid.uuid4())


def hash_api_key(api_key: str) -> str:
    """Hash API key for secure storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()


def verify_api_key(api_key: str, api_key_hash: str) -> bool:
    """Verify API key against stored hash"""
    return hashlib.sha256(api_key.encode()).hexdigest() == api_key_hash


def create_qr_access_device(
    db: Session,
    device_id: str,
    device_name: str,
    api_key: str
) -> QRAccessDevice:
    """
    Create new QR access device

    Args:
        db: Database session
        device_id: Unique device identifier (e.g., "PC-QR-01")
        device_name: Human-readable device name
        api_key: Internal API key for authentication

    Returns:
        QRAccessDevice: Created device object

    Raises:
        ValueError: If device_id already exists
    """
    existing = db.query(QRAccessDevice).filter(
        QRAccessDevice.device_id == device_id
    ).first()

    if existing:
        raise ValueError(f"Device ID '{device_id}' already exists")

    device = QRAccessDevice(
        device_id=device_id,
        device_name=device_name,
        api_key_hash=hash_api_key(api_key),
        is_active=True
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return device


def verify_device(
    db: Session,
    device_id: str,
    api_key: str
) -> Tuple[bool, str, Optional[QRAccessDevice]]:
    """
    Verify device credentials

    Returns:
        (is_valid, message, device_obj)
    """
    device = db.query(QRAccessDevice).filter(
        QRAccessDevice.device_id == device_id
    ).first()

    if not device:
        return False, "Device không tồn tại", None

    if not device.is_active:
        return False, "Device đã bị vô hiệu hóa", None

    if not verify_api_key(api_key, device.api_key_hash):
        return False, "API key không hợp lệ", None

    return True, "Device hợp lệ", device


def create_qr_access_token(
    db: Session,
    device_id: str,
    purpose: str = "attendance_access",
    ttl_seconds: int = 60,
    auto_register_device: bool = True
) -> QRAccessToken:
    """
    Create one-time access token

    Args:
        db: Database session
        device_id: ID of device creating the token
        purpose: Purpose of access (default: "attendance_access")
        ttl_seconds: Time-to-live in seconds (30-300)
        auto_register_device: Auto-register device if not exists

    Returns:
        QRAccessToken: Created token object

    Raises:
        ValueError: If device not found or TTL invalid
    """
    # Validate device
    device = db.query(QRAccessDevice).filter(
        QRAccessDevice.device_id == device_id,
        QRAccessDevice.is_active == True
    ).first()

    if not device:
        if auto_register_device:
            # Auto-register device with default settings
            from app.core.config import settings
            device = QRAccessDevice(
                device_id=device_id,
                device_name=f"Auto-registered device - {device_id}",
                api_key_hash=hash_api_key(settings.INTERNAL_API_KEY),
                is_active=True
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        else:
            raise ValueError("Device không tồn tại hoặc không active")

    # Validate TTL
    if ttl_seconds < 30 or ttl_seconds > 300:
        raise ValueError("TTL phải từ 30-300 giây")

    # Generate token
    access_token = generate_access_token()
    expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)

    token = QRAccessToken(
        access_token=access_token,
        device_id=device_id,
        purpose=purpose,
        expires_at=expires_at,
        is_used=False
    )

    db.add(token)
    db.commit()
    db.refresh(token)

    # Update device last used timestamp
    device.last_used_at = datetime.utcnow()
    db.commit()

    return token


def validate_qr_access_token(
    db: Session,
    access_token: str,
    allow_used: bool = False,
    grace_period_seconds: int = 20
) -> Tuple[bool, str, Optional[QRAccessToken], Optional[int]]:
    """
    Validate token without consuming it

    Args:
        db: Database session
        access_token: Token to validate
        allow_used: Allow used tokens within grace period (for attendance check)
        grace_period_seconds: Grace period after token used (default 10s)

    Returns:
        (is_valid, message, token_obj, expires_in_seconds)
    """
    token = db.query(QRAccessToken).filter(
        QRAccessToken.access_token == access_token
    ).first()

    if not token:
        return False, "Mã QR không tồn tại", None, None

    now = datetime.utcnow()

    # DEBUG LOGGING for Grace Period
    if token.is_used:
        time_since_used = (now - token.used_at).total_seconds() if token.used_at else 9999
        print(f"DEBUG GRACE: Token Used. TimeSinceUsed={time_since_used}, Grace={grace_period_seconds}, Allow={allow_used}")

    # Check if token is used
    if token.is_used:
        if allow_used and token.used_at:
            # Allow used token within grace period
            time_since_used = (now - token.used_at).total_seconds()
            if time_since_used <= grace_period_seconds:
                # Within grace period - allow
                expires_in = int((token.expires_at - now).total_seconds())
                return True, f"Token đã dùng nhưng trong grace period ({int(grace_period_seconds - time_since_used)}s còn lại)", token, expires_in
            else:
                print(f"DEBUG GRACE: FAIL - TimeSinceUsed ({time_since_used}) > Grace ({grace_period_seconds})")
                return False, "Mã QR đã được sử dụng", token, None
        else:
            print("DEBUG GRACE: FAIL - Not allowed used or missing used_at")
            return False, "Mã QR đã được sử dụng", token, None

    # Check expiration
    if now > token.expires_at:
        return False, "Mã QR đã hết hạn", token, None

    expires_in = int((token.expires_at - now).total_seconds())
    return True, "Token hợp lệ", token, expires_in


def consume_qr_access_token(
    db: Session,
    access_token: str,
    user_pin: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Mark token as used (atomic operation to prevent race conditions)

    Args:
        db: Database session
        access_token: Token to consume
        user_pin: Optional user PIN for tracking

    Returns:
        (success, message)
    """
    # Atomic update to prevent race condition
    result = db.execute(
        update(QRAccessToken)
        .where(
            QRAccessToken.access_token == access_token,
            QRAccessToken.is_used == False,
            QRAccessToken.expires_at > datetime.utcnow()
        )
        .values(
            is_used=True,
            used_at=datetime.utcnow(),
            used_by_pin=user_pin
        )
    )
    db.commit()

    if result.rowcount == 0:
        return False, "Token đã được sử dụng hoặc đã hết hạn"

    return True, "Token đã được tiêu thụ thành công"


def cleanup_expired_tokens(db: Session) -> int:
    """
    Clean up expired and old used tokens

    Returns:
        Number of tokens deleted
    """
    # Delete tokens that expired more than 24 hours ago
    cutoff_time = datetime.utcnow() - timedelta(hours=24)

    result = db.query(QRAccessToken).filter(
        QRAccessToken.expires_at < cutoff_time
    ).delete()

    db.commit()
    return result


def get_device_stats(db: Session, device_id: str) -> dict:
    """
    Get statistics for a device

    Returns:
        Dictionary with token statistics
    """
    device = db.query(QRAccessDevice).filter(
        QRAccessDevice.device_id == device_id
    ).first()

    if not device:
        return None

    total_tokens = db.query(QRAccessToken).filter(
        QRAccessToken.device_id == device_id
    ).count()

    used_tokens = db.query(QRAccessToken).filter(
        QRAccessToken.device_id == device_id,
        QRAccessToken.is_used == True
    ).count()

    active_tokens = db.query(QRAccessToken).filter(
        QRAccessToken.device_id == device_id,
        QRAccessToken.is_used == False,
        QRAccessToken.expires_at > datetime.utcnow()
    ).count()

    return {
        "device_id": device.device_id,
        "device_name": device.device_name,
        "is_active": device.is_active,
        "last_used_at": device.last_used_at,
        "total_tokens": total_tokens,
        "used_tokens": used_tokens,
        "active_tokens": active_tokens
    }
