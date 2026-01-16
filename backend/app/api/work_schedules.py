from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.db.session import get_db
from app.dependencies.permissions import get_current_user
from app.models import User, WorkSchedule, Attendance
from app.schemas.attendance import (
    WorkScheduleCreate,
    WorkScheduleUpdate,
    WorkScheduleResponse,
    WorkScheduleWithUser
)
from datetime import date, timedelta
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/work-schedules", tags=["Work Schedules"])


class CopyScheduleRequest(BaseModel):
    user_id: int
    from_date: date
    to_dates: List[date]


class CopyWeekScheduleRequest(BaseModel):
    from_week_start: date  # Monday of source week
    to_week_start: date    # Monday of target week


@router.post("", response_model=WorkScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_work_schedule(
    schedule: WorkScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create work schedules"
        )

    user = db.query(User).filter(User.id == schedule.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {schedule.user_id} not found"
        )

    existing = db.query(WorkSchedule).filter(
        and_(
            WorkSchedule.user_id == schedule.user_id,
            WorkSchedule.work_date == schedule.work_date,
            WorkSchedule.is_active == True
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Active work schedule already exists for user {user.full_name} on {schedule.work_date}"
        )

    db_schedule = WorkSchedule(**schedule.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)

    return WorkScheduleResponse.model_validate(db_schedule)


@router.get("", response_model=List[WorkScheduleWithUser])
def get_work_schedules(
    user_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_privileged = current_user.is_admin or (
        current_user.role and (current_user.role.name in ["Thu ngân", "accountant"] or current_user.role_id == 5)
    )

    if not is_privileged:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and accountants can view all work schedules"
        )

    query = db.query(WorkSchedule)

    if user_id:
        query = query.filter(WorkSchedule.user_id == user_id)
    if start_date:
        query = query.filter(WorkSchedule.work_date >= start_date)
    if end_date:
        query = query.filter(WorkSchedule.work_date <= end_date)
    if is_active is not None:
        query = query.filter(WorkSchedule.is_active == is_active)

    schedules = query.order_by(WorkSchedule.work_date.desc()).all()

    result = []
    for schedule in schedules:
        result.append(WorkScheduleWithUser(
            id=schedule.id,
            user_id=schedule.user_id,
            work_date=schedule.work_date,
            start_time=schedule.start_time,
            end_time=schedule.end_time,
            allowed_late_minutes=schedule.allowed_late_minutes,
            is_active=schedule.is_active,
            created_at=schedule.created_at,
            updated_at=schedule.updated_at,
            user={
                "id": schedule.user.id,
                "full_name": schedule.user.full_name,
                "username": schedule.user.username,
                "email": schedule.user.email,
                "role": schedule.user.role.name if schedule.user.role else None
            }
        ))

    return result


@router.get("/my", response_model=List[WorkScheduleResponse])
def get_my_work_schedules(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(WorkSchedule).filter(
        WorkSchedule.user_id == current_user.id,
        WorkSchedule.is_active == True
    )

    if start_date:
        query = query.filter(WorkSchedule.work_date >= start_date)
    if end_date:
        query = query.filter(WorkSchedule.work_date <= end_date)

    schedules = query.order_by(WorkSchedule.work_date.asc()).all()

    return [WorkScheduleResponse.model_validate(s) for s in schedules]


@router.get("/{schedule_id}", response_model=WorkScheduleWithUser)
def get_work_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(WorkSchedule).filter(WorkSchedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work schedule not found"
        )

    if not current_user.is_admin and schedule.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own schedules"
        )

    return WorkScheduleWithUser(
        id=schedule.id,
        user_id=schedule.user_id,
        work_date=schedule.work_date,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        allowed_late_minutes=schedule.allowed_late_minutes,
        is_active=schedule.is_active,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at,
        user={
            "id": schedule.user.id,
            "full_name": schedule.user.full_name,
            "username": schedule.user.username,
            "email": schedule.user.email,
            "role": schedule.user.role.name if schedule.user.role else None
        }
    )


@router.put("/{schedule_id}", response_model=WorkScheduleResponse)
def update_work_schedule(
    schedule_id: int,
    schedule_update: WorkScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update work schedules"
        )

    schedule = db.query(WorkSchedule).filter(WorkSchedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work schedule not found"
        )

    update_data = schedule_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)

    return WorkScheduleResponse.model_validate(schedule)


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete work schedules"
        )

    schedule = db.query(WorkSchedule).filter(WorkSchedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work schedule not found"
        )

    # Delete all attendances linked to this work schedule first (cascade delete)
    linked_attendances = db.query(Attendance).filter(
        Attendance.work_schedule_id == schedule_id
    ).all()

    for attendance in linked_attendances:
        db.delete(attendance)

    # Now delete the work schedule
    db.delete(schedule)
    db.commit()

    return None


