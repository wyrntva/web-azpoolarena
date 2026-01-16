from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.unit import UnitCreate, UnitUpdate, UnitResponse
from app.models import User, Unit
from app.dependencies.permissions import get_current_user, require_accountant_or_admin

router = APIRouter(prefix="/api/units", tags=["Units"])


@router.post("", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit_data: UnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant_or_admin)
):
    """Create a new unit"""
    # Check if unit already exists
    existing = db.query(Unit).filter(
        Unit.name == unit_data.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Đơn vị '{unit_data.name}' đã tồn tại"
        )

    new_unit = Unit(**unit_data.model_dump())
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)

    return new_unit


@router.get("", response_model=List[UnitResponse])
def get_units(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all units"""
    units = db.query(Unit).filter(
        Unit.is_active == True
    ).order_by(Unit.name).offset(skip).limit(limit).all()

    return units


@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific unit by ID"""
    unit = db.query(Unit).filter(Unit.id == unit_id).first()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đơn vị"
        )

    return unit


@router.patch("/{unit_id}", response_model=UnitResponse)
def update_unit(
    unit_id: int,
    unit_data: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant_or_admin)
):
    """Update a unit"""
    unit = db.query(Unit).filter(Unit.id == unit_id).first()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đơn vị"
        )

    update_data = unit_data.model_dump(exclude_unset=True)

    # Check if unit name is being changed and if it already exists
    if "name" in update_data and update_data["name"] != unit.name:
        existing = db.query(Unit).filter(
            Unit.name == update_data["name"],
            Unit.id != unit_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Đơn vị '{update_data['name']}' đã tồn tại"
            )

    # Apply updates
    for key, value in update_data.items():
        setattr(unit, key, value)

    db.commit()
    db.refresh(unit)

    return unit


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant_or_admin)
):
    """Delete a unit (soft delete by setting is_active to False)"""
    unit = db.query(Unit).filter(Unit.id == unit_id).first()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đơn vị"
        )

    # Soft delete
    unit.is_active = False
    db.commit()

    return None
