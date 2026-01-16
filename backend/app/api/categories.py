from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.dependencies.permissions import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách categories"""
    query = db.query(Category)

    if is_active is not None:
        query = query.filter(Category.is_active == is_active)

    categories = query.offset(skip).limit(limit).all()
    return categories


@router.post("", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tạo category mới"""
    # Check if category name already exists
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category với tên này đã tồn tại")

    db_category = Category(
        **category.model_dump(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật category"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category không tồn tại")

    # Check name uniqueness if updating name
    if category.name and category.name != db_category.name:
        existing = db.query(Category).filter(Category.name == category.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category với tên này đã tồn tại")

    update_data = category.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)

    db_category.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xóa category (soft delete)"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category không tồn tại")

    db_category.is_active = False
    db_category.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Xóa category thành công"}
