from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List
import re


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleResponse(RoleBase):
    id: int
    permissions: Optional[List[str]] = None
    is_active: bool = True
    is_system: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: str

    @field_validator('username')
    @classmethod
    def validate_phone_number(cls, v):
        if not re.match(r'^0[0-9]{9,10}$', v):
            raise ValueError('Số điện thoại phải có 10-11 số và bắt đầu bằng số 0')
        return v

    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v):
        # Convert empty string to None
        if v == '':
            return None
        return v


class UserCreate(UserBase):
    password: str
    role_id: int
    pin: Optional[str] = None
    salary_type: Optional[str] = 'hourly'  # 'hourly' or 'fixed'
    fixed_salary: Optional[float] = None

    @field_validator('pin')
    @classmethod
    def validate_pin(cls, v):
        if v is not None and not re.match(r'^\d{4}$', v):
            raise ValueError('PIN phải là 4 chữ số')
        return v

    @field_validator('salary_type')
    @classmethod
    def validate_salary_type(cls, v):
        if v not in ['hourly', 'fixed']:
            raise ValueError('salary_type phải là hourly hoặc fixed')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    pin: Optional[str] = None
    salary_type: Optional[str] = None
    fixed_salary: Optional[float] = None

    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v):
        # Convert empty string to None
        if v == '':
            return None
        return v

    @field_validator('pin', mode='before')
    @classmethod
    def validate_pin(cls, v):
        # Convert empty string to None
        if v == '':
            return None
        if v is not None and not re.match(r'^\d{4}$', v):
            raise ValueError('PIN phải là 4 chữ số')
        return v

    @field_validator('salary_type', mode='before')
    @classmethod
    def validate_salary_type(cls, v):
        if v is not None and v not in ['hourly', 'fixed']:
            raise ValueError('salary_type phải là hourly hoặc fixed')
        return v


class UserResponse(UserBase):
    id: int
    pin: Optional[str] = None
    is_active: bool
    role_id: int
    role: RoleResponse
    salary_type: str
    fixed_salary: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserMe(UserResponse):
    pass
