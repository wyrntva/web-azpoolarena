from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from app.models import AccountType


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class DebtBase(BaseModel):
    debt_date: date
    amount: float
    debtor_name: str
    note: Optional[str] = None


class DebtCreate(DebtBase):
    pass


class DebtUpdate(BaseModel):
    debt_date: Optional[date] = None
    amount: Optional[float] = None
    debtor_name: Optional[str] = None
    note: Optional[str] = None


class DebtPayment(BaseModel):
    payment_method: AccountType


class DebtResponse(DebtBase):
    id: int
    is_paid: bool
    paid_date: Optional[date] = None
    payment_method: Optional[AccountType] = None
    created_by: int
    created_by_user: UserSimple
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
