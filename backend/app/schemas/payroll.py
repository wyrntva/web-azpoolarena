from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


# Advance Payment Schemas
class AdvancePaymentBase(BaseModel):
    user_id: int
    date: date
    amount: float
    notes: Optional[str] = None


class AdvancePaymentCreate(AdvancePaymentBase):
    pass


class AdvancePaymentUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    notes: Optional[str] = None


class AdvancePaymentResponse(AdvancePaymentBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    employee_name: Optional[str] = None
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True


# Bonus Schemas
class BonusBase(BaseModel):
    user_id: int
    date: date
    amount: float
    notes: Optional[str] = None


class BonusCreate(BonusBase):
    pass


class BonusUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    notes: Optional[str] = None


class BonusResponse(BonusBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    employee_name: Optional[str] = None
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True


# Penalty Schemas
class PenaltyBase(BaseModel):
    user_id: int
    date: date
    amount: float
    notes: Optional[str] = None


class PenaltyCreate(PenaltyBase):
    pass


class PenaltyUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    notes: Optional[str] = None


class PenaltyResponse(PenaltyBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    employee_name: Optional[str] = None
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True


# Summary Schemas
class PayrollSummary(BaseModel):
    user_id: int
    user_name: str
    month: str
    total_advances: float
    total_bonuses: float
    total_penalties: float
    net_adjustment: float
