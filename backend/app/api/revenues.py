from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.schemas.revenue import RevenueCreate, RevenueUpdate, RevenueResponse
from app.models import User, Revenue
from app.dependencies.permissions import require_permission

router = APIRouter(prefix="/api/revenues", tags=["Revenues"])


@router.post("", response_model=RevenueResponse, status_code=status.HTTP_201_CREATED)
def create_revenue(
    revenue_data: RevenueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_revenue'))
):
    existing = db.query(Revenue).filter(Revenue.revenue_date == revenue_data.revenue_date).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Revenue entry already exists for this date"
        )

    new_revenue = Revenue(
        **revenue_data.model_dump(),
        created_by=current_user.id
    )

    db.add(new_revenue)
    db.commit()
    db.refresh(new_revenue)

    return new_revenue


@router.get("", response_model=List[RevenueResponse])
def get_revenues(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_revenue'))
):
    query = db.query(Revenue).options(joinedload(Revenue.created_by_user))

    if start_date:
        query = query.filter(Revenue.revenue_date >= start_date)
    if end_date:
        query = query.filter(Revenue.revenue_date <= end_date)

    revenues = query.order_by(Revenue.revenue_date.desc()).offset(skip).limit(limit).all()
    return revenues


@router.get("/{revenue_id}", response_model=RevenueResponse)
def get_revenue(
    revenue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_revenue'))
):
    revenue = db.query(Revenue).filter(Revenue.id == revenue_id).first()
    if not revenue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Revenue entry not found"
        )
    return revenue


@router.get("/by-date/{revenue_date}", response_model=RevenueResponse)
def get_revenue_by_date(
    revenue_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_revenue'))
):
    revenue = db.query(Revenue).filter(Revenue.revenue_date == revenue_date).first()
    if not revenue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Revenue entry not found for this date"
        )
    return revenue


@router.patch("/{revenue_id}", response_model=RevenueResponse)
def update_revenue(
    revenue_id: int,
    revenue_data: RevenueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('edit_revenue'))
):
    revenue = db.query(Revenue).filter(Revenue.id == revenue_id).first()
    if not revenue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Revenue entry not found"
        )

    update_data = revenue_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(revenue, key, value)

    db.commit()
    db.refresh(revenue)

    return revenue


@router.delete("/{revenue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_revenue(
    revenue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('delete_revenue'))
):
    revenue = db.query(Revenue).filter(Revenue.id == revenue_id).first()
    if not revenue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Revenue entry not found"
        )

    db.delete(revenue)
    db.commit()

    return None
