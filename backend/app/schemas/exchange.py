from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, date
from typing import Optional
from app.models import AccountType


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class ExchangeBase(BaseModel):
    exchange_date: date
    amount: float
    from_account: AccountType
    to_account: AccountType
    note: Optional[str] = None

    @field_validator('to_account')
    @classmethod
    def validate_accounts_different(cls, v, info):
        if 'from_account' in info.data and v == info.data['from_account']:
            raise ValueError('from_account and to_account must be different')
        return v


class ExchangeCreate(ExchangeBase):
    pass


class ExchangeUpdate(BaseModel):
    exchange_date: Optional[date] = None
    amount: Optional[float] = None
    from_account: Optional[AccountType] = None
    to_account: Optional[AccountType] = None
    note: Optional[str] = None


class ExchangeResponse(ExchangeBase):
    id: int
    created_by: int
    created_by_user: UserSimple
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
