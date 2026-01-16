from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.schemas.inventory_transaction import (
    InventoryInCreate,
    InventoryOutCreate,
    TransactionResponse
)
from app.models import (
    User,
    Inventory,
    InventoryTransaction,
    InventoryTransactionDetail,
    TransactionType,
    InventoryStatus,
    Receipt,
    ReceiptType,
    Category
)
from app.dependencies.permissions import require_permission

router_in = APIRouter(prefix="/api/inventory-in", tags=["Inventory In"])
router_out = APIRouter(prefix="/api/inventory-out", tags=["Inventory Out"])


def update_inventory_status(inventory: Inventory):
    """Update inventory status based on quantity and min_quantity"""
    if inventory.quantity <= 0:
        inventory.status = InventoryStatus.OUT_OF_STOCK
    elif inventory.quantity <= inventory.min_quantity:
        inventory.status = InventoryStatus.LOW_STOCK
    else:
        inventory.status = InventoryStatus.IN_STOCK


@router_in.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_in(
    transaction_data: InventoryInCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_inventory'))
):
    """Create a new inventory import transaction with database transaction"""
    try:
        # Create transaction
        new_transaction = InventoryTransaction(
            transaction_date=transaction_data.import_date,
            transaction_type=TransactionType.IN,
            note=transaction_data.note,
            created_by=current_user.id
        )
        db.add(new_transaction)
        db.flush()

        # Track items for receipt creation grouped by receipt type
        items_by_receipt_type = {}  # receipt_type_id -> {items: [], total: 0, payment_methods: set()}

        # Process each item
        for item in transaction_data.items:
            # Get inventory item with category
            inventory = db.query(Inventory).options(
                joinedload(Inventory.category),
                joinedload(Inventory.base_unit_ref),
                joinedload(Inventory.conversion_unit_ref)
            ).filter(
                Inventory.id == item.inventory_id
            ).first()

            if not inventory:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Không tìm thấy sản phẩm với ID {item.inventory_id}"
                )

            # Calculate actual quantity based on unit type
            actual_quantity = item.quantity
            display_unit = inventory.base_unit_ref.name if inventory.base_unit_ref else ""

            if item.unit_type == "large" and inventory.conversion_rate:
                actual_quantity = item.quantity * inventory.conversion_rate
                display_unit = inventory.conversion_unit_ref.name if inventory.conversion_unit_ref else ""

            # Create transaction detail with price and payment_method
            detail = InventoryTransactionDetail(
                transaction_id=new_transaction.id,
                inventory_id=item.inventory_id,
                quantity=actual_quantity,
                unit_type=item.unit_type,
                price=item.price,
                payment_method=item.payment_method
            )
            db.add(detail)

            # Update inventory quantity
            inventory.quantity += actual_quantity

            # Update status
            update_inventory_status(inventory)

            # Track for receipt creation (only if price is provided)
            if item.price and item.price > 0:
                # Find the appropriate receipt type for this product's category
                # Try to find a receipt type with the same name as the product's category
                receipt_type = None
                if inventory.category:
                    receipt_type = db.query(ReceiptType).filter(
                        ReceiptType.name == inventory.category.name,
                        ReceiptType.is_inventory == True,
                        ReceiptType.is_active == True
                    ).first()

                # If no matching receipt type found, use the first inventory receipt type
                if not receipt_type:
                    receipt_type = db.query(ReceiptType).filter(
                        ReceiptType.is_inventory == True,
                        ReceiptType.is_active == True
                    ).first()

                # If still no receipt type, use any active one
                if not receipt_type:
                    receipt_type = db.query(ReceiptType).filter(
                        ReceiptType.is_active == True
                    ).first()

                if receipt_type:
                    # Initialize receipt type group if not exists
                    if receipt_type.id not in items_by_receipt_type:
                        items_by_receipt_type[receipt_type.id] = {
                            'items': [],
                            'total': 0,
                            'payment_methods': set()
                        }

                    # Add item to the group
                    items_by_receipt_type[receipt_type.id]['items'].append({
                        'product_name': inventory.product_name,
                        'quantity': item.quantity,
                        'unit': display_unit,
                        'price': item.price,
                    })
                    items_by_receipt_type[receipt_type.id]['total'] += item.price
                    if item.payment_method:
                        items_by_receipt_type[receipt_type.id]['payment_methods'].add(item.payment_method)

        # Create receipts for each receipt type group
        for receipt_type_id, group_data in items_by_receipt_type.items():
            # Build note with product list
            note_items = [f"{item['quantity']} {item['unit']} {item['product_name']}" for item in group_data['items']]
            note = f"Nhập kho: {', '.join(note_items)}"
            if transaction_data.note:
                note += f" - {transaction_data.note}"

            # Get payment method (use the first one)
            payment_method = list(group_data['payment_methods'])[0] if group_data['payment_methods'] else None

            # Create receipt (phiếu chi)
            receipt = Receipt(
                receipt_date=transaction_data.import_date,
                amount=group_data['total'],
                receipt_type_id=receipt_type_id,
                note=note,
                created_by=current_user.id,
                is_income=False,  # Phiếu chi
                payment_method=payment_method
            )
            db.add(receipt)

        db.commit()
        db.refresh(new_transaction)

        # Load relationships
        transaction = db.query(InventoryTransaction).options(
            joinedload(InventoryTransaction.created_by_user),
            joinedload(InventoryTransaction.details).joinedload(InventoryTransactionDetail.inventory)
        ).filter(InventoryTransaction.id == new_transaction.id).first()

        return transaction
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo phiếu nhập kho: {str(e)}"
        )


