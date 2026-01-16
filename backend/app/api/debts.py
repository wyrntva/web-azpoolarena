from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime
from app.db.session import get_db
from app.schemas.debt import DebtCreate, DebtUpdate, DebtResponse, DebtPayment
from app.models import User, Debt, Receipt, ReceiptType
from app.dependencies.permissions import require_permission

router = APIRouter(prefix="/api/debts", tags=["Debts"])


@router.post("", response_model=DebtResponse, status_code=status.HTTP_201_CREATED)
def create_debt(
    debt_data: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_finance'))
):
    new_debt = Debt(
        **debt_data.model_dump(),
        created_by=current_user.id
    )

    db.add(new_debt)
    db.commit()
    db.refresh(new_debt)

    # Load the relationship
    new_debt = db.query(Debt).options(joinedload(Debt.created_by_user)).filter(Debt.id == new_debt.id).first()

    return new_debt


@router.get("", response_model=List[DebtResponse])
def get_debts(
    skip: int = 0,
    limit: int = 100,
    is_paid: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    query = db.query(Debt).options(joinedload(Debt.created_by_user))

    if is_paid is not None:
        query = query.filter(Debt.is_paid == is_paid)

    debts = query.order_by(Debt.debt_date.desc()).offset(skip).limit(limit).all()
    return debts


@router.get("/{debt_id}", response_model=DebtResponse)
def get_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    debt = db.query(Debt).options(joinedload(Debt.created_by_user)).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt entry not found"
        )
    return debt


@router.patch("/{debt_id}", response_model=DebtResponse)
def update_debt(
    debt_id: int,
    debt_data: DebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('edit_finance'))
):
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt entry not found"
        )

    if debt.is_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a paid debt"
        )

    update_data = debt_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(debt, key, value)

    db.commit()
    db.refresh(debt)

    # Load the relationship
    debt = db.query(Debt).options(joinedload(Debt.created_by_user)).filter(Debt.id == debt_id).first()

    return debt


@router.post("/{debt_id}/pay", response_model=DebtResponse)
def pay_debt(
    debt_id: int,
    payment_data: DebtPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_finance'))
):
    """
    Pay a debt and automatically create a receipt in the finance system
    """
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt entry not found"
        )

    if debt.is_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debt is already paid"
        )

    # Find or create "Thu nợ" receipt type
    receipt_type = db.query(ReceiptType).filter(ReceiptType.name == "Thu nợ").first()
    if not receipt_type:
        receipt_type = ReceiptType(
            name="Thu nợ",
            description="Thu tiền nợ từ khách hàng",
            is_active=True
        )
        db.add(receipt_type)
        db.flush()

    # Create receipt
    receipt = Receipt(
        receipt_date=date.today(),
        amount=debt.amount,
        receipt_type_id=receipt_type.id,
        is_income=True,
        payment_method=payment_data.payment_method,
        note=f"Thu nợ từ {debt.debtor_name} - Nợ ngày {debt.debt_date.strftime('%d/%m/%Y')}",
        created_by=current_user.id
    )
    db.add(receipt)

    # Mark debt as paid
    debt.is_paid = True
    debt.paid_date = date.today()
    debt.payment_method = payment_data.payment_method

    db.commit()
    db.refresh(debt)

    # Load the relationship
    debt = db.query(Debt).options(joinedload(Debt.created_by_user)).filter(Debt.id == debt_id).first()

    return debt


@router.delete("/{debt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('delete_finance'))
):
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt entry not found"
        )

    if debt.is_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a paid debt"
        )

    db.delete(debt)
    db.commit()

    return None
