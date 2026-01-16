from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from app.db.session import get_db
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse
from app.models import Role, User
from app.dependencies.permissions import require_admin

router = APIRouter(prefix="/api/roles", tags=["Roles"])


@router.get("", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all roles"""
    roles = db.query(Role).all()

    # Convert permissions JSON string to list
    for role in roles:
        if role.permissions:
            try:
                role.permissions = json.loads(role.permissions)
            except:
                role.permissions = []
        else:
            role.permissions = []

    return roles


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get role by ID"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # Convert permissions JSON string to list
    if role.permissions:
        try:
            role.permissions = json.loads(role.permissions)
        except:
            role.permissions = []
    else:
        role.permissions = []

    return role


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new role"""
    # Check if role name already exists
    existing_role = db.query(Role).filter(Role.name == role_data.name).first()
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists"
        )

    # Convert permissions list to JSON string
    permissions_json = json.dumps(role_data.permissions) if role_data.permissions else json.dumps([])

    new_role = Role(
        name=role_data.name,
        description=role_data.description,
        permissions=permissions_json,
        is_active=role_data.is_active,
        is_system=False  # New roles are never system roles
    )

    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    # Convert back to list for response
    new_role.permissions = json.loads(new_role.permissions) if new_role.permissions else []

    return new_role


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a role"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # Prevent modification of system role name
    if role.is_system and role_data.name and role_data.name != role.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change name of system role"
        )

    # Update fields
    if role_data.name is not None:
        # Check name uniqueness
        existing = db.query(Role).filter(
            Role.name == role_data.name,
            Role.id != role_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists"
            )
        role.name = role_data.name

    if role_data.description is not None:
        role.description = role_data.description

    if role_data.permissions is not None:
        role.permissions = json.dumps(role_data.permissions)

    if role_data.is_active is not None:
        role.is_active = role_data.is_active

    db.commit()
    db.refresh(role)

    # Convert permissions back to list for response
    role.permissions = json.loads(role.permissions) if role.permissions else []

    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a role"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # Prevent deletion of system roles
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system role"
        )

    # Check if role is assigned to any users
    users_count = db.query(User).filter(User.role_id == role_id).count()
    if users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role. It is assigned to {users_count} user(s)"
        )

    db.delete(role)
    db.commit()

    return None
