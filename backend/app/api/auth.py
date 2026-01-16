from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.db.session import get_db
from app.schemas.auth import LoginRequest, Token, RefreshRequest, TokenRefresh
from app.schemas.user import UserMe
from app.models import User
from app.core.security import verify_password
from app.core.jwt import create_access_token, create_refresh_token, decode_token
from app.dependencies.permissions import get_current_user, get_user_permissions

from app.core.permissions import ALL_PERMISSIONS

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)

def parse_user_permissions(user: User) -> dict:
    """Parse JSON permissions string to list for response"""
    now = datetime.utcnow()
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "pin": user.pin,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "role_id": user.role_id,
        "salary_type": user.salary_type.value if hasattr(user.salary_type, 'value') else user.salary_type,
        "fixed_salary": user.fixed_salary,
        "created_at": (user.created_at or now).isoformat() if user.created_at else now.isoformat(),
        "updated_at": (user.updated_at or now).isoformat() if user.updated_at else now.isoformat(),
    }

    if user.role:
        role_data = {
            "id": user.role.id,
            "name": user.role.name,
            "description": user.role.description,
            "is_active": user.role.is_active,
            "is_system": user.role.is_system,
            "created_at": (user.role.created_at or now).isoformat() if user.role.created_at else now.isoformat(),
            "updated_at": (user.role.updated_at or now).isoformat() if user.role.updated_at else now.isoformat(),
        }

        # Quản lý automatically gets all permissions
        if user.is_admin:
            role_data["permissions"] = ALL_PERMISSIONS
        else:
            try:
                permissions = json.loads(user.role.permissions) if user.role.permissions else []
                role_data["permissions"] = permissions if isinstance(permissions, list) else []
            except:
                role_data["permissions"] = []

        user_data["role"] = role_data

    return user_data


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # Max 5 login attempts per minute per IP
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenRefresh)
@limiter.limit("10/minute")  # Max 10 refresh requests per minute per IP
def refresh_token(request: Request, refresh_data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(refresh_data.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in refresh token"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserMe)
def get_me(current_user: User = Depends(get_current_user)):
    return parse_user_permissions(current_user)


@router.get("/permissions", response_model=List[str])
def get_my_permissions(current_user: User = Depends(get_current_user)):
    """Get current user's permissions"""
    return get_user_permissions(current_user)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}
