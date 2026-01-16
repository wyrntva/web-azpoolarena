import secrets
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import QRSession, QRTokenType
from typing import Optional, Tuple


def generate_qr_token() -> str:
    random_bytes = secrets.token_bytes(32)
    timestamp = str(datetime.utcnow().timestamp()).encode()
    combined = random_bytes + timestamp
    token = hashlib.sha256(combined).hexdigest()
    return token


def create_qr_session(
    db: Session,
    token_type: QRTokenType
) -> QRSession:
    # Check if permanent QR code exists for this type
    existing_qr = db.query(QRSession).filter(
        QRSession.token_type == token_type,
        QRSession.expires_at > datetime.utcnow() + timedelta(days=365 * 10)  # Permanent QR
    ).first()

    if existing_qr:
        return existing_qr

    # Create permanent QR code
    qr_token = generate_qr_token()
    expires_at = datetime.utcnow() + timedelta(days=365 * 100)  # 100 years (effectively permanent)

    qr_session = QRSession(
        qr_token=qr_token,
        token_type=token_type,
        expires_at=expires_at,
        is_used=False
    )

    db.add(qr_session)
    db.commit()
    db.refresh(qr_session)

    return qr_session


def validate_qr_token(
    db: Session,
    qr_token: str,
    expected_type: Optional[QRTokenType] = None
) -> Tuple[bool, str, Optional[QRSession]]:
    qr_session = db.query(QRSession).filter(
        QRSession.qr_token == qr_token
    ).first()

    if not qr_session:
        return False, "Mã QR không hợp lệ", None

    # Removed is_used check - QR codes can be reused
    # Removed expiry check - QR codes are permanent

    if expected_type and qr_session.token_type != expected_type:
        return False, f"Mã QR dành cho {qr_session.token_type.value}, không phải {expected_type.value}", None

    return True, "Mã QR hợp lệ", qr_session


def mark_qr_as_used(
    db: Session,
    qr_session: QRSession,
    user_id: int
) -> None:
    qr_session.is_used = True
    qr_session.used_by = user_id
    qr_session.used_at = datetime.utcnow()
    db.commit()


def cleanup_expired_qr_sessions(db: Session) -> int:
    result = db.query(QRSession).filter(
        QRSession.expires_at < datetime.utcnow(),
        QRSession.is_used == False
    ).delete()
    db.commit()
    return result
