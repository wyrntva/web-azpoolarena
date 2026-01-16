from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class SafeBase(BaseModel):
    safe_date: date
    amount: float
    note: Optional[str] = None


class SafeCreate(SafeBase):
    pass


class SafeUpdate(BaseModel):
    safe_date: Optional[date] = None
    amount: Optional[float] = None
    note: Optional[str] = None


class SafeResponse(SafeBase):
    id: int
    created_by: int
    created_by_user: UserSimple
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
