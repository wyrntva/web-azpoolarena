import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { WorkScheduleEntity, AttendanceEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  CopyScheduleRequestDto,
  CopyWeekScheduleRequestDto,
} from '../dto/hr.dto';
import moment from 'moment';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectRepository(WorkScheduleEntity)
    private readonly scheduleRepo: Repository<WorkScheduleEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(dto: CreateWorkScheduleDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.user_id} not found`);
    }

    const existing = await this.scheduleRepo.findOne({
      where: {
        user_id: dto.user_id,
        work_date: dto.work_date,
        is_active: true,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Active work schedule already exists for user ${user.full_name} on ${dto.work_date}`,
      );
    }

    const schedule = this.scheduleRepo.create({
      user_id: dto.user_id,
      work_date: dto.work_date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      allowed_late_minutes: dto.allowed_late_minutes ?? 0,
      is_active: true,
    });

    await this.scheduleRepo.save(schedule);
    return schedule;
  }

  async findAll(
    userId?: number,
    startDate?: string,
    endDate?: string,
    isActive?: boolean,
  ) {
    const qb = this.scheduleRepo
      .createQueryBuilder('ws')
      .leftJoinAndSelect(UserEntity, 'user', 'user.id = ws.user_id')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('ws.work_date', 'DESC');

    if (userId) qb.andWhere('ws.user_id = :userId', { userId });
    if (startDate) qb.andWhere('ws.work_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('ws.work_date <= :endDate', { endDate });
    if (isActive !== undefined)
      qb.andWhere('ws.is_active = :isActive', { isActive });

    const results = await qb.getRawAndEntities();
    return results.entities.map((ws: any) => {
      const u = results.raw.find((r) => r.ws_id === ws.id);
      return {
        ...ws,
        user: {
          id: u.user_id,
          full_name: u.user_full_name,
          username: u.user_username,
          email: u.user_email,
          role: u.role_name,
        },
      };
    });
  }

  async findMySchedules(userId: number, startDate?: string, endDate?: string) {
    const query: any = { user_id: userId, is_active: true };

    if (startDate || endDate) {
      if (startDate && endDate) {
        query.work_date = Between(startDate, endDate);
      } else if (startDate) {
        // Needs proper query builder if we just want >= startDate but for now:
        const qb = this.scheduleRepo
          .createQueryBuilder('ws')
          .where('ws.user_id = :userId', { userId })
          .andWhere('ws.is_active = :isActive', { isActive: true })
          .andWhere('ws.work_date >= :startDate', { startDate })
          .orderBy('ws.work_date', 'ASC');
        return qb.getMany();
      } else if (endDate) {
        const qb = this.scheduleRepo
          .createQueryBuilder('ws')
          .where('ws.user_id = :userId', { userId })
          .andWhere('ws.is_active = :isActive', { isActive: true })
          .andWhere('ws.work_date <= :endDate', { endDate })
          .orderBy('ws.work_date', 'ASC');
        return qb.getMany();
      }
    }

    return this.scheduleRepo.find({
      where: query,
      order: { work_date: 'ASC' },
    });
  }

  async findOne(id: number, currentUserId: number, isAdmin: boolean) {
    const ws = await this.scheduleRepo.findOne({ where: { id } });
    if (!ws) throw new NotFoundException('Work schedule not found');

    if (!isAdmin && ws.user_id !== currentUserId) {
      throw new BadRequestException('You can only view your own schedules');
    }

    const user = await this.userRepo.findOne({
      where: { id: ws.user_id },
      relations: ['role'],
    });

    return {
      ...ws,
      user: user
        ? {
            id: user.id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            role: user.role ? user.role.name : null,
          }
        : null,
    };
  }

  async update(id: number, dto: UpdateWorkScheduleDto) {
    const ws = await this.scheduleRepo.findOne({ where: { id } });
    if (!ws) throw new NotFoundException('Work schedule not found');

    if (dto.start_time !== undefined) ws.start_time = dto.start_time;
    if (dto.end_time !== undefined) ws.end_time = dto.end_time;
    if (dto.allowed_late_minutes !== undefined)
      ws.allowed_late_minutes = dto.allowed_late_minutes;
    if (dto.is_active !== undefined) ws.is_active = dto.is_active;

    await this.scheduleRepo.save(ws);
    return ws;
  }

  async remove(id: number) {
    const ws = await this.scheduleRepo.findOne({ where: { id } });
    if (!ws) throw new NotFoundException('Work schedule not found');

    // Cascade delete attendances
    await this.attendanceRepo.delete({ work_schedule_id: id });
    await this.scheduleRepo.remove(ws);
    return null;
  }

  async copySchedule(dto: CopyScheduleRequestDto) {
    const source = await this.scheduleRepo.findOne({
      where: {
        user_id: dto.user_id,
        work_date: dto.from_date,
        is_active: true,
      },
    });

    if (!source) {
      throw new NotFoundException(
        `No schedule found for user ${dto.user_id} on ${dto.from_date}`,
      );
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const targetDate of dto.to_dates) {
      const existing = await this.scheduleRepo.findOne({
        where: {
          user_id: dto.user_id,
          work_date: targetDate,
          is_active: true,
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await this.scheduleRepo.save(
        this.scheduleRepo.create({
          user_id: dto.user_id,
          work_date: targetDate,
          start_time: source.start_time,
          end_time: source.end_time,
          allowed_late_minutes: source.allowed_late_minutes,
          is_active: true,
        }),
      );
      createdCount++;
    }

    return {
      status: 'success',
      created: createdCount,
      skipped: skippedCount,
      message: `Created ${createdCount} schedules, skipped ${skippedCount} existing ones`,
    };
  }

  async copyWeekSchedule(dto: CopyWeekScheduleRequestDto) {
    const fromWeekStartMom = moment(dto.from_week_start, 'YYYY-MM-DD');
    const fromWeekEnd = fromWeekStartMom
      .clone()
      .add(6, 'days')
      .format('YYYY-MM-DD');

    // Using query builder to handle the date range properly.
    const qb = this.scheduleRepo
      .createQueryBuilder('ws')
      .where('ws.work_date >= :fromStart', { fromStart: dto.from_week_start })
      .andWhere('ws.work_date <= :fromEnd', { fromEnd: fromWeekEnd })
      .andWhere('ws.is_active = :isActive', { isActive: true });

    if (dto.user_ids && dto.user_ids.length > 0) {
      qb.andWhere('ws.user_id IN (:...userIds)', { userIds: dto.user_ids });
    }

    const sourceSchedules = await qb.getMany();

    if (!sourceSchedules || sourceSchedules.length === 0) {
      throw new NotFoundException(
        `No schedules found for week starting ${dto.from_week_start}`,
      );
    }

    let createdCount = 0;
    let skippedCount = 0;
    const toWeekStartMom = moment(dto.to_week_start, 'YYYY-MM-DD');

    for (const source of sourceSchedules) {
      const daysOffset = moment(source.work_date).diff(
        fromWeekStartMom,
        'days',
      );
      const targetDate = toWeekStartMom
        .clone()
        .add(daysOffset, 'days')
        .format('YYYY-MM-DD');

      const existing = await this.scheduleRepo.findOne({
        where: {
          user_id: source.user_id,
          work_date: targetDate,
          is_active: true,
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await this.scheduleRepo.save(
        this.scheduleRepo.create({
          user_id: source.user_id,
          work_date: targetDate,
          start_time: source.start_time,
          end_time: source.end_time,
          allowed_late_minutes: source.allowed_late_minutes,
          is_active: true,
        }),
      );
      createdCount++;
    }

    return {
      status: 'success',
      created: createdCount,
      skipped: skippedCount,
      message: `Copied week schedule: created ${createdCount}, skipped ${skippedCount} existing ones`,
    };
  }
}
