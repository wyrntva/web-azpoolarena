from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict
from pydantic import BaseModel
import json
from datetime import datetime
from app.db.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.models import User, Role
from app.core.security import get_password_hash
from app.dependencies.permissions import require_admin, require_accountant_or_admin

from app.core.permissions import ALL_PERMISSIONS

router = APIRouter(prefix="/api/users", tags=["Users"])


class UpdateDisplayOrderRequest(BaseModel):
    user_orders: List[Dict[str, int]]  # [{"user_id": 1, "display_order": 1}, ...]

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
        "is_admin": user.is_admin, # Thêm trường này để frontend dùng luôn
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
                perms = json.loads(user.role.permissions) if user.role.permissions else []
                role_data["permissions"] = perms if isinstance(perms, list) else []
            except:
                role_data["permissions"] = []
        
        user_data["role"] = role_data

    return user_data


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check username uniqueness
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Check email uniqueness only if email is provided
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )

    role = db.query(Role).filter(Role.id == user_data.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role_id=user_data.role_id,
        pin=user_data.pin,
        salary_type=user_data.salary_type,
        fixed_salary=user_data.fixed_salary
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return parse_user_permissions(new_user)


@router.get("", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant_or_admin)
):
    users = db.query(User).options(joinedload(User.role)).order_by(
        User.display_order.asc().nullslast(),
        User.id.asc()
    ).offset(skip).limit(limit).all()
    return [parse_user_permissions(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return parse_user_permissions(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    print(f"[DEBUG] Update user {user_id} with data: {user_data.model_dump()}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    update_data = user_data.model_dump(exclude_unset=True)
    print(f"[DEBUG] Update data (exclude_unset): {update_data}")

    # Kiểm tra email không bị trùng (chỉ khi email không phải None)
    if "email" in update_data and update_data["email"] is not None:
        existing_user = db.query(User).filter(
            User.id != user_id,
            User.email == update_data["email"]
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    if "role_id" in update_data:
        role = db.query(Role).filter(Role.id == update_data["role_id"]).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return parse_user_permissions(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).options(
        joinedload(User.receipts),
        joinedload(User.revenues),
        joinedload(User.exchanges)
    ).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # Kiểm tra xem user có dữ liệu liên quan không
    has_receipts = len(user.receipts) > 0
    has_revenues = len(user.revenues) > 0
    has_exchanges = len(user.exchanges) > 0

    if has_receipts or has_revenues or has_exchanges:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete user with existing receipts, revenues, or exchanges. Please reassign or delete them first."
        )

    db.delete(user)
    db.commit()

    return None


@router.post("/update-display-order", response_model=dict)
def update_display_order(
    request: UpdateDisplayOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update display order for multiple users"""
    try:
        for item in request.user_orders:
            user = db.query(User).filter(User.id == item["user_id"]).first()
            if user:
                user.display_order = item["display_order"]

        db.commit()
        return {"status": "success", "message": "Display order updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update display order: {str(e)}"
        )
