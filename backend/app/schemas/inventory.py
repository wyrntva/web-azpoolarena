from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional
from app.models import InventoryStatus


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class UnitSimple(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CategorySimple(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class InventoryBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(default=0, ge=0)
    min_quantity: int = Field(default=0, ge=0)
    category_id: int
    base_unit_id: int
    conversion_unit_id: Optional[int] = None
    conversion_rate: Optional[int] = Field(None, ge=1)


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity: Optional[int] = Field(None, ge=0)
    min_quantity: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None
    base_unit_id: Optional[int] = None
    conversion_unit_id: Optional[int] = None
    conversion_rate: Optional[int] = Field(None, ge=1)


class InventoryResponse(BaseModel):
    id: int
    product_name: str
    quantity: int
    min_quantity: int
    category_id: Optional[int]  # Optional for old data without category
    base_unit_id: int
    conversion_unit_id: Optional[int]
    conversion_rate: Optional[int]
    status: InventoryStatus
    created_by: int
    created_by_user: UserSimple
    category: Optional[CategorySimple]  # Optional for old data without category
    base_unit: UnitSimple
    large_unit: Optional[UnitSimple]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
