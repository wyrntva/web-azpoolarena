from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = []
    is_active: bool = True


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = []
    is_active: bool
    is_system: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
