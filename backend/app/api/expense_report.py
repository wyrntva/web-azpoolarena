from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.db.session import get_db
from app.dependencies.permissions import get_current_user
from app.models import User, Receipt, ReceiptType, Bonus, Attendance, WorkSchedule, AttendanceStatus
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/expense-report", tags=["Expense Report"])


class ExpenseCategoryItem(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    total_amount: float
    is_salary: bool = False


class ExpenseReportResponse(BaseModel):
    month: str
    categories: List[ExpenseCategoryItem]
    total_expenses: float


@router.get("/monthly", response_model=ExpenseReportResponse)
def get_monthly_expense_report(
    month: str,  # Format: YYYY-MM
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get expense report summarized by finance types (receipt_types) for a specific month.

    Special handling:
    - Employee salary costs = Sum of all attendance-based salaries + Bonuses
    - Other expenses are grouped by their receipt_type
    """
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

    categories = []

    # 1. Calculate employee salary costs (Salary from attendance + Bonuses)

    # 1a. Calculate HOURLY salary from attendance
    attendances = db.query(Attendance).join(WorkSchedule).join(User).filter(
        and_(
            Attendance.date >= start_date,
            Attendance.date < end_date,
            Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.EARLY_CHECKOUT])
        )
    ).all()

    total_hourly_salary = 0.0
    for attendance in attendances:
        user = attendance.user
        salary_type_str = user.salary_type.value if hasattr(user.salary_type, 'value') else user.salary_type

        # Only calculate hourly employees from attendance
        if salary_type_str == "hourly":
            # Calculate work hours
            if attendance.check_in_time and attendance.check_out_time:
                work_hours = (attendance.check_out_time - attendance.check_in_time).total_seconds() / 3600
                # Assume 25,000 VND per hour as default (can be customized)
                hourly_rate = 25000
                total_hourly_salary += work_hours * hourly_rate

    # 1b. Calculate FIXED salary for all active employees with fixed salary
    fixed_salary_users = db.query(User).join(User.role).filter(
        User.is_active == True,
        User.fixed_salary.isnot(None)
    ).all()

    total_fixed_salary = 0.0
    for user in fixed_salary_users:
        salary_type_str = user.salary_type.value if hasattr(user.salary_type, 'value') else user.salary_type
        if salary_type_str == "fixed" and user.fixed_salary:
            # Full monthly salary for fixed employees
            total_fixed_salary += user.fixed_salary

    # 1c. Get total bonuses for the month
    total_bonuses = db.query(func.sum(Bonus.amount)).filter(
        and_(
            Bonus.date >= start_date,
            Bonus.date < end_date
        )
    ).scalar() or 0.0

    # Employee salary = Hourly Salary + Fixed Salary + Bonuses
    employee_salary_cost = total_hourly_salary + total_fixed_salary + total_bonuses

    categories.append(ExpenseCategoryItem(
        category_id=None,
        category_name="Chi phí lương nhân viên",
        total_amount=employee_salary_cost,
        is_salary=True
    ))

    # 2. Get all other expenses grouped by receipt_type (finance-types)
    # Only get expense receipts (is_income = False)
    expense_by_type = db.query(
        ReceiptType.id,
        ReceiptType.name,
        func.sum(Receipt.amount).label("total_amount")
    ).join(Receipt).filter(
        and_(
            Receipt.receipt_date >= start_date,
            Receipt.receipt_date < end_date,
            Receipt.is_income == False
        )
    ).group_by(ReceiptType.id, ReceiptType.name).all()

    for expense_type in expense_by_type:
        categories.append(ExpenseCategoryItem(
            category_id=expense_type.id,
            category_name=expense_type.name,
            total_amount=expense_type.total_amount,
            is_salary=False
        ))

    # 3. Calculate total expenses
    total_expenses = employee_salary_cost + sum(cat.total_amount for cat in categories if not cat.is_salary)

    return ExpenseReportResponse(
        month=month,
        categories=categories,
        total_expenses=total_expenses
    )
