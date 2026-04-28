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

  async upsertRevenue(
    dto: CreateRevenueDto | UpdateRevenueDto,
    date: string,
    userId: number,
  ) {
    const d = moment(date).format('YYYY-MM-DD');
    let rev = await this.revRepo.findOne({ where: { revenue_date: d } });
    if (!rev) {
      rev = this.revRepo.create({
        revenue_date: d,
        created_by: userId,
        ...dto,
      });
    } else {
      Object.assign(rev, dto);
    }
    return this.revRepo.save(rev);
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

  async findSafes(startDate?: string, endDate?: string) {
    const qb = this.safeRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.created_by_user', 'creator')
      .orderBy('s.safe_date', 'DESC');
    if (startDate) qb.andWhere('s.safe_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('s.safe_date <= :endDate', { endDate });
    return qb.getMany();
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

  async findDebts(isPaid?: boolean) {
    const qb = this.debtRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.created_by_user', 'creator')
      .orderBy('d.created_at', 'DESC');
    if (isPaid !== undefined) qb.andWhere('d.is_paid = :isPaid', { isPaid });
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
