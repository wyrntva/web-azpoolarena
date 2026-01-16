from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Date, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))
    permissions = Column(Text, nullable=True)  # JSON string of permissions array
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)  # Prevent deletion of system roles
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="role")


class AccountType(str, enum.Enum):
    CASH = "cash"
    BANK = "bank"


class SalaryType(str, enum.Enum):
    HOURLY = "hourly"  # Lương theo giờ
    FIXED = "fixed"    # Lương cứng


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    pin = Column(String(4), nullable=True, index=True)  # 4-digit PIN for attendance
    is_active = Column(Boolean, default=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    salary_type = Column(Enum(SalaryType, native_enum=True, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=SalaryType.HOURLY)
    fixed_salary = Column(Float, nullable=True)  # Lương cứng tháng (VD: 5000000)
    display_order = Column(Integer, nullable=True)  # Thứ tự hiển thị trong lịch làm việc
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    receipts = relationship("Receipt", back_populates="created_by_user")
    revenues = relationship("Revenue", back_populates="created_by_user")
    exchanges = relationship("Exchange", back_populates="created_by_user")
    safes = relationship("Safe", back_populates="created_by_user")
    debts = relationship("Debt", back_populates="created_by_user")
    inventories = relationship("Inventory", back_populates="created_by_user")
    inventory_transactions = relationship("InventoryTransaction", back_populates="created_by_user")

    @property
    def is_admin(self) -> bool:
        """Returns True if the user has an administrative role"""
        return self.role.name in ["admin", "Quản lý"] if self.role else False


class ReceiptType(Base):
    __tablename__ = "receipt_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255))
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_inventory = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    receipts = relationship("Receipt", back_populates="receipt_type")
    category = relationship("Category", back_populates="receipt_types")


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    receipt_type_id = Column(Integer, ForeignKey("receipt_types.id"), nullable=False)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_income = Column(Boolean, default=False)
    payment_method = Column(Enum(AccountType), nullable=False, default=AccountType.CASH)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    receipt_type = relationship("ReceiptType", back_populates="receipts")
    created_by_user = relationship("User", back_populates="receipts")


class Revenue(Base):
    __tablename__ = "revenues"

    id = Column(Integer, primary_key=True, index=True)
    revenue_date = Column(Date, nullable=False, unique=True, index=True)
    cash_revenue = Column(Float, default=0.0, nullable=False)
    bank_revenue = Column(Float, default=0.0, nullable=False)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_user = relationship("User", back_populates="revenues")


class Exchange(Base):
    __tablename__ = "exchanges"

    id = Column(Integer, primary_key=True, index=True)
    exchange_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    from_account = Column(Enum(AccountType), nullable=False)
    to_account = Column(Enum(AccountType), nullable=False)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_user = relationship("User", back_populates="exchanges")


class Safe(Base):
    __tablename__ = "safes"

    id = Column(Integer, primary_key=True, index=True)
    safe_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_user = relationship("User", back_populates="safes")


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    debt_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    debtor_name = Column(String(100), nullable=False)
    note = Column(Text)
    is_paid = Column(Boolean, default=False)
    paid_date = Column(Date, nullable=True)
    payment_method = Column(Enum(AccountType), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_user = relationship("User", back_populates="debts")


class InventoryStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    LOW_STOCK = "low_stock"


class TransactionType(str, enum.Enum):
    IN = "in"
    OUT = "out"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inventories = relationship("Inventory", back_populates="category")
    receipt_types = relationship("ReceiptType", back_populates="category")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inventories_base = relationship("Inventory", back_populates="base_unit_ref", foreign_keys="Inventory.base_unit_id")
    inventories_conversion = relationship("Inventory", back_populates="conversion_unit_ref", foreign_keys="Inventory.conversion_unit_id")


class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    min_quantity = Column(Integer, nullable=False, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    base_unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    conversion_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    conversion_rate = Column(Integer, nullable=True)
    status = Column(Enum(InventoryStatus, native_enum=True, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=InventoryStatus.IN_STOCK)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_user = relationship("User", back_populates="inventories")
    category = relationship("Category", back_populates="inventories")
    base_unit_ref = relationship("Unit", back_populates="inventories_base", foreign_keys=[base_unit_id])
    conversion_unit_ref = relationship("Unit", back_populates="inventories_conversion", foreign_keys=[conversion_unit_id])


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(Enum(TransactionType, native_enum=True, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", back_populates="inventory_transactions")
    details = relationship("InventoryTransactionDetail", back_populates="transaction")


class InventoryTransactionDetail(Base):
    __tablename__ = "inventory_transaction_details"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("inventory_transactions.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_type = Column(String(20), nullable=False, default="base")
    price = Column(Float, nullable=True)  # Giá tiền cho sản phẩm này
    payment_method = Column(Enum(AccountType), nullable=True)  # Hình thức thanh toán
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("InventoryTransaction", back_populates="details")
    inventory = relationship("Inventory")


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"
    EARLY_CHECKOUT = "early_checkout"


class QRTokenType(str, enum.Enum):
    CHECK_IN = "check_in"
    CHECK_OUT = "check_out"
    ATTENDANCE = "attendance"  # Auto-detect check-in or check-out


class WiFiConfig(Base):
    __tablename__ = "wifi_configs"

    id = Column(Integer, primary_key=True, index=True)
    ssid = Column(String(100), nullable=False, index=True)
    bssid = Column(String(17), nullable=True)
    ip_range = Column(String(50), nullable=True)
    ip_subnet = Column(String(32), nullable=True, index=True)  # Dải IP/subnet cho whitelist (VD: "192.168.10.0/24")
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class QRSession(Base):
    __tablename__ = "qr_sessions"

    id = Column(Integer, primary_key=True, index=True)
    qr_token = Column(String(255), unique=True, nullable=False, index=True)
    token_type = Column(Enum(QRTokenType, native_enum=True, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    used_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    used_by_user = relationship("User")


class WorkSchedule(Base):
    __tablename__ = "work_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_date = Column(Date, nullable=False, index=True)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    allowed_late_minutes = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    attendances = relationship("Attendance", back_populates="work_schedule")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_schedule_id = Column(Integer, ForeignKey("work_schedules.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    check_in_qr_token = Column(String(255), nullable=True)
    check_out_qr_token = Column(String(255), nullable=True)
    wifi_ssid = Column(String(100), nullable=True)
    wifi_bssid = Column(String(17), nullable=True)
    ip_address = Column(String(50), nullable=True)
    status = Column(Enum(AttendanceStatus, native_enum=True, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=AttendanceStatus.ABSENT)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    work_schedule = relationship("WorkSchedule", back_populates="attendances")


class QRAccessDevice(Base):
    __tablename__ = "qr_access_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, nullable=False, index=True)
    device_name = Column(String(200), nullable=False)
    api_key_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tokens = relationship("QRAccessToken", back_populates="device")


class QRAccessToken(Base):
    __tablename__ = "qr_access_tokens"

    id = Column(Integer, primary_key=True, index=True)
    access_token = Column(String(255), unique=True, nullable=False, index=True)
    device_id = Column(String(100), ForeignKey("qr_access_devices.device_id"), nullable=False)
    purpose = Column(String(50), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    is_used = Column(Boolean, default=False, index=True)
    used_at = Column(DateTime, nullable=True)
    used_by_pin = Column(String(4), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    device = relationship("QRAccessDevice", back_populates="tokens")


class AdvancePayment(Base):
    __tablename__ = "advance_payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    created_by_user = relationship("User", foreign_keys=[created_by])


class Bonus(Base):
    __tablename__ = "bonuses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    created_by_user = relationship("User", foreign_keys=[created_by])


class Penalty(Base):
    __tablename__ = "penalties"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    created_by_user = relationship("User", foreign_keys=[created_by])


class AttendanceSettings(Base):
    """
    Global attendance settings for late penalties and rules.
    Only one active record should exist at a time.

    penalty_tiers format (JSON): [
        {"max_minutes": 15, "penalty_amount": 0},
        {"max_minutes": 30, "penalty_amount": 50000},
        {"max_minutes": 60, "penalty_amount": 100000},
        {"max_minutes": null, "penalty_amount": 200000}  # null = không giới hạn (> mức cuối)
    ]
    """
    __tablename__ = "attendance_settings"

    id = Column(Integer, primary_key=True, index=True)

    # Late arrival settings
    allowed_late_minutes = Column(Integer, default=15, nullable=False)  # Số phút được phép đi muộn

    # Penalty tiers - stored as JSON array for flexible number of tiers
    penalty_tiers = Column(Text, nullable=False)  # JSON string: [{"max_minutes": int, "penalty_amount": float}, ...]

    # Early checkout penalty
    early_checkout_grace_minutes = Column(Integer, default=10, nullable=False)  # Được về sớm 10 phút
    early_checkout_penalty = Column(Float, default=50000, nullable=False)  # Phạt về sớm

    # Absent penalty (có lịch nhưng không chấm công)
    absent_penalty = Column(Float, default=100000, nullable=False)  # Phạt vắng mặt

    # Other settings
    auto_absent_enabled = Column(Boolean, default=True, nullable=False)  # Tự động đánh vắng nếu không check-in
    notes = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


