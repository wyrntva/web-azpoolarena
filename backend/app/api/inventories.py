from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db.session import get_db
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryResponse
from app.models import User, Inventory, InventoryStatus
from app.dependencies.permissions import require_permission

router = APIRouter(prefix="/api/inventories", tags=["Inventories"])


def update_inventory_status(inventory: Inventory):
    """Update inventory status based on quantity and min_quantity"""
    if inventory.quantity <= 0:
        inventory.status = InventoryStatus.OUT_OF_STOCK
    elif inventory.quantity <= inventory.min_quantity:
        inventory.status = InventoryStatus.LOW_STOCK
    else:
        inventory.status = InventoryStatus.IN_STOCK


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    inventory_data: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_inventory'))
):
    """Create a new inventory item"""
    # Check if product already exists
    existing = db.query(Inventory).filter(
        Inventory.product_name == inventory_data.product_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sản phẩm '{inventory_data.product_name}' đã tồn tại"
        )

    new_inventory = Inventory(
        **inventory_data.model_dump(),
        created_by=current_user.id
    )

    # Set initial status
    update_inventory_status(new_inventory)

    db.add(new_inventory)
    db.commit()
    db.refresh(new_inventory)

    # Load relationship
    new_inventory = db.query(Inventory).options(
        joinedload(Inventory.created_by_user),
        joinedload(Inventory.category),
        joinedload(Inventory.base_unit_ref),
        joinedload(Inventory.conversion_unit_ref)
    ).filter(Inventory.id == new_inventory.id).first()

    # Map conversion_unit_ref to large_unit for the response
    new_inventory.base_unit = new_inventory.base_unit_ref
    new_inventory.large_unit = new_inventory.conversion_unit_ref

    return new_inventory


@router.get("", response_model=List[InventoryResponse])
def get_inventories(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[InventoryStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_inventory'))
):
    """Get all inventory items with optional filters"""
    query = db.query(Inventory).options(
        joinedload(Inventory.created_by_user),
        joinedload(Inventory.category),
        joinedload(Inventory.base_unit_ref),
        joinedload(Inventory.conversion_unit_ref)
    )

    # Apply status filter
    if status_filter:
        query = query.filter(Inventory.status == status_filter)

    # Apply search filter
    if search:
        query = query.filter(Inventory.product_name.ilike(f"%{search}%"))

    inventories = query.order_by(Inventory.product_name).offset(skip).limit(limit).all()

    # Map conversion_unit_ref to large_unit for the response
    for inv in inventories:
        inv.base_unit = inv.base_unit_ref
        inv.large_unit = inv.conversion_unit_ref

    return inventories


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_inventory'))
):
    """Get a specific inventory item by ID"""
    inventory = db.query(Inventory).options(
        joinedload(Inventory.created_by_user),
        joinedload(Inventory.base_unit_ref),
        joinedload(Inventory.conversion_unit_ref)
    ).filter(Inventory.id == inventory_id).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm"
        )

    # Map conversion_unit_ref to large_unit for the response
    inventory.base_unit = inventory.base_unit_ref
    inventory.large_unit = inventory.conversion_unit_ref

    return inventory


@router.patch("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('edit_inventory'))
):
    """Update an inventory item"""
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm"
        )

    update_data = inventory_data.model_dump(exclude_unset=True)

    # Check if product name is being changed and if it already exists
    if "product_name" in update_data and update_data["product_name"] != inventory.product_name:
        existing = db.query(Inventory).filter(
            Inventory.product_name == update_data["product_name"],
            Inventory.id != inventory_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sản phẩm '{update_data['product_name']}' đã tồn tại"
            )

    # Apply updates
    for key, value in update_data.items():
        setattr(inventory, key, value)

    # Update status based on new quantity
    update_inventory_status(inventory)

    db.commit()
    db.refresh(inventory)

    # Load relationship
    inventory = db.query(Inventory).options(
        joinedload(Inventory.created_by_user),
        joinedload(Inventory.base_unit_ref),
        joinedload(Inventory.conversion_unit_ref)
    ).filter(Inventory.id == inventory_id).first()

    # Map conversion_unit_ref to large_unit for the response
    inventory.base_unit = inventory.base_unit_ref
    inventory.large_unit = inventory.conversion_unit_ref

    return inventory


@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('delete_inventory'))
):
    """Delete an inventory item"""
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm"
        )

    db.delete(inventory)
    db.commit()

    return None
