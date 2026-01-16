from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import Optional, List
from app.models import TransactionType, AccountType


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class InventorySimple(BaseModel):
    id: int
    product_name: str

    model_config = ConfigDict(from_attributes=True)


class TransactionDetailBase(BaseModel):
    inventory_id: int
    quantity: int = Field(..., gt=0)
    unit_type: str = Field(default="base")
    price: Optional[float] = Field(None, ge=0)  # Giá tiền
    payment_method: Optional[AccountType] = None  # Hình thức thanh toán


class TransactionDetailCreate(TransactionDetailBase):
    pass


class TransactionDetailResponse(BaseModel):
    id: int
    transaction_id: int
    inventory_id: int
    quantity: int
    unit_type: str
    price: Optional[float]
    payment_method: Optional[AccountType]
    inventory: InventorySimple
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionBase(BaseModel):
    transaction_date: date
    note: Optional[str] = None


class TransactionCreate(TransactionBase):
    transaction_type: TransactionType
    items: List[TransactionDetailCreate] = Field(..., min_length=1)


class TransactionResponse(BaseModel):
    id: int
    transaction_date: date
    transaction_type: TransactionType
    note: Optional[str]
    created_by: int
    created_by_user: UserSimple
    details: List[TransactionDetailResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Specific schemas for import/export
class InventoryInCreate(BaseModel):
    import_date: date
    note: Optional[str] = None
    items: List[TransactionDetailCreate] = Field(..., min_length=1)


class InventoryOutCreate(BaseModel):
    export_date: date
    note: Optional[str] = None
    items: List[TransactionDetailCreate] = Field(..., min_length=1)
