"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkSchedulesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const user_entity_1 = require("../../users/entities/user.entity");
const moment_1 = __importDefault(require("moment"));
let WorkSchedulesService = class WorkSchedulesService {
    scheduleRepo;
    attendanceRepo;
    userRepo;
    constructor(scheduleRepo, attendanceRepo, userRepo) {
        this.scheduleRepo = scheduleRepo;
        this.attendanceRepo = attendanceRepo;
        this.userRepo = userRepo;
    }
    async create(dto) {
        const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${dto.user_id} not found`);
        }
        const existing = await this.scheduleRepo.findOne({
            where: {
                user_id: dto.user_id,
                work_date: dto.work_date,
                is_active: true,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Active work schedule already exists for user ${user.full_name} on ${dto.work_date}`);
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
    async findAll(userId, startDate, endDate, isActive) {
        const qb = this.scheduleRepo
            .createQueryBuilder('ws')
            .leftJoinAndSelect(user_entity_1.UserEntity, 'user', 'user.id = ws.user_id')
            .leftJoinAndSelect('user.role', 'role')
            .orderBy('ws.work_date', 'DESC');
        if (userId)
            qb.andWhere('ws.user_id = :userId', { userId });
        if (startDate)
            qb.andWhere('ws.work_date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('ws.work_date <= :endDate', { endDate });
        if (isActive !== undefined)
            qb.andWhere('ws.is_active = :isActive', { isActive });
        const results = await qb.getRawAndEntities();
        return results.entities.map((ws) => {
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
    async findMySchedules(userId, startDate, endDate) {
        const query = { user_id: userId, is_active: true };
        if (startDate || endDate) {
            if (startDate && endDate) {
                query.work_date = (0, typeorm_2.Between)(startDate, endDate);
            }
            else if (startDate) {
                const qb = this.scheduleRepo
                    .createQueryBuilder('ws')
                    .where('ws.user_id = :userId', { userId })
                    .andWhere('ws.is_active = :isActive', { isActive: true })
                    .andWhere('ws.work_date >= :startDate', { startDate })
                    .orderBy('ws.work_date', 'ASC');
                return qb.getMany();
            }
            else if (endDate) {
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
    async findOne(id, currentUserId, isAdmin) {
        const ws = await this.scheduleRepo.findOne({ where: { id } });
        if (!ws)
            throw new common_1.NotFoundException('Work schedule not found');
        if (!isAdmin && ws.user_id !== currentUserId) {
            throw new common_1.BadRequestException('You can only view your own schedules');
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
    async update(id, dto) {
        const ws = await this.scheduleRepo.findOne({ where: { id } });
        if (!ws)
            throw new common_1.NotFoundException('Work schedule not found');
        if (dto.start_time !== undefined)
            ws.start_time = dto.start_time;
        if (dto.end_time !== undefined)
            ws.end_time = dto.end_time;
        if (dto.allowed_late_minutes !== undefined)
            ws.allowed_late_minutes = dto.allowed_late_minutes;
        if (dto.is_active !== undefined)
            ws.is_active = dto.is_active;
        await this.scheduleRepo.save(ws);
        return ws;
    }
    async remove(id) {
        const ws = await this.scheduleRepo.findOne({ where: { id } });
        if (!ws)
            throw new common_1.NotFoundException('Work schedule not found');
        await this.attendanceRepo.delete({ work_schedule_id: id });
        await this.scheduleRepo.remove(ws);
        return null;
    }
    async copySchedule(dto) {
        const source = await this.scheduleRepo.findOne({
            where: {
                user_id: dto.user_id,
                work_date: dto.from_date,
                is_active: true,
            },
        });
        if (!source) {
            throw new common_1.NotFoundException(`No schedule found for user ${dto.user_id} on ${dto.from_date}`);
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
            await this.scheduleRepo.save(this.scheduleRepo.create({
                user_id: dto.user_id,
                work_date: targetDate,
                start_time: source.start_time,
                end_time: source.end_time,
                allowed_late_minutes: source.allowed_late_minutes,
                is_active: true,
            }));
            createdCount++;
        }
        return {
            status: 'success',
            created: createdCount,
            skipped: skippedCount,
            message: `Created ${createdCount} schedules, skipped ${skippedCount} existing ones`,
        };
    }
    async copyWeekSchedule(dto) {
        const fromWeekStartMom = (0, moment_1.default)(dto.from_week_start, 'YYYY-MM-DD');
        const fromWeekEnd = fromWeekStartMom
            .clone()
            .add(6, 'days')
            .format('YYYY-MM-DD');
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
            throw new common_1.NotFoundException(`No schedules found for week starting ${dto.from_week_start}`);
        }
        let createdCount = 0;
        let skippedCount = 0;
        const toWeekStartMom = (0, moment_1.default)(dto.to_week_start, 'YYYY-MM-DD');
        for (const source of sourceSchedules) {
            const daysOffset = (0, moment_1.default)(source.work_date).diff(fromWeekStartMom, 'days');
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
            await this.scheduleRepo.save(this.scheduleRepo.create({
                user_id: source.user_id,
                work_date: targetDate,
                start_time: source.start_time,
                end_time: source.end_time,
                allowed_late_minutes: source.allowed_late_minutes,
                is_active: true,
            }));
            createdCount++;
        }
        return {
            status: 'success',
            created: createdCount,
            skipped: skippedCount,
            message: `Copied week schedule: created ${createdCount}, skipped ${skippedCount} existing ones`,
        };
    }
};
exports.WorkSchedulesService = WorkSchedulesService;
exports.WorkSchedulesService = WorkSchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.WorkScheduleEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.AttendanceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], WorkSchedulesService);
//# sourceMappingURL=work-schedules.service.js.map