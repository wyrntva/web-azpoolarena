from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.schemas.exchange import ExchangeCreate, ExchangeUpdate, ExchangeResponse
from app.models import User, Exchange
from app.dependencies.permissions import require_permission

router = APIRouter(prefix="/api/exchanges", tags=["Exchanges"])


@router.post("", response_model=ExchangeResponse, status_code=status.HTTP_201_CREATED)
def create_exchange(
    exchange_data: ExchangeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_finance'))
):
    new_exchange = Exchange(
        **exchange_data.model_dump(),
        created_by=current_user.id
    )

    db.add(new_exchange)
    db.commit()
    db.refresh(new_exchange)

    return new_exchange


@router.get("", response_model=List[ExchangeResponse])
def get_exchanges(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    query = db.query(Exchange).options(joinedload(Exchange.created_by_user))

    if start_date:
        query = query.filter(Exchange.exchange_date >= start_date)
    if end_date:
        query = query.filter(Exchange.exchange_date <= end_date)

    exchanges = query.order_by(Exchange.exchange_date.desc()).offset(skip).limit(limit).all()
    return exchanges


@router.get("/{exchange_id}", response_model=ExchangeResponse)
def get_exchange(
    exchange_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_finance'))
):
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange entry not found"
        )
    return exchange


@router.patch("/{exchange_id}", response_model=ExchangeResponse)
def update_exchange(
    exchange_id: int,
    exchange_data: ExchangeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('edit_finance'))
):
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange entry not found"
        )

    update_data = exchange_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(exchange, key, value)

    db.commit()
    db.refresh(exchange)

    return exchange


@router.delete("/{exchange_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exchange(
    exchange_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('delete_finance'))
):
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange entry not found"
        )

    db.delete(exchange)
    db.commit()

    return None
