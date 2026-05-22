import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between, In } from 'typeorm';
import {
  AdvancePaymentEntity,
  BonusEntity,
  PenaltyEntity,
  AttendanceEntity,
  WorkScheduleEntity,
  AttendanceSettingsEntity,
} from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import {
  CreateAdvancePaymentDto,
  UpdateAdvancePaymentDto,
  CreateBonusDto,
  UpdateBonusDto,
  CreatePenaltyDto,
  UpdatePenaltyDto,
} from '../dto/hr.dto';
import { AttendanceStatus } from '../../common/enums';
import moment from 'moment';

@Injectable()
export class PayrollService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AdvancePaymentEntity)
    private readonly advanceRepo: Repository<AdvancePaymentEntity>,
    @InjectRepository(BonusEntity)
    private readonly bonusRepo: Repository<BonusEntity>,
    @InjectRepository(PenaltyEntity)
    private readonly penaltyRepo: Repository<PenaltyEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(WorkScheduleEntity)
    private readonly scheduleRepo: Repository<WorkScheduleEntity>,
    @InjectRepository(AttendanceSettingsEntity)
    private readonly settingsRepo: Repository<AttendanceSettingsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  // ==================== Advances ====================
  async createAdvance(dto: CreateAdvancePaymentDto, currentUserId: number) {
    const advance = this.advanceRepo.create({
      ...dto,
      created_by: currentUserId,
    });
    return this.advanceRepo.save(advance);
  }

  async updateAdvance(id: number, dto: UpdateAdvancePaymentDto) {
    const advance = await this.advanceRepo.findOne({ where: { id } });
    if (!advance) throw new NotFoundException('Advance payment not found');
    Object.assign(advance, dto);
    return this.advanceRepo.save(advance);
  }

  async deleteAdvance(id: number) {
    const advance = await this.advanceRepo.findOne({ where: { id } });
    if (!advance) throw new NotFoundException('Advance payment not found');
    await this.advanceRepo.remove(advance);
    return null;
  }

  async findAllAdvances(userId?: number, startDate?: string, endDate?: string) {
    const qb = this.advanceRepo
      .createQueryBuilder('adv')
      .leftJoinAndSelect(UserEntity, 'user', 'user.id = adv.user_id')
      .leftJoinAndSelect(UserEntity, 'creator', 'creator.id = adv.created_by')
      .orderBy('adv.date', 'DESC');

    if (userId) qb.andWhere('adv.user_id = :userId', { userId });
    if (startDate) qb.andWhere('adv.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('adv.date <= :endDate', { endDate });

    const results = await qb.getRawAndEntities();
    return results.entities.map((ent: any) => {
      const v = results.raw.find((r) => r.adv_id === ent.id);
      return {
        ...ent,
        employee_name: v.user_full_name,
        created_by_name: v.creator_full_name,
      };
    });
  }

  // ==================== Bonuses ====================
  async createBonus(dto: CreateBonusDto, currentUserId: number) {
    const bonus = this.bonusRepo.create({
      ...dto,
      created_by: currentUserId,
    });
    return this.bonusRepo.save(bonus);
  }

  async updateBonus(id: number, dto: UpdateBonusDto) {
    const bonus = await this.bonusRepo.findOne({ where: { id } });
    if (!bonus) throw new NotFoundException('Bonus not found');
    Object.assign(bonus, dto);
    return this.bonusRepo.save(bonus);
  }

  async deleteBonus(id: number) {
    const bonus = await this.bonusRepo.findOne({ where: { id } });
    if (!bonus) throw new NotFoundException('Bonus not found');
    await this.bonusRepo.remove(bonus);
    return null;
  }

  async findAllBonuses(userId?: number, startDate?: string, endDate?: string) {
    const qb = this.bonusRepo
      .createQueryBuilder('bn')
      .leftJoinAndSelect(UserEntity, 'user', 'user.id = bn.user_id')
      .leftJoinAndSelect(UserEntity, 'creator', 'creator.id = bn.created_by')
      .orderBy('bn.date', 'DESC');

    if (userId) qb.andWhere('bn.user_id = :userId', { userId });
    if (startDate) qb.andWhere('bn.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('bn.date <= :endDate', { endDate });

    const results = await qb.getRawAndEntities();
    return results.entities.map((ent: any) => {
      const v = results.raw.find((r) => r.bn_id === ent.id);
      return {
        ...ent,
        employee_name: v.user_full_name,
        created_by_name: v.creator_full_name,
      };
    });
  }

  // ==================== Penalties ====================
  async createPenalty(dto: CreatePenaltyDto, currentUserId: number) {
    const penalty = this.penaltyRepo.create({
      ...dto,
      created_by: currentUserId,
    });
    return this.penaltyRepo.save(penalty);
  }

  async updatePenalty(id: number, dto: UpdatePenaltyDto) {
    const penalty = await this.penaltyRepo.findOne({ where: { id } });
    if (!penalty) throw new NotFoundException('Penalty not found');
    Object.assign(penalty, dto);
    return this.penaltyRepo.save(penalty);
  }

  async deletePenalty(id: number) {
    const penalty = await this.penaltyRepo.findOne({ where: { id } });
    if (!penalty) throw new NotFoundException('Penalty not found');
    await this.penaltyRepo.remove(penalty);
    return null;
  }

  async findAllPenalties(
    userId?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const qb = this.penaltyRepo
      .createQueryBuilder('pen')
      .leftJoinAndSelect(UserEntity, 'user', 'user.id = pen.user_id')
      .leftJoinAndSelect(UserEntity, 'creator', 'creator.id = pen.created_by')
      .orderBy('pen.date', 'DESC');

    if (userId) qb.andWhere('pen.user_id = :userId', { userId });
    if (startDate) qb.andWhere('pen.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('pen.date <= :endDate', { endDate });

    const results = await qb.getRawAndEntities();
    return results.entities.map((ent: any) => {
      const v = results.raw.find((r) => r.pen_id === ent.id);
      return {
        ...ent,
        employee_name: v.user_full_name,
        created_by_name: v.creator_full_name,
      };
    });
  }

  // ==================== Summary ====================
  async getSummary(month: string) {
    // month format: YYYY-MM
    let start, end;
    if (month.includes('-')) {
      start = moment(`${month}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
      end = moment(start).add(1, 'months').format('YYYY-MM-DD');
    } else {
      throw new BadRequestException('Invalid month format');
    }

    const users = await this.userRepo.find({ where: { is_active: true } });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return [];

    const attendances = await this.attendanceRepo
      .createQueryBuilder('att')
      .where('att.user_id IN (:...userIds)', { userIds })
      .andWhere('att.date >= :start', { start })
      .andWhere('att.date < :end', { end })
      .andWhere('att.check_in_time IS NOT NULL')
      .andWhere('att.check_out_time IS NOT NULL')
      .getMany();

    const advances = await this.advanceRepo
      .createQueryBuilder('adv')
      .select('adv.user_id', 'user_id')
      .addSelect('SUM(adv.amount)', 'total')
      .where('adv.user_id IN (:...userIds)', { userIds })
      .andWhere('adv.date >= :start', { start })
      .andWhere('adv.date < :end', { end })
      .groupBy('adv.user_id')
      .getRawMany();

    const bonuses = await this.bonusRepo
      .createQueryBuilder('bon')
      .select('bon.user_id', 'user_id')
      .addSelect('SUM(bon.amount)', 'total')
      .where('bon.user_id IN (:...userIds)', { userIds })
      .andWhere('bon.date >= :start', { start })
      .andWhere('bon.date < :end', { end })
      .groupBy('bon.user_id')
      .getRawMany();

    const penalties = await this.penaltyRepo
      .createQueryBuilder('pen')
      .select('pen.user_id', 'user_id')
      .addSelect('SUM(pen.amount)', 'total')
      .where('pen.user_id IN (:...userIds)', { userIds })
      .andWhere('pen.date >= :start', { start })
      .andWhere('pen.date < :end', { end })
      .groupBy('pen.user_id')
      .getRawMany();

    const hoursMap = {};
    for (const att of attendances) {
      const diffSecs = moment(att.check_out_time).diff(
        moment(att.check_in_time),
        'seconds',
      );
      hoursMap[att.user_id] = (hoursMap[att.user_id] || 0) + diffSecs;
    }

    const mapArray = (arr: any[]) =>
      arr.reduce(
        (acc, curr) => ({ ...acc, [curr.user_id]: parseFloat(curr.total) }),
        {},
      );
    const advMap = mapArray(advances);
    const bonMap = mapArray(bonuses);
    const penMap = mapArray(penalties);

    return users.map((u) => {
      const totalHours = Math.round((hoursMap[u.id] || 0) / 36) / 100;
      const totalAdv = advMap[u.id] || 0;
      const totalBon = bonMap[u.id] || 0;
      const totalPen = penMap[u.id] || 0;

      return {
        user_id: u.id,
        user_name: u.full_name,
        month,
        total_hours: totalHours,
        total_advances: totalAdv,
        total_bonuses: totalBon,
        total_penalties: totalPen,
        net_adjustment: totalBon - totalAdv - totalPen,
      };
    });
  }

  // ==================== Auto Generate Penalties ====================
  async autoGeneratePenalties(
    startDateStr: string,
    endDateStr: string,
    currentUserId: number,
  ) {
    let settings = await this.settingsRepo.findOne({
      where: { is_active: true },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        allowed_late_minutes: 5,
        penalty_tiers: JSON.stringify([
          { max_minutes: 15, penalty_amount: 30000 },
          { max_minutes: 30, penalty_amount: 50000 },
          { max_minutes: null, penalty_amount: 100000 },
        ]),
        early_checkout_grace_minutes: 10,
        early_checkout_penalty: 30000,
        missing_checkout_penalty: 30000,
        absent_penalty: 150000,
        auto_absent_enabled: true,
        is_active: true,
      });
      await this.settingsRepo.save(settings);
    }

    const tiers = JSON.parse(settings.penalty_tiers);

    const schedules = await this.scheduleRepo
      .createQueryBuilder('s')
      .where('s.work_date >= :startDateStr', { startDateStr })
      .andWhere('s.work_date <= :endDateStr', { endDateStr })
      .andWhere('s.is_active = :isActive', { isActive: true })
      .getMany();

    const attendances = await this.attendanceRepo
      .createQueryBuilder('a')
      .where('a.date >= :startDateStr', { startDateStr })
      .andWhere('a.date <= :endDateStr', { endDateStr })
      .getMany();

    // Delete existing auto penalties
    await this.penaltyRepo
      .createQueryBuilder()
      .delete()
      .where('date >= :startDateStr', { startDateStr })
      .andWhere('date <= :endDateStr', { endDateStr })
      .andWhere("notes LIKE '%Tự động%'")
      .execute();

    const attMap = {};
    for (const a of attendances) {
      attMap[
        `${a.user_id}-${typeof a.date === 'string' ? a.date : moment(a.date).format('YYYY-MM-DD')}`
      ] = a;
    }

    const now = moment().utcOffset(7);
    const created: any[] = [];
    for (const sch of schedules) {
      const workDateStr = typeof sch.work_date === 'string' ? sch.work_date : moment(sch.work_date).format('YYYY-MM-DD');
      const key = `${sch.user_id}-${workDateStr}`;
      const att = attMap[key];

      const effectiveLateMinutes = sch.allowed_late_minutes ?? settings.allowed_late_minutes ?? 0;
      const shiftStartDt = moment(`${workDateStr} ${sch.start_time} +07:00`, 'YYYY-MM-DD HH:mm Z').utcOffset(7);
      const shiftEndDt = moment(`${workDateStr} ${sch.end_time} +07:00`, 'YYYY-MM-DD HH:mm Z').utcOffset(7);
      if (shiftEndDt.isBefore(shiftStartDt)) shiftEndDt.add(1, 'days');

      let amount = 0;
      let reason = '';
      let type = '';

      if (!att || !att.check_in_time) {
        // Only penalize ABSENT after the check-in grace window has passed
        const latestCheckInDt = shiftStartDt.clone().add(effectiveLateMinutes, 'minutes');
        if (settings.auto_absent_enabled && now.isAfter(latestCheckInDt)) {
          type = 'ABSENT';
          amount = settings.absent_penalty;
          reason = 'Vắng mặt không phép';
        }
      } else if (!att.check_out_time) {
        // Only penalize MISSING_CHECKOUT 2+ hours after shift ends
        if (now.isAfter(shiftEndDt.clone().add(2, 'hours'))) {
          type = 'MISSING_CHECKOUT';
          amount = settings.missing_checkout_penalty;
          reason = 'Quên chấm ca ra';
        }
      } else if (att.status === AttendanceStatus.LATE) {
        // Normalize seconds/milliseconds to 0 to be consistent with recalculateStatus
        const checkInMom = moment(att.check_in_time).utcOffset(7).second(0).millisecond(0);
        const lateSeconds = Math.max(0, checkInMom.diff(shiftStartDt, 'seconds'));
        const lateMins = Math.floor(lateSeconds / 60);

        if (lateSeconds > effectiveLateMinutes * 60) {
          for (const t of tiers) {
            if (t.max_minutes === null || lateMins <= t.max_minutes) {
              amount = t.penalty_amount;
              break;
            }
          }
        }

        if (amount > 0) {
          type = 'LATE';
          reason = `Đi muộn ${lateMins} phút`;
        }
      } else if (att.status === AttendanceStatus.EARLY_CHECKOUT) {
        type = 'EARLY_CHECKOUT';
        amount = settings.early_checkout_penalty;
        reason = 'Về sớm';
      }

      if (amount > 0) {
        const pen = this.penaltyRepo.create({
          user_id: sch.user_id,
          date: sch.work_date,
          amount,
          notes: `${reason} (Tự động)`,
          created_by: currentUserId,
        });
        await this.penaltyRepo.save(pen);
        created.push({
          user_id: sch.user_id,
          date: sch.work_date,
          type,
          amount,
        });
      }
    }

    return {
      message: `Created ${created.length} new penalties`,
      created: created.length,
      data: created,
    };
  }

  // ==================== Auto Generate Penalty For Single Attendance ====================
  // Called on check-in, check-out, attendance edit, and cron job.
  // Deletes all auto-penalties for the user/date and re-evaluates from scratch.
  async autoGeneratePenaltyForAttendance(
    userId: number,
    dateStr: string,
    currentUserId?: number,
  ) {
    const settings = await this.settingsRepo.findOne({
      where: { is_active: true },
    });
    if (!settings) return null;

    const tiers: Array<{ max_minutes: number | null; penalty_amount: number }> =
      JSON.parse(settings.penalty_tiers);

    const sch = await this.scheduleRepo.findOne({
      where: { user_id: userId, work_date: dateStr, is_active: true },
    });
    const att = await this.attendanceRepo.findOne({
      where: { user_id: userId, date: dateStr },
    });

    if (!sch) return null;

    const workDate =
      typeof sch.work_date === 'string'
        ? sch.work_date
        : moment(sch.work_date).format('YYYY-MM-DD');
    const shiftStartDt = moment(`${workDate} ${sch.start_time} +07:00`, 'YYYY-MM-DD HH:mm Z').utcOffset(7);
    const shiftEndDt = moment(`${workDate} ${sch.end_time} +07:00`, 'YYYY-MM-DD HH:mm Z').utcOffset(7);
    if (shiftEndDt.isBefore(shiftStartDt)) shiftEndDt.add(1, 'days');
    const now = moment().utcOffset(7);

    const toCreate: Array<{ amount: number; reason: string }> = [];

    // Use per-schedule grace period (matches how LATE status is determined)
    const effectiveLateMinutes = sch.allowed_late_minutes ?? settings.allowed_late_minutes ?? 0;

    if (!att?.check_in_time) {
      // ABSENT — once the check-in window has closed (start + grace period)
      const latestCheckInDt = shiftStartDt.clone().add(effectiveLateMinutes, 'minutes');
      if (settings.auto_absent_enabled && now.isAfter(latestCheckInDt)) {
        toCreate.push({ amount: settings.absent_penalty, reason: 'Vắng mặt không phép' });
      }
    } else {
      if (att.status === AttendanceStatus.LATE) {
        // Normalize seconds/milliseconds to 0 to be consistent with recalculateStatus
        const checkInMom = moment(att.check_in_time).utcOffset(7).second(0).millisecond(0);
        const lateSeconds = Math.max(0, checkInMom.diff(shiftStartDt, 'seconds'));
        const lateMins = Math.floor(lateSeconds / 60);
        if (lateSeconds > effectiveLateMinutes * 60) {
          for (const t of tiers) {
            if (t.max_minutes === null || lateMins <= t.max_minutes) {
              if (t.penalty_amount > 0) {
                toCreate.push({ amount: t.penalty_amount, reason: `Đi muộn ${lateMins} phút` });
              }
              break;
            }
          }
        }
      }

      // EARLY_CHECKOUT — check independently so LATE+EARLY_CHECKOUT both get penalized
      if (att.check_out_time) {
        const checkOutMom = moment(att.check_out_time).utcOffset(7);
        const earliestCheckout = shiftEndDt.clone().subtract(10, 'minutes');
        if (checkOutMom.isBefore(earliestCheckout) && settings.early_checkout_penalty > 0) {
          toCreate.push({ amount: settings.early_checkout_penalty, reason: 'Về sớm' });
        }
      }

      // MISSING_CHECKOUT — only 2+ hours after shift ends (not right at check-in)
      if (
        !att.check_out_time &&
        now.isAfter(shiftEndDt.clone().add(2, 'hours'))
      ) {
        if (settings.missing_checkout_penalty > 0) {
          toCreate.push({ amount: settings.missing_checkout_penalty, reason: 'Quên chấm ca ra' });
        }
      }
    }

    let creatorId = currentUserId;
    if (toCreate.length > 0 && !creatorId) {
      const adminUser = await this.userRepo.findOne({
        where: { role_id: 1 },
        order: { id: 'ASC' },
      });
      creatorId = adminUser?.id ?? userId;
    }

    const saved = await this.dataSource.transaction(async (tx) => {
      await tx
        .createQueryBuilder()
        .delete()
        .from(PenaltyEntity)
        .where('user_id = :userId', { userId })
        .andWhere('date = :dateStr', { dateStr })
        .andWhere("notes LIKE '%Tự động%'")
        .execute();

      const results: PenaltyEntity[] = [];
      for (const p of toCreate) {
        const pen = tx.create(PenaltyEntity, {
          user_id: sch.user_id,
          date: sch.work_date,
          amount: p.amount,
          notes: `${p.reason} (Tự động)`,
          created_by: creatorId,
        });
        results.push(await tx.save(PenaltyEntity, pen));
      }
      return results;
    });

    return saved;
  }
}
