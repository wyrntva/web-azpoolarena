from datetime import datetime
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, Text
from app.db.base import Base


class AttendanceSettings(Base):
    """
    Global attendance settings for late penalties and rules.
    Only one active record should exist at a time.
    """
    __tablename__ = "attendance_settings"

    id = Column(Integer, primary_key=True, index=True)

    # Late arrival settings
    allowed_late_minutes = Column(Integer, default=15, nullable=False)  # Số phút được phép đi muộn

    # Penalty tiers (mức phạt theo độ muộn)
    # Tier 1: Muộn <= tier1_max_minutes
    tier1_max_minutes = Column(Integer, default=15, nullable=False)  # VD: Muộn <= 15 phút
    tier1_penalty = Column(Float, default=0, nullable=False)  # Phạt 0 đồng (trong allowed)

    # Tier 2: tier1_max < Muộn <= tier2_max_minutes
    tier2_max_minutes = Column(Integer, default=30, nullable=False)  # VD: 15 < Muộn <= 30 phút
    tier2_penalty = Column(Float, default=50000, nullable=False)  # Phạt 50k

    # Tier 3: tier2_max < Muộn <= tier3_max_minutes
    tier3_max_minutes = Column(Integer, default=60, nullable=False)  # VD: 30 < Muộn <= 60 phút
    tier3_penalty = Column(Float, default=100000, nullable=False)  # Phạt 100k

    # Tier 4: Muộn > tier3_max_minutes
    tier4_penalty = Column(Float, default=200000, nullable=False)  # Phạt 200k (muộn quá 60 phút)

    # Early checkout penalty
    early_checkout_grace_minutes = Column(Integer, default=10, nullable=False)  # Được về sớm 10 phút
    early_checkout_penalty = Column(Float, default=50000, nullable=False)  # Phạt về sớm

    # Other settings
    auto_absent_enabled = Column(Boolean, default=True, nullable=False)  # Tự động đánh vắng nếu không check-in
    notes = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
