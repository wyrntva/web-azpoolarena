from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class RevenueBase(BaseModel):
    revenue_date: date
    cash_revenue: float = 0.0
    bank_revenue: float = 0.0
    note: Optional[str] = None


class RevenueCreate(RevenueBase):
    pass


class RevenueUpdate(BaseModel):
    cash_revenue: Optional[float] = None
    bank_revenue: Optional[float] = None
    note: Optional[str] = None


class RevenueResponse(RevenueBase):
    id: int
    created_by: int
    created_by_user: UserSimple
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