@router_in.get("", response_model=List[TransactionResponse])
def get_inventory_ins(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_inventory'))
):
    """Get all inventory import transactions"""
    transactions = db.query(InventoryTransaction).options(
        joinedload(InventoryTransaction.created_by_user),
        joinedload(InventoryTransaction.details).joinedload(InventoryTransactionDetail.inventory)
    ).filter(
        InventoryTransaction.transaction_type == TransactionType.IN
    ).order_by(
        InventoryTransaction.transaction_date.desc()
    ).offset(skip).limit(limit).all()

    return transactions


@router_out.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_out(
    transaction_data: InventoryOutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('create_inventory'))
):
    """Create a new inventory export transaction"""
    # Create transaction
    new_transaction = InventoryTransaction(
        transaction_date=transaction_data.export_date,
        transaction_type=TransactionType.OUT,
        note=transaction_data.note,
        created_by=current_user.id
    )
    db.add(new_transaction)
    db.flush()

    # Process each item
    for item in transaction_data.items:
        # Get inventory item
        inventory = db.query(Inventory).filter(
            Inventory.id == item.inventory_id
        ).first()

        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy sản phẩm với ID {item.inventory_id}"
            )

        # Calculate actual quantity based on unit type
        actual_quantity = item.quantity
        if item.unit_type == "large" and inventory.conversion_rate:
            actual_quantity = item.quantity * inventory.conversion_rate

        # Check if sufficient quantity available
        if inventory.quantity < actual_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không đủ hàng trong kho. Sản phẩm '{inventory.product_name}' chỉ còn {inventory.quantity}"
            )

        # Create transaction detail
        detail = InventoryTransactionDetail(
            transaction_id=new_transaction.id,
            inventory_id=item.inventory_id,
            quantity=actual_quantity,
            unit_type=item.unit_type
        )
        db.add(detail)

        # Update inventory quantity
        inventory.quantity -= actual_quantity

        # Update status
        update_inventory_status(inventory)

    db.commit()
    db.refresh(new_transaction)

    # Load relationships
    transaction = db.query(InventoryTransaction).options(
        joinedload(InventoryTransaction.created_by_user),
        joinedload(InventoryTransaction.details).joinedload(InventoryTransactionDetail.inventory)
    ).filter(InventoryTransaction.id == new_transaction.id).first()

    return transaction


@router_out.get("", response_model=List[TransactionResponse])
def get_inventory_outs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission('view_inventory'))
):
    """Get all inventory export transactions"""
    transactions = db.query(InventoryTransaction).options(
        joinedload(InventoryTransaction.created_by_user),
        joinedload(InventoryTransaction.details).joinedload(InventoryTransactionDetail.inventory)
    ).filter(
        InventoryTransaction.transaction_type == TransactionType.OUT
    ).order_by(
        InventoryTransaction.transaction_date.desc()
    ).offset(skip).limit(limit).all()

    return transactions
