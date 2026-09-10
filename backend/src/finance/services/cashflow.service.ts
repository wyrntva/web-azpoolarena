import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RevenueEntity,
  ExchangeEntity,
  SafeEntity,
  DebtEntity,
} from '../entities';
import {
  CreateRevenueDto,
  UpdateRevenueDto,
  CreateExchangeDto,
  UpdateExchangeDto,
  CreateSafeDto,
  UpdateSafeDto,
  CreateDebtDto,
  UpdateDebtDto,
} from '../dto/finance.dto';
import moment from 'moment';

@Injectable()
export class CashflowService {
  constructor(
    @InjectRepository(RevenueEntity) private revRepo: Repository<RevenueEntity>,
    @InjectRepository(ExchangeEntity)
    private excRepo: Repository<ExchangeEntity>,
    @InjectRepository(SafeEntity) private safeRepo: Repository<SafeEntity>,
    @InjectRepository(DebtEntity) private debtRepo: Repository<DebtEntity>,
  ) {}

  // ================= Revenues =================
  async findRevenues(startDate?: string, endDate?: string, limit?: number, skip?: number) {
    const qb = this.revRepo.createQueryBuilder('r').orderBy('r.revenue_date', 'DESC');
    if (startDate) qb.andWhere('r.revenue_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('r.revenue_date <= :endDate', { endDate });
    if (skip) qb.skip(skip);
    if (limit) qb.take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { data: items, total };
  }

  async findRevenueByDate(date: string) {
    const d = moment(date).format('YYYY-MM-DD');
    return this.revRepo.findOne({
      where: { revenue_date: d },
      relations: ['created_by_user'],
    });
  }

  async getRevenuesByMonth(month: string) {
    const start = moment(`${month}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
    const end = moment(start).add(1, 'months').format('YYYY-MM-DD');
    return this.revRepo
      .createQueryBuilder('r')
      .where('r.revenue_date >= :start', { start })
      .andWhere('r.revenue_date < :end', { end })
      .orderBy('r.revenue_date', 'ASC')
      .getMany();
  }

  async createRevenue(dto: CreateRevenueDto, userId: number) {
    const d = moment(dto.revenue_date).format('YYYY-MM-DD');
    let rev = await this.revRepo.findOne({ where: { revenue_date: d } });
    if (!rev) {
      rev = this.revRepo.create({
        ...dto,
        revenue_date: d,
        created_by: userId,
      });
    } else {
      Object.assign(rev, dto);
    }
    return this.revRepo.save(rev);
  }

  async updateRevenue(id: number, dto: UpdateRevenueDto) {
    const rev = await this.revRepo.findOne({ where: { id } });
    if (!rev) throw new NotFoundException('Revenue not found');
    Object.assign(rev, dto);
    return this.revRepo.save(rev);
  }

  async deleteRevenue(id: number) {
    const rev = await this.revRepo.findOne({ where: { id } });
    if (!rev) throw new NotFoundException('Revenue not found');
    await this.revRepo.remove(rev);
    return null;
  }

  // ================= Exchanges =================
  async createExchange(dto: CreateExchangeDto, userId: number) {
    const exc = this.excRepo.create({ ...dto, created_by: userId });
    return this.excRepo.save(exc);
  }

  async findExchanges(startDate?: string, endDate?: string) {
    const qb = this.excRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.created_by_user', 'creator')
      .orderBy('e.exchange_date', 'DESC');
    if (startDate) qb.andWhere('e.exchange_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('e.exchange_date <= :endDate', { endDate });
    return qb.getMany();
  }

  async deleteExchange(id: number) {
    const exc = await this.excRepo.findOne({ where: { id } });
    if (exc) await this.excRepo.remove(exc);
    return null;
  }

  // ================= Safes =================
  async createSafe(dto: CreateSafeDto, userId: number) {
    const safe = this.safeRepo.create({ ...dto, created_by: userId });
    return this.safeRepo.save(safe);
  }

  async findSafes(startDate?: string, endDate?: string, month?: number, year?: number) {
    const qb = this.safeRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.created_by_user', 'creator')
      .orderBy('s.safe_date', 'DESC');
    if (startDate) qb.andWhere('s.safe_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('s.safe_date <= :endDate', { endDate });
    if (year && month) {
      const monthStr = month.toString().padStart(2, '0');
      const startOfMonth = `${year}-${monthStr}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthStr = nextMonth.toString().padStart(2, '0');
      const startOfNextMonth = `${nextYear}-${nextMonthStr}-01`;
      qb.andWhere('s.safe_date >= :startOfMonth AND s.safe_date < :startOfNextMonth', {
        startOfMonth,
        startOfNextMonth,
      });
    }
    return qb.getMany();
  }

  async getSafeBalance(month?: number, year?: number) {
    const qb = this.safeRepo.createQueryBuilder('s');
    if (year && month) {
      const monthStr = month.toString().padStart(2, '0');
      const startOfMonth = `${year}-${monthStr}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthStr = nextMonth.toString().padStart(2, '0');
      const startOfNextMonth = `${nextYear}-${nextMonthStr}-01`;
      qb.andWhere('s.safe_date >= :startOfMonth AND s.safe_date < :startOfNextMonth', {
        startOfMonth,
        startOfNextMonth,
      });
    }

    const latestSafe = await qb.orderBy('s.safe_date', 'DESC').addOrderBy('s.id', 'DESC').getOne();

    const sumQb = this.safeRepo.createQueryBuilder('s');
    if (year && month) {
      const monthStr = month.toString().padStart(2, '0');
      const startOfMonth = `${year}-${monthStr}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthStr = nextMonth.toString().padStart(2, '0');
      const startOfNextMonth = `${nextYear}-${nextMonthStr}-01`;
      sumQb.andWhere('s.safe_date >= :startOfMonth AND s.safe_date < :startOfNextMonth', {
        startOfMonth,
        startOfNextMonth,
      });
    }

    const totalAmount = await sumQb.select('SUM(s.amount)', 'total').getRawOne();
    const balance = latestSafe ? latestSafe.amount : (parseFloat(totalAmount?.total) || 0);

    return {
      balance: balance || 0,
      bank_balance: 0,
    };
  }

  async deleteSafe(id: number) {
    const safe = await this.safeRepo.findOne({ where: { id } });
    if (safe) await this.safeRepo.remove(safe);
    return null;
  }

  // ================= Debts =================
  async createDebt(dto: CreateDebtDto, userId: number) {
    const debt = this.debtRepo.create({ ...dto, created_by: userId });
    return this.debtRepo.save(debt);
  }

  async findDebts(isPaid?: boolean, startDate?: string, endDate?: string) {
    const qb = this.debtRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.created_by_user', 'creator')
      .orderBy('d.debt_date', 'DESC')
      .addOrderBy('d.created_at', 'DESC');
    if (isPaid !== undefined) qb.andWhere('d.is_paid = :isPaid', { isPaid });
    if (startDate) qb.andWhere('d.debt_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('d.debt_date <= :endDate', { endDate });
    return qb.getMany();
  }

  async updateDebt(id: number, dto: UpdateDebtDto) {
    const debt = await this.debtRepo.findOne({ where: { id } });
    if (!debt) throw new NotFoundException('Debt not found');
    Object.assign(debt, dto);
    return this.debtRepo.save(debt);
  }

  async deleteDebt(id: number) {
    const debt = await this.debtRepo.findOne({ where: { id } });
    if (debt) await this.debtRepo.remove(debt);
    return null;
  }
}
