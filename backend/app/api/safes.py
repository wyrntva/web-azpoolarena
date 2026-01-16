from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, extract
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.schemas.safe import SafeCreate, SafeUpdate, SafeResponse
from app.models import User, Safe, Revenue, Exchange, AccountType, Receipt, Debt
from app.dependencies.permissions import require_permission

router = APIRouter(prefix="/api/safes", tags=["Safes"])


@router.post("", response_model=SafeResponse, status_code=status.HTTP_201_CREATED)
def create_safe(
    safe_data: SafeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_finance'))
):
    new_safe = Safe(
        **safe_data.model_dump(),
        created_by=current_user.id
    )

    db.add(new_safe)
    db.commit()
    db.refresh(new_safe)

    # Load the relationship
    db.refresh(new_safe)
    new_safe = db.query(Safe).options(joinedload(Safe.created_by_user)).filter(Safe.id == new_safe.id).first()

    return new_safe


@router.get("", response_model=List[SafeResponse])
def get_safes(
    skip: int = 0,
    limit: int = 100,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    query = db.query(Safe).options(joinedload(Safe.created_by_user))

    if month and year:
        query = query.filter(
            and_(
                extract('month', Safe.safe_date) == month,
                extract('year', Safe.safe_date) == year
            )
        )
    elif year:
        query = query.filter(extract('year', Safe.safe_date) == year)

    safes = query.order_by(Safe.safe_date.desc()).offset(skip).limit(limit).all()
    return safes


@router.get("/balance", response_model=dict)
def get_safe_balance(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    """
    Calculate safe balance:
    Balance = Cash Revenue - Cash Expenses - Bank to Cash - Total Debt + Cash Income + Cash to Bank + Safe Adjustments
    """

    # Base query filters
    revenue_filter = []
    receipt_filter = []
    safe_filter = []
    exchange_filter = []
    debt_filter = []

    if month and year:
        revenue_filter.append(and_(
            extract('month', Revenue.revenue_date) == month,
            extract('year', Revenue.revenue_date) == year
        ))
        receipt_filter.append(and_(
            extract('month', Receipt.receipt_date) == month,
            extract('year', Receipt.receipt_date) == year
        ))
        safe_filter.append(and_(
            extract('month', Safe.safe_date) == month,
            extract('year', Safe.safe_date) == year
        ))
        exchange_filter.append(and_(
            extract('month', Exchange.exchange_date) == month,
            extract('year', Exchange.exchange_date) == year
        ))
        debt_filter.append(and_(
            extract('month', Debt.debt_date) == month,
            extract('year', Debt.debt_date) == year
        ))
    elif year:
        revenue_filter.append(extract('year', Revenue.revenue_date) == year)
        receipt_filter.append(extract('year', Receipt.receipt_date) == year)
        safe_filter.append(extract('year', Safe.safe_date) == year)
        exchange_filter.append(extract('year', Exchange.exchange_date) == year)
        debt_filter.append(extract('year', Debt.debt_date) == year)

    # Calculate cash revenue
    cash_revenue_query = db.query(func.sum(Revenue.cash_revenue))
    if revenue_filter:
        cash_revenue_query = cash_revenue_query.filter(*revenue_filter)
    cash_revenue = cash_revenue_query.scalar() or 0.0

    # Calculate cash expenses (receipts with payment_method = cash and is_income = false)
    cash_expenses_query = db.query(func.sum(Receipt.amount)).filter(
        Receipt.payment_method == AccountType.CASH,
        Receipt.is_income == False
    )
    if receipt_filter:
        cash_expenses_query = cash_expenses_query.filter(*receipt_filter)
    cash_expenses = cash_expenses_query.scalar() or 0.0

    # Calculate cash income (receipts with payment_method = cash and is_income = true)
    cash_income_query = db.query(func.sum(Receipt.amount)).filter(
        Receipt.payment_method == AccountType.CASH,
        Receipt.is_income == True
    )
    if receipt_filter:
        cash_income_query = cash_income_query.filter(*receipt_filter)
    cash_income = cash_income_query.scalar() or 0.0

    # Calculate total unpaid debt
    total_debt_query = db.query(func.sum(Debt.amount)).filter(
        Debt.is_paid == False
    )
    if debt_filter:
        total_debt_query = total_debt_query.filter(*debt_filter)
    total_debt = total_debt_query.scalar() or 0.0

    # Calculate safe adjustments
    safe_adjustments_query = db.query(func.sum(Safe.amount))
    if safe_filter:
        safe_adjustments_query = safe_adjustments_query.filter(*safe_filter)
    safe_adjustments = safe_adjustments_query.scalar() or 0.0

    # Calculate exchanges from bank to cash (adds to safe)
    bank_to_cash_query = db.query(func.sum(Exchange.amount)).filter(
        Exchange.from_account == AccountType.BANK,
        Exchange.to_account == AccountType.CASH
    )
    if exchange_filter:
        bank_to_cash_query = bank_to_cash_query.filter(*exchange_filter)
    bank_to_cash = bank_to_cash_query.scalar() or 0.0

    # Calculate exchanges from cash to bank (subtracts from safe)
    cash_to_bank_query = db.query(func.sum(Exchange.amount)).filter(
        Exchange.from_account == AccountType.CASH,
        Exchange.to_account == AccountType.BANK
    )
    if exchange_filter:
        cash_to_bank_query = cash_to_bank_query.filter(*exchange_filter)
    cash_to_bank = cash_to_bank_query.scalar() or 0.0

    # Calculate bank revenue
    bank_revenue_query = db.query(func.sum(Revenue.bank_revenue))
    if revenue_filter:
        bank_revenue_query = bank_revenue_query.filter(*revenue_filter)
    bank_revenue = bank_revenue_query.scalar() or 0.0

    # Calculate bank income (receipts with payment_method = bank and is_income = true)
    bank_income_query = db.query(func.sum(Receipt.amount)).filter(
        Receipt.payment_method == AccountType.BANK,
        Receipt.is_income == True
    )
    if receipt_filter:
        bank_income_query = bank_income_query.filter(*receipt_filter)
    bank_income = bank_income_query.scalar() or 0.0

    # Calculate bank expenses (receipts with payment_method = bank and is_income = false)
    bank_expenses_query = db.query(func.sum(Receipt.amount)).filter(
        Receipt.payment_method == AccountType.BANK,
        Receipt.is_income == False
    )
    if receipt_filter:
        bank_expenses_query = bank_expenses_query.filter(*receipt_filter)
    bank_expenses = bank_expenses_query.scalar() or 0.0

    # Calculate balance (Cash safe)
    # Balance = Cash Revenue + Cash Income + Bank to Cash - Cash Expenses - Cash to Bank - Total Debt + Safe Adjustments
    balance = cash_revenue + cash_income + bank_to_cash - cash_expenses - cash_to_bank - total_debt + safe_adjustments

    # Calculate bank balance
    # Bank Balance = Bank Revenue + Bank Income + Cash to Bank - Bank Expenses - Bank to Cash
    bank_balance = bank_revenue + bank_income + cash_to_bank - bank_expenses - bank_to_cash

    return {
        "balance": balance,
        "bank_balance": bank_balance,
        "cash_revenue": cash_revenue,
        "cash_expenses": cash_expenses,
        "cash_income": cash_income,
        "bank_revenue": bank_revenue,
        "bank_income": bank_income,
        "bank_expenses": bank_expenses,
        "total_debt": total_debt,
        "safe_adjustments": safe_adjustments,
        "bank_to_cash": bank_to_cash,
        "cash_to_bank": cash_to_bank
    }


@router.get("/{safe_id}", response_model=SafeResponse)
def get_safe(
    safe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    safe = db.query(Safe).options(joinedload(Safe.created_by_user)).filter(Safe.id == safe_id).first()
    if not safe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safe entry not found"
        )
    return safe


@router.patch("/{safe_id}", response_model=SafeResponse)
def update_safe(
    safe_id: int,
    safe_data: SafeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('edit_finance'))
):
    safe = db.query(Safe).filter(Safe.id == safe_id).first()
    if not safe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safe entry not found"
        )

    update_data = safe_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(safe, key, value)

    db.commit()
    db.refresh(safe)

    # Load the relationship
    safe = db.query(Safe).options(joinedload(Safe.created_by_user)).filter(Safe.id == safe_id).first()

    return safe


@router.delete("/{safe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_safe(
    safe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('delete_finance'))
):
    safe = db.query(Safe).filter(Safe.id == safe_id).first()
    if not safe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safe entry not found"
        )

    db.delete(safe)
    db.commit()

    return None
