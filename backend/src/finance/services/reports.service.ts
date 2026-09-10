import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ReceiptEntity,
  ReceiptTypeEntity,
  DailyReportManualEntity,
  MonthlyFinancialReportEntity,
} from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { AttendanceEntity, BonusEntity } from '../../hr/entities';
import { AttendanceStatus, SalaryType } from '../../common/enums';
import moment from 'moment';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReceiptEntity)
    private receiptRepo: Repository<ReceiptEntity>,
    @InjectRepository(ReceiptTypeEntity)
    private receiptTypeRepo: Repository<ReceiptTypeEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(AttendanceEntity)
    private attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(BonusEntity) private bonusRepo: Repository<BonusEntity>,
    @InjectRepository(DailyReportManualEntity)
    private dailyManualRepo: Repository<DailyReportManualEntity>,
    @InjectRepository(MonthlyFinancialReportEntity)
    private monthlyReportRepo: Repository<MonthlyFinancialReportEntity>,
  ) {}

  async getMonthlyExpenseReport(month: string) {
    // month format: YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month))
      throw new BadRequestException('Invalid month format. Use YYYY-MM');

    const startDate = moment(`${month}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
    const endDate = moment(startDate).add(1, 'months').format('YYYY-MM-DD');

    const categories: any[] = [];

    // 1. Employee Salary
    const attendances = await this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .where('a.date >= :startDate', { startDate })
      .andWhere('a.date < :endDate', { endDate })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [
          AttendanceStatus.PRESENT,
          AttendanceStatus.LATE,
          AttendanceStatus.EARLY_CHECKOUT,
        ],
      })
      .getMany();

    let totalHourlySalary = 0;
    for (const att of attendances) {
      if (att.user && att.user.salary_type === SalaryType.HOURLY) {
        if (att.check_in_time && att.check_out_time) {
          const hours = moment(att.check_out_time).diff(
            moment(att.check_in_time),
            'hours',
            true,
          );
          const rate = att.user.hourly_rate || 25000;
          totalHourlySalary += hours * rate;
        }
      }
    }

    const fixedUsers = await this.userRepo.find({
      where: [
        { is_active: true, salary_type: SalaryType.FIXED, user_type: 'staff' },
        { is_active: true, salary_type: SalaryType.FIXED, user_type: 'both' },
      ],
    });
    let totalFixedSalary = 0;
    for (const u of fixedUsers) {
      if (u.fixed_salary) totalFixedSalary += u.fixed_salary;
    }

    const bonusSum = await this.bonusRepo
      .createQueryBuilder('b')
      .select('SUM(b.amount)', 'total')
      .where('b.date >= :startDate', { startDate })
      .andWhere('b.date < :endDate', { endDate })
      .getRawOne();

    const totalBonuses = parseFloat(bonusSum?.total) || 0;

    const employeeSalaryCost =
      totalHourlySalary + totalFixedSalary + totalBonuses;

    categories.push({
      category_id: null,
      category_name: 'Chi phí lương nhân viên',
      total_amount: employeeSalaryCost,
      is_salary: true,
    });

    // 2. Receipt type expenses
    const expensesByType = await this.receiptRepo
      .createQueryBuilder('r')
      .select('rt.id', 'id')
      .addSelect('rt.name', 'name')
      .addSelect('SUM(r.amount)', 'total_amount')
      .innerJoin('r.receipt_type', 'rt')
      .where('r.receipt_date >= :startDate', { startDate })
      .andWhere('r.receipt_date < :endDate', { endDate })
      .andWhere('r.is_income = false')
      .groupBy('rt.id, rt.name')
      .getRawMany();

    for (const exp of expensesByType) {
      categories.push({
        category_id: exp.id,
        category_name: exp.name,
        total_amount: parseFloat(exp.total_amount) || 0,
        is_salary: false,
      });
    }

    const totalExpenses = categories.reduce(
      (sum, cat) => sum + cat.total_amount,
      0,
    );

    return {
      month,
      categories,
      total_expenses: totalExpenses,
    };
  }

  async getDailyManualReports(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return this.dailyManualRepo.find({
        where: {
          report_date: Between(startDate, endDate),
        },
        order: { report_date: 'ASC' },
      });
    }
    return this.dailyManualRepo.find({ order: { report_date: 'ASC' } });
  }

  async upsertDailyManualReport(dto: {
    report_date: string;
    cash_income?: number;
    cash_expense?: number;
    bank_exchange?: number;
    bank_income?: number;
    bank_expense?: number;
    system_revenue?: number;
    note?: string;
  }) {
    if (!dto.report_date) {
      throw new BadRequestException('report_date is required (YYYY-MM-DD)');
    }

    let existing = await this.dailyManualRepo.findOne({
      where: { report_date: dto.report_date },
    });

    if (!existing) {
      existing = this.dailyManualRepo.create({
        report_date: dto.report_date,
        cash_income: dto.cash_income || 0,
        cash_expense: dto.cash_expense || 0,
        bank_exchange: dto.bank_exchange || 0,
        bank_income: dto.bank_income || 0,
        bank_expense: dto.bank_expense || 0,
        system_revenue: dto.system_revenue || 0,
        note: dto.note || '',
      });
    } else {
      if (dto.cash_income !== undefined) existing.cash_income = dto.cash_income;
      if (dto.cash_expense !== undefined)
        existing.cash_expense = dto.cash_expense;
      if (dto.bank_exchange !== undefined)
        existing.bank_exchange = dto.bank_exchange;
      if (dto.bank_income !== undefined) existing.bank_income = dto.bank_income;
      if (dto.bank_expense !== undefined)
        existing.bank_expense = dto.bank_expense;
      if (dto.system_revenue !== undefined)
        existing.system_revenue = dto.system_revenue;
      if (dto.note !== undefined) existing.note = dto.note;
    }

    return this.dailyManualRepo.save(existing);
  }

  async getMonthlyFinancialReport(month: string) {
    if (!month) {
      throw new BadRequestException('month is required (YYYY-MM)');
    }
    const report = await this.monthlyReportRepo.findOne({
      where: { month },
    });
    return (
      report || {
        month,
        salary: 0,
        fixed_cost: 24500000,
        premises: 75000000,
        yard: 0,
        cloth: 0,
        prev_month_cash_balance: 0,
      }
    );
  }

  async upsertMonthlyFinancialReport(dto: {
    month: string;
    salary?: number;
    fixed_cost?: number;
    premises?: number;
    yard?: number;
    cloth?: number;
    prev_month_cash_balance?: number;
  }) {
    if (!dto.month) {
      throw new BadRequestException('month is required (YYYY-MM)');
    }

    let existing = await this.monthlyReportRepo.findOne({
      where: { month: dto.month },
    });

    if (!existing) {
      existing = this.monthlyReportRepo.create({
        month: dto.month,
        salary: dto.salary || 0,
        fixed_cost: dto.fixed_cost || 0,
        premises: dto.premises || 0,
        yard: dto.yard || 0,
        cloth: dto.cloth || 0,
        prev_month_cash_balance: dto.prev_month_cash_balance || 0,
      });
    } else {
      if (dto.salary !== undefined) existing.salary = dto.salary;
      if (dto.fixed_cost !== undefined) existing.fixed_cost = dto.fixed_cost;
      if (dto.premises !== undefined) existing.premises = dto.premises;
      if (dto.yard !== undefined) existing.yard = dto.yard;
      if (dto.cloth !== undefined) existing.cloth = dto.cloth;
      if (dto.prev_month_cash_balance !== undefined)
        existing.prev_month_cash_balance = dto.prev_month_cash_balance;
    }

    return this.monthlyReportRepo.save(existing);
  }
}
