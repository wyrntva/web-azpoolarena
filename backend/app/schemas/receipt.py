from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from app.models import AccountType


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class ReceiptTypeBase(BaseModel):
    name: str
    description: Optional[str] = None


class ReceiptTypeCreate(ReceiptTypeBase):
    is_active: Optional[bool] = True
    is_inventory: Optional[bool] = False


class ReceiptTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_inventory: Optional[bool] = None


class ReceiptTypeResponse(ReceiptTypeBase):
    id: int
    is_active: bool
    is_inventory: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptBase(BaseModel):
    receipt_date: date
    amount: float
    receipt_type_id: int
    is_income: bool
    payment_method: AccountType
    note: Optional[str] = None


class ReceiptCreate(ReceiptBase):
    pass


class ReceiptUpdate(BaseModel):
    receipt_date: Optional[date] = None
    amount: Optional[float] = None
    receipt_type_id: Optional[int] = None
    is_income: Optional[bool] = None
    payment_method: Optional[AccountType] = None
    note: Optional[str] = None


class ReceiptResponse(ReceiptBase):
    id: int
    created_by: int
    created_by_user: UserSimple
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
