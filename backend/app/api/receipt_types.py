from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.receipt import ReceiptTypeCreate, ReceiptTypeUpdate, ReceiptTypeResponse
from app.models import User, ReceiptType
from app.dependencies.permissions import require_accountant_or_admin, get_current_user

router = APIRouter(prefix="/api/receipt-types", tags=["Receipt Types"])


@router.post("", response_model=ReceiptTypeResponse, status_code=status.HTTP_201_CREATED)
def create_receipt_type(
    receipt_type_data: ReceiptTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant_or_admin)
):
    existing = db.query(ReceiptType).filter(ReceiptType.name == receipt_type_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt type with this name already exists"
        )

    new_receipt_type = ReceiptType(**receipt_type_data.model_dump())
    db.add(new_receipt_type)
    db.commit()
    db.refresh(new_receipt_type)

    return new_receipt_type


@router.get("", response_model=List[ReceiptTypeResponse])
def get_receipt_types(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ReceiptType)
    if active_only:
        query = query.filter(ReceiptType.is_active == True)

    receipt_types = query.offset(skip).limit(limit).all()
    return receipt_types


@router.get("/{receipt_type_id}", response_model=ReceiptTypeResponse)
def get_receipt_type(
    receipt_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    receipt_type = db.query(ReceiptType).filter(ReceiptType.id == receipt_type_id).first()
    if not receipt_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt type not found"
        )
    return receipt_type


@router.patch("/{receipt_type_id}", response_model=ReceiptTypeResponse)
def update_receipt_type(
    receipt_type_id: int,
    receipt_type_data: ReceiptTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant_or_admin)
):
    receipt_type = db.query(ReceiptType).filter(ReceiptType.id == receipt_type_id).first()
    if not receipt_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt type not found"
        )

    update_data = receipt_type_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(receipt_type, key, value)

    db.commit()
    db.refresh(receipt_type)

    return receipt_type


@router.delete("/{receipt_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt_type(
    receipt_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant_or_admin)
):
    receipt_type = db.query(ReceiptType).filter(ReceiptType.id == receipt_type_id).first()
    if not receipt_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt type not found"
        )

    db.delete(receipt_type)
    db.commit()

    return None
