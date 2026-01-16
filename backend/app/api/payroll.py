from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.db.session import get_db
from app.dependencies.permissions import get_current_user
from app.models import User, AdvancePayment, Bonus, Penalty, Attendance, WorkSchedule, AttendanceStatus, AttendanceSettings
from app.schemas.payroll import (
    AdvancePaymentCreate,
    AdvancePaymentUpdate,
    AdvancePaymentResponse,
    BonusCreate,
    BonusUpdate,
    BonusResponse,
    PenaltyCreate,
    PenaltyUpdate,
    PenaltyResponse,
    PayrollSummary,
)
from datetime import datetime, date, timedelta, time as dt_time
from typing import List, Optional
import json

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])


# ==================== ADVANCE PAYMENT ENDPOINTS ====================

@router.get("/advances", response_model=List[AdvancePaymentResponse])
def get_advances(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all advance payments with filters"""
    query = db.query(AdvancePayment)

    if start_date:
        query = query.filter(AdvancePayment.date >= start_date)
    if end_date:
        query = query.filter(AdvancePayment.date <= end_date)
    if user_id:
        query = query.filter(AdvancePayment.user_id == user_id)
    if status_filter:
        query = query.filter(AdvancePayment.status == status_filter)

    advances = query.order_by(AdvancePayment.date.desc()).all()

    # Add employee and creator names
    result = []
    for adv in advances:
        adv_dict = {
            "id": adv.id,
            "user_id": adv.user_id,
            "date": adv.date,
            "amount": adv.amount,
            "reason": adv.reason,
            "status": adv.status.value if hasattr(adv.status, 'value') else adv.status,
            "notes": adv.notes,
            "created_by": adv.created_by,
            "created_at": adv.created_at,
            "updated_at": adv.updated_at,
            "employee_name": adv.user.full_name if adv.user else None,
            "created_by_name": adv.created_by_user.full_name if adv.created_by_user else None,
        }
        result.append(AdvancePaymentResponse(**adv_dict))

    return result


@router.post("/advances", response_model=AdvancePaymentResponse)
def create_advance(
    advance_data: AdvancePaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new advance payment"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create advance payments"
        )

    advance = AdvancePayment(
        **advance_data.dict(),
        created_by=current_user.id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(advance)
    db.commit()
    db.refresh(advance)

    return AdvancePaymentResponse(
        **{
            "id": advance.id,
            "user_id": advance.user_id,
            "date": advance.date,
            "amount": advance.amount,
            "reason": advance.reason,
            "status": advance.status.value if hasattr(advance.status, 'value') else advance.status,
            "notes": advance.notes,
            "created_by": advance.created_by,
            "created_at": advance.created_at,
            "updated_at": advance.updated_at,
            "employee_name": advance.user.full_name if advance.user else None,
            "created_by_name": advance.created_by_user.full_name if advance.created_by_user else None,
        }
    )


@router.put("/advances/{advance_id}", response_model=AdvancePaymentResponse)
def update_advance(
    advance_id: int,
    advance_data: AdvancePaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update advance payment"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can update advance payments"
        )

    advance = db.query(AdvancePayment).filter(AdvancePayment.id == advance_id).first()
    if not advance:
        raise HTTPException(status_code=404, detail="Advance payment not found")

    update_data = advance_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(advance, field, value)

    advance.updated_at = datetime.now()
    db.commit()
    db.refresh(advance)

    return AdvancePaymentResponse(
        **{
            "id": advance.id,
            "user_id": advance.user_id,
            "date": advance.date,
            "amount": advance.amount,
            "reason": advance.reason,
            "status": advance.status.value if hasattr(advance.status, 'value') else advance.status,
            "notes": advance.notes,
            "created_by": advance.created_by,
            "created_at": advance.created_at,
            "updated_at": advance.updated_at,
            "employee_name": advance.user.full_name if advance.user else None,
            "created_by_name": advance.created_by_user.full_name if advance.created_by_user else None,
        }
    )


@router.delete("/advances/{advance_id}")
def delete_advance(
    advance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete advance payment"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete advance payments"
        )

    advance = db.query(AdvancePayment).filter(AdvancePayment.id == advance_id).first()
    if not advance:
        raise HTTPException(status_code=404, detail="Advance payment not found")

    db.delete(advance)
    db.commit()

    return {"message": "Advance payment deleted successfully"}


# ==================== BONUS ENDPOINTS ====================

@router.get("/bonuses", response_model=List[BonusResponse])
def get_bonuses(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user_id: Optional[int] = None,
    bonus_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bonuses with filters"""
    query = db.query(Bonus)

    if start_date:
        query = query.filter(Bonus.date >= start_date)
    if end_date:
        query = query.filter(Bonus.date <= end_date)
    if user_id:
        query = query.filter(Bonus.user_id == user_id)
    if bonus_type:
        query = query.filter(Bonus.bonus_type == bonus_type)

    bonuses = query.order_by(Bonus.date.desc()).all()

    result = []
    for bonus in bonuses:
        bonus_dict = {
            "id": bonus.id,
            "user_id": bonus.user_id,
            "date": bonus.date,
            "amount": bonus.amount,
            "bonus_type": bonus.bonus_type.value if hasattr(bonus.bonus_type, 'value') else bonus.bonus_type,
            "reason": bonus.reason,
            "notes": bonus.notes,
            "created_by": bonus.created_by,
            "created_at": bonus.created_at,
            "updated_at": bonus.updated_at,
            "employee_name": bonus.user.full_name if bonus.user else None,
            "created_by_name": bonus.created_by_user.full_name if bonus.created_by_user else None,
        }
        result.append(BonusResponse(**bonus_dict))

    return result


@router.post("/bonuses", response_model=BonusResponse)
def create_bonus(
    bonus_data: BonusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new bonus"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create bonuses"
        )

    bonus = Bonus(
        **bonus_data.dict(),
        created_by=current_user.id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(bonus)
    db.commit()
    db.refresh(bonus)

    return BonusResponse(
        **{
            "id": bonus.id,
            "user_id": bonus.user_id,
            "date": bonus.date,
            "amount": bonus.amount,
            "bonus_type": bonus.bonus_type.value if hasattr(bonus.bonus_type, 'value') else bonus.bonus_type,
            "reason": bonus.reason,
            "notes": bonus.notes,
            "created_by": bonus.created_by,
            "created_at": bonus.created_at,
            "updated_at": bonus.updated_at,
            "employee_name": bonus.user.full_name if bonus.user else None,
            "created_by_name": bonus.created_by_user.full_name if bonus.created_by_user else None,
        }
    )


@router.put("/bonuses/{bonus_id}", response_model=BonusResponse)
def update_bonus(
    bonus_id: int,
    bonus_data: BonusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update bonus"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can update bonuses"
        )

    bonus = db.query(Bonus).filter(Bonus.id == bonus_id).first()
    if not bonus:
        raise HTTPException(status_code=404, detail="Bonus not found")

    update_data = bonus_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bonus, field, value)

    bonus.updated_at = datetime.now()
    db.commit()
    db.refresh(bonus)

    return BonusResponse(
        **{
            "id": bonus.id,
            "user_id": bonus.user_id,
            "date": bonus.date,
            "amount": bonus.amount,
            "bonus_type": bonus.bonus_type.value if hasattr(bonus.bonus_type, 'value') else bonus.bonus_type,
            "reason": bonus.reason,
            "notes": bonus.notes,
            "created_by": bonus.created_by,
            "created_at": bonus.created_at,
            "updated_at": bonus.updated_at,
            "employee_name": bonus.user.full_name if bonus.user else None,
            "created_by_name": bonus.created_by_user.full_name if bonus.created_by_user else None,
        }
    )


@router.delete("/bonuses/{bonus_id}")
def delete_bonus(
    bonus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete bonus"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete bonuses"
        )

    bonus = db.query(Bonus).filter(Bonus.id == bonus_id).first()
    if not bonus:
        raise HTTPException(status_code=404, detail="Bonus not found")

    db.delete(bonus)
    db.commit()

    return {"message": "Bonus deleted successfully"}


# ==================== PENALTY ENDPOINTS ====================

@router.get("/penalties", response_model=List[PenaltyResponse])
def get_penalties(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all penalties with filters"""
    query = db.query(Penalty)

    if start_date:
        query = query.filter(Penalty.date >= start_date)
    if end_date:
        query = query.filter(Penalty.date <= end_date)
    if user_id:
        query = query.filter(Penalty.user_id == user_id)

    penalties = query.order_by(Penalty.date.desc()).all()

    result = []
    for penalty in penalties:
        penalty_dict = {
            "id": penalty.id,
            "user_id": penalty.user_id,
            "date": penalty.date,
            "amount": penalty.amount,
            "notes": penalty.notes,
            "created_by": penalty.created_by,
            "created_at": penalty.created_at,
            "updated_at": penalty.updated_at,
            "employee_name": penalty.user.full_name if penalty.user else None,
            "created_by_name": penalty.created_by_user.full_name if penalty.created_by_user else None,
        }
        result.append(PenaltyResponse(**penalty_dict))

    return result


@router.post("/penalties", response_model=PenaltyResponse)
def create_penalty(
    penalty_data: PenaltyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new penalty"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create penalties"
        )

    penalty = Penalty(
        **penalty_data.dict(),
        created_by=current_user.id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(penalty)
    db.commit()
    db.refresh(penalty)

    return PenaltyResponse(
        **{
            "id": penalty.id,
            "user_id": penalty.user_id,
            "date": penalty.date,
            "amount": penalty.amount,
            "notes": penalty.notes,
            "created_by": penalty.created_by,
            "created_at": penalty.created_at,
            "updated_at": penalty.updated_at,
            "employee_name": penalty.user.full_name if penalty.user else None,
            "created_by_name": penalty.created_by_user.full_name if penalty.created_by_user else None,
        }
    )


@router.put("/penalties/{penalty_id}", response_model=PenaltyResponse)
def update_penalty(
    penalty_id: int,
    penalty_data: PenaltyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update penalty"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can update penalties"
        )

    penalty = db.query(Penalty).filter(Penalty.id == penalty_id).first()
    if not penalty:
        raise HTTPException(status_code=404, detail="Penalty not found")

    update_data = penalty_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(penalty, field, value)

    penalty.updated_at = datetime.now()
    db.commit()
    db.refresh(penalty)

    return PenaltyResponse(
        **{
            "id": penalty.id,
            "user_id": penalty.user_id,
            "date": penalty.date,
            "amount": penalty.amount,
            "notes": penalty.notes,
            "created_by": penalty.created_by,
            "created_at": penalty.created_at,
            "updated_at": penalty.updated_at,
            "employee_name": penalty.user.full_name if penalty.user else None,
            "created_by_name": penalty.created_by_user.full_name if penalty.created_by_user else None,
        }
    )


@router.delete("/penalties/{penalty_id}")
def delete_penalty(
    penalty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete penalty"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete penalties"
        )

    penalty = db.query(Penalty).filter(Penalty.id == penalty_id).first()
    if not penalty:
        raise HTTPException(status_code=404, detail="Penalty not found")

    db.delete(penalty)
    db.commit()

    return {"message": "Penalty deleted successfully"}


# ==================== SUMMARY ENDPOINT ====================

@router.get("/summary", response_model=List[PayrollSummary])
def get_payroll_summary(
    month: str,  # Format: YYYY-MM
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll summary for all employees in a month"""
    try:
        year, month_num = month.split("-")
        start_date = date(int(year), int(month_num), 1)
        # Last day of month
        if int(month_num) == 12:
            end_date = date(int(year) + 1, 1, 1)
        else:
            end_date = date(int(year), int(month_num) + 1, 1)
    except:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    # Get all active staff users (everything except admin)
    users = db.query(User).join(User.role).filter(User.role.has(name="Nhân viên") | User.role.has(name="Thu ngân"), User.is_active == True).all()

    summaries = []
    for user_obj in users:
        # Sum advances
        total_advances = db.query(func.sum(AdvancePayment.amount)).filter(
            and_(
                AdvancePayment.user_id == user_obj.id,
                AdvancePayment.date >= start_date,
                AdvancePayment.date < end_date
            )
        ).scalar() or 0.0

        # Sum bonuses
        total_bonuses = db.query(func.sum(Bonus.amount)).filter(
            and_(
                Bonus.user_id == user_obj.id,
                Bonus.date >= start_date,
                Bonus.date < end_date
            )
        ).scalar() or 0.0

        # Sum penalties
        total_penalties = db.query(func.sum(Penalty.amount)).filter(
            and_(
                Penalty.user_id == user_obj.id,
                Penalty.date >= start_date,
                Penalty.date < end_date
            )
        ).scalar() or 0.0

        summaries.append(PayrollSummary(
            user_id=user_obj.id,
            user_name=user_obj.full_name,
            month=month,
            total_advances=total_advances,
            total_bonuses=total_bonuses,
            total_penalties=total_penalties,
            net_adjustment=total_bonuses - total_advances - total_penalties
        ))

    return summaries


# ==================== AUTO PENALTY GENERATION ====================

@router.post("/auto-generate-penalties")
def auto_generate_penalties(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

    settings = db.query(AttendanceSettings).filter_by(is_active=True).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Attendance settings not found")

    penalty_tiers = json.loads(settings.penalty_tiers)

    schedules = db.query(WorkSchedule).filter(
        WorkSchedule.work_date.between(start_date, end_date),
        WorkSchedule.is_active == True,
        WorkSchedule.is_off == False
    ).all()

    attendances = db.query(Attendance).filter(
        Attendance.date.between(start_date, end_date)
    ).all()

    penalties = db.query(Penalty).filter(
        Penalty.date.between(start_date, end_date)
    ).all()

    attendance_map = {(a.user_id, a.date): a for a in attendances}
    penalty_map = {(p.user_id, p.date, p.penalty_type): p for p in penalties}

    created = []

    try:
        for sch in schedules:
            key = (sch.user_id, sch.work_date)
            attendance = attendance_map.get(key)

            penalty_type = None
            penalty_amount = 0
            reason = ""

            # ABSENT
            if not attendance or attendance.check_in_time is None:
                penalty_type = "ABSENT"
                penalty_amount = settings.absent_penalty
                reason = "Vắng mặt không phép"

            # LATE
            elif attendance.status == AttendanceStatus.LATE:
                check_in = attendance.check_in_time
                if isinstance(check_in, datetime):
                    check_in_dt = check_in
                else:
                    check_in_dt = datetime.combine(
                        attendance.date,
                        datetime.strptime(str(check_in)[:8], "%H:%M:%S").time()
                    )

                start_dt = datetime.combine(
                    sch.work_date,
                    datetime.strptime(sch.start_time, "%H:%M").time()
                )

                late_minutes = max(
                    0,
                    int((check_in_dt - start_dt).total_seconds() / 60)
                )

                for tier in penalty_tiers:
                    if tier["max_minutes"] is None or late_minutes <= tier["max_minutes"]:
                        penalty_amount = tier["penalty_amount"]
                        break

                if penalty_amount > 0:
                    penalty_type = "LATE"
                    reason = f"Đi muộn {late_minutes} phút"

            # EARLY CHECKOUT
            elif attendance.status == AttendanceStatus.EARLY_CHECKOUT:
                penalty_type = "EARLY_CHECKOUT"
                penalty_amount = settings.early_checkout_penalty
                reason = "Về sớm"

            if not penalty_type or penalty_amount <= 0:
                continue

            if (sch.user_id, sch.work_date, penalty_type) in penalty_map:
                continue

            new_penalty = Penalty(
                user_id=sch.user_id,
                date=sch.work_date,
                amount=penalty_amount,
                penalty_type=penalty_type,
                notes=f"{reason} (Tự động)",
                created_by=current_user.id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )

            db.add(new_penalty)
            created.append({
                "user_id": sch.user_id,
                "date": sch.work_date,
                "type": penalty_type,
                "amount": penalty_amount
            })

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "message": f"Created {len(created)} penalties",
        "data": created
    }