@router.post("/copy-schedule", response_model=dict)
def copy_schedule(
    request: CopyScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Copy schedule of one employee from one date to multiple dates"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can copy schedules"
        )

    # Get source schedule
    source_schedule = db.query(WorkSchedule).filter(
        and_(
            WorkSchedule.user_id == request.user_id,
            WorkSchedule.work_date == request.from_date,
            WorkSchedule.is_active == True
        )
    ).first()

    if not source_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No schedule found for user {request.user_id} on {request.from_date}"
        )

    created_count = 0
    skipped_count = 0

    for target_date in request.to_dates:
        # Check if schedule already exists for target date
        existing = db.query(WorkSchedule).filter(
            and_(
                WorkSchedule.user_id == request.user_id,
                WorkSchedule.work_date == target_date,
                WorkSchedule.is_active == True
            )
        ).first()

        if existing:
            skipped_count += 1
            continue

        # Create new schedule
        new_schedule = WorkSchedule(
            user_id=request.user_id,
            work_date=target_date,
            start_time=source_schedule.start_time,
            end_time=source_schedule.end_time,
            allowed_late_minutes=source_schedule.allowed_late_minutes,
            is_active=True
        )
        db.add(new_schedule)
        created_count += 1

    db.commit()

    return {
        "status": "success",
        "created": created_count,
        "skipped": skipped_count,
        "message": f"Created {created_count} schedules, skipped {skipped_count} existing ones"
    }


@router.post("/copy-week-schedule", response_model=dict)
def copy_week_schedule(
    request: CopyWeekScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Copy entire week schedule from one week to another"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can copy schedules"
        )

    # Calculate week end dates
    from_week_end = request.from_week_start + timedelta(days=6)
    to_week_end = request.to_week_start + timedelta(days=6)

    # Get all schedules from source week
    source_schedules = db.query(WorkSchedule).filter(
        and_(
            WorkSchedule.work_date >= request.from_week_start,
            WorkSchedule.work_date <= from_week_end,
            WorkSchedule.is_active == True
        )
    ).all()

    if not source_schedules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No schedules found for week starting {request.from_week_start}"
        )

    created_count = 0
    skipped_count = 0

    for source_schedule in source_schedules:
        # Calculate offset from week start
        days_offset = (source_schedule.work_date - request.from_week_start).days
        target_date = request.to_week_start + timedelta(days=days_offset)

        # Check if schedule already exists for target date
        existing = db.query(WorkSchedule).filter(
            and_(
                WorkSchedule.user_id == source_schedule.user_id,
                WorkSchedule.work_date == target_date,
                WorkSchedule.is_active == True
            )
        ).first()

        if existing:
            skipped_count += 1
            continue

        # Create new schedule
        new_schedule = WorkSchedule(
            user_id=source_schedule.user_id,
            work_date=target_date,
            start_time=source_schedule.start_time,
            end_time=source_schedule.end_time,
            allowed_late_minutes=source_schedule.allowed_late_minutes,
            is_active=True
        )
        db.add(new_schedule)
        created_count += 1

    db.commit()

    return {
        "status": "success",
        "created": created_count,
        "skipped": skipped_count,
        "message": f"Copied week schedule: created {created_count}, skipped {skipped_count} existing ones"
    }
