"""
QR Access API Endpoints
- Internal API for Desktop App (requires API key)
- Public API for Web validation
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core import qr_access_manager
from app.schemas.qr_access import (
    QRAccessTokenCreateRequest,
    QRAccessTokenCreateResponse,
    QRAccessTokenValidateRequest,
    QRAccessTokenValidateResponse,
    QRAccessTokenConsumeRequest,
    QRAccessTokenConsumeResponse,
    QRAccessDeviceStatsResponse
)
from typing import Optional


# Routers
internal_router = APIRouter(prefix="/api/internal/qr-access", tags=["QR Access - Internal"])
public_router = APIRouter(prefix="/api/qr-access", tags=["QR Access - Public"])


# Internal API Key Authentication
def verify_internal_api_key(
    x_internal_api_key: Optional[str] = Header(None, alias="X-Internal-API-Key")
) -> str:
    """
    Verify internal API key from Desktop App

    Add to .env:
    INTERNAL_API_KEY=your-secure-random-key-here
    """
    # Get internal API key from settings
    internal_key = settings.INTERNAL_API_KEY

    if not internal_key or internal_key == "":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal API key not configured on server"
        )

    if not x_internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Internal-API-Key header"
        )

    if x_internal_api_key != internal_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

    return x_internal_api_key


# =======================
# INTERNAL API ENDPOINTS
# =======================

@internal_router.post("/create", response_model=QRAccessTokenCreateResponse)
def create_qr_access_token(
    request: QRAccessTokenCreateRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_internal_api_key)
):
    """
    **[INTERNAL] Create one-time access token**

    Used by Desktop App to generate QR codes.

    **Authentication:** Requires `X-Internal-API-Key` header

    **Request:**
    ```json
    {
        "device_id": "PC-QR-01",
        "purpose": "attendance_access",
        "ttl_seconds": 60
    }
    ```

    **Response:**
    ```json
    {
        "success": true,
        "access_token": "uuid-token",
        "expires_at": "2026-01-12T08:05:00Z",
        "qr_url": "https://attendance.example.com/check-in?token=uuid-token",
        "ttl_seconds": 60
    }
    ```
    """
    try:
        token = qr_access_manager.create_qr_access_token(
            db=db,
            device_id=request.device_id,
            purpose=request.purpose,
            ttl_seconds=request.ttl_seconds
        )

        # Generate QR URL (configure base URL in settings or use placeholder)
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        qr_url = f"{base_url}/attendance/check-in?token={token.access_token}"

        return QRAccessTokenCreateResponse(
            success=True,
            access_token=token.access_token,
            expires_at=token.expires_at,
            qr_url=qr_url,
            ttl_seconds=request.ttl_seconds,
            message="Token created successfully"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create token: {str(e)}"
        )


@internal_router.get("/device/{device_id}/stats", response_model=QRAccessDeviceStatsResponse)
def get_device_stats(
    device_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(verify_internal_api_key)
):
    """
    **[INTERNAL] Get device statistics**

    Returns token usage statistics for a device.

    **Authentication:** Requires `X-Internal-API-Key` header
    """
    stats = qr_access_manager.get_device_stats(db, device_id)

    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    return QRAccessDeviceStatsResponse(**stats)


# =======================
# PUBLIC API ENDPOINTS
# =======================

@public_router.post("/validate", response_model=QRAccessTokenValidateResponse)
def validate_qr_access_token(
    request: QRAccessTokenValidateRequest,
    db: Session = Depends(get_db)
):
    """
    **[PUBLIC] Validate access token**

    Called by web frontend when user scans QR code.
    Does NOT consume the token - only validates it.

    **Request:**
    ```json
    {
        "access_token": "uuid-token",
        "user_pin": "1234"
    }
    ```

    **Response (Valid):**
    ```json
    {
        "valid": true,
        "message": "Token hợp lệ. Có thể truy cập trang chấm công",
        "redirect_url": "/attendance/check-in",
        "expires_in_seconds": 45
    }
    ```

    **Response (Invalid/Used/Expired):**
    ```json
    {
        "valid": false,
        "message": "Mã QR đã được sử dụng",
        "error_code": "TOKEN_ALREADY_USED"
    }
    ```
    """
    is_valid, message, token, expires_in = qr_access_manager.validate_qr_access_token(
        db=db,
        access_token=request.access_token
    )

    if not is_valid:
        # Determine error code
        error_code = "TOKEN_NOT_FOUND"
        if token:
            if token.is_used:
                error_code = "TOKEN_ALREADY_USED"
            else:
                error_code = "TOKEN_EXPIRED"

        return QRAccessTokenValidateResponse(
            valid=False,
            message=message,
            error_code=error_code
        )

    return QRAccessTokenValidateResponse(
        valid=True,
        message="Token hợp lệ. Có thể truy cập trang chấm công",
        redirect_url="/attendance/check-in",
        expires_in_seconds=expires_in
    )


@public_router.post("/consume", response_model=QRAccessTokenConsumeResponse)
def consume_qr_access_token(
    request: QRAccessTokenConsumeRequest,
    db: Session = Depends(get_db)
):
    """
    **[PUBLIC] Consume access token**

    Called after user successfully accesses the attendance page.
    Marks token as used to prevent reuse.

    **Request:**
    ```json
    {
        "access_token": "uuid-token",
        "user_pin": "1234"
    }
    ```

    **Response:**
    ```json
    {
        "success": true,
        "message": "Token đã được đánh dấu đã sử dụng"
    }
    ```
    """
    success, message = qr_access_manager.consume_qr_access_token(
        db=db,
        access_token=request.access_token,
        user_pin=request.user_pin
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return QRAccessTokenConsumeResponse(
        success=True,
        message=message
    )
