import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiptEntity, ReceiptTypeEntity } from '../entities';
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
}
