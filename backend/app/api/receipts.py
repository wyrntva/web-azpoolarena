from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.schemas.receipt import ReceiptCreate, ReceiptUpdate, ReceiptResponse
from app.models import User, Receipt, ReceiptType
from app.dependencies.permissions import require_permission

router = APIRouter(prefix="/api/receipts", tags=["Receipts"])


@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(
    receipt_data: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_finance'))
):
    receipt_type = db.query(ReceiptType).filter(ReceiptType.id == receipt_data.receipt_type_id).first()
    if not receipt_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt type not found"
        )

    new_receipt = Receipt(
        **receipt_data.model_dump(),
        created_by=current_user.id
    )

    db.add(new_receipt)
    db.commit()
    db.refresh(new_receipt)

    return new_receipt


@router.get("", response_model=List[ReceiptResponse])
def get_receipts(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    receipt_type_id: Optional[int] = None,
    is_income: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    query = db.query(Receipt).options(joinedload(Receipt.created_by_user))

    if start_date:
        query = query.filter(Receipt.receipt_date >= start_date)
    if end_date:
        query = query.filter(Receipt.receipt_date <= end_date)
    if receipt_type_id:
        query = query.filter(Receipt.receipt_type_id == receipt_type_id)
    if is_income is not None:
        query = query.filter(Receipt.is_income == is_income)

    receipts = query.order_by(Receipt.receipt_date.desc()).offset(skip).limit(limit).all()
    return receipts


@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    return receipt


@router.patch("/{receipt_id}", response_model=ReceiptResponse)
def update_receipt(
    receipt_id: int,
    receipt_data: ReceiptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('edit_finance'))
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )

    update_data = receipt_data.model_dump(exclude_unset=True)

    if "receipt_type_id" in update_data:
        receipt_type = db.query(ReceiptType).filter(ReceiptType.id == update_data["receipt_type_id"]).first()
        if not receipt_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receipt type not found"
            )

    for key, value in update_data.items():
        setattr(receipt, key, value)

    db.commit()
    db.refresh(receipt)

    return receipt


@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('delete_finance'))
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )

    db.delete(receipt)
    db.commit()

    return None
