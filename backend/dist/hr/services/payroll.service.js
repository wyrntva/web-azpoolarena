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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const user_entity_1 = require("../../users/entities/user.entity");
const enums_1 = require("../../common/enums");
const moment_1 = __importDefault(require("moment"));
let PayrollService = class PayrollService {
    advanceRepo;
    bonusRepo;
    penaltyRepo;
    attendanceRepo;
    scheduleRepo;
    settingsRepo;
    userRepo;
    constructor(advanceRepo, bonusRepo, penaltyRepo, attendanceRepo, scheduleRepo, settingsRepo, userRepo) {
        this.advanceRepo = advanceRepo;
        this.bonusRepo = bonusRepo;
        this.penaltyRepo = penaltyRepo;
        this.attendanceRepo = attendanceRepo;
        this.scheduleRepo = scheduleRepo;
        this.settingsRepo = settingsRepo;
        this.userRepo = userRepo;
    }
    async createAdvance(dto, currentUserId) {
        const advance = this.advanceRepo.create({
            ...dto,
            created_by: currentUserId,
        });
        return this.advanceRepo.save(advance);
    }
    async updateAdvance(id, dto) {
        const advance = await this.advanceRepo.findOne({ where: { id } });
        if (!advance)
            throw new common_1.NotFoundException('Advance payment not found');
        Object.assign(advance, dto);
        return this.advanceRepo.save(advance);
    }
    async deleteAdvance(id) {
        const advance = await this.advanceRepo.findOne({ where: { id } });
        if (!advance)
            throw new common_1.NotFoundException('Advance payment not found');
        await this.advanceRepo.remove(advance);
        return null;
    }
    async findAllAdvances(userId, startDate, endDate) {
        const qb = this.advanceRepo
            .createQueryBuilder('adv')
            .leftJoinAndSelect(user_entity_1.UserEntity, 'user', 'user.id = adv.user_id')
            .leftJoinAndSelect(user_entity_1.UserEntity, 'creator', 'creator.id = adv.created_by')
            .orderBy('adv.date', 'DESC');
        if (userId)
            qb.andWhere('adv.user_id = :userId', { userId });
        if (startDate)
            qb.andWhere('adv.date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('adv.date <= :endDate', { endDate });
        const results = await qb.getRawAndEntities();
        return results.entities.map((ent) => {
            const v = results.raw.find((r) => r.adv_id === ent.id);
            return {
                ...ent,
                employee_name: v.user_full_name,
                created_by_name: v.creator_full_name,
            };
        });
    }
    async createBonus(dto, currentUserId) {
        const bonus = this.bonusRepo.create({
            ...dto,
            created_by: currentUserId,
        });
        return this.bonusRepo.save(bonus);
    }
    async updateBonus(id, dto) {
        const bonus = await this.bonusRepo.findOne({ where: { id } });
        if (!bonus)
            throw new common_1.NotFoundException('Bonus not found');
        Object.assign(bonus, dto);
        return this.bonusRepo.save(bonus);
    }
    async deleteBonus(id) {
        const bonus = await this.bonusRepo.findOne({ where: { id } });
        if (!bonus)
            throw new common_1.NotFoundException('Bonus not found');
        await this.bonusRepo.remove(bonus);
        return null;
    }
    async findAllBonuses(userId, startDate, endDate) {
        const qb = this.bonusRepo
            .createQueryBuilder('bn')
            .leftJoinAndSelect(user_entity_1.UserEntity, 'user', 'user.id = bn.user_id')
            .leftJoinAndSelect(user_entity_1.UserEntity, 'creator', 'creator.id = bn.created_by')
            .orderBy('bn.date', 'DESC');
        if (userId)
            qb.andWhere('bn.user_id = :userId', { userId });
        if (startDate)
            qb.andWhere('bn.date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('bn.date <= :endDate', { endDate });
        const results = await qb.getRawAndEntities();
        return results.entities.map((ent) => {
            const v = results.raw.find((r) => r.bn_id === ent.id);
            return {
                ...ent,
                employee_name: v.user_full_name,
                created_by_name: v.creator_full_name,
            };
        });
    }
    async createPenalty(dto, currentUserId) {
        const penalty = this.penaltyRepo.create({
            ...dto,
            created_by: currentUserId,
        });
        return this.penaltyRepo.save(penalty);
    }
    async updatePenalty(id, dto) {
        const penalty = await this.penaltyRepo.findOne({ where: { id } });
        if (!penalty)
            throw new common_1.NotFoundException('Penalty not found');
        Object.assign(penalty, dto);
        return this.penaltyRepo.save(penalty);
    }
    async deletePenalty(id) {
        const penalty = await this.penaltyRepo.findOne({ where: { id } });
        if (!penalty)
            throw new common_1.NotFoundException('Penalty not found');
        await this.penaltyRepo.remove(penalty);
        return null;
    }
    async findAllPenalties(userId, startDate, endDate) {
        const qb = this.penaltyRepo
            .createQueryBuilder('pen')
            .leftJoinAndSelect(user_entity_1.UserEntity, 'user', 'user.id = pen.user_id')
            .leftJoinAndSelect(user_entity_1.UserEntity, 'creator', 'creator.id = pen.created_by')
            .orderBy('pen.date', 'DESC');
        if (userId)
            qb.andWhere('pen.user_id = :userId', { userId });
        if (startDate)
            qb.andWhere('pen.date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('pen.date <= :endDate', { endDate });
        const results = await qb.getRawAndEntities();
        return results.entities.map((ent) => {
            const v = results.raw.find((r) => r.pen_id === ent.id);
            return {
                ...ent,
                employee_name: v.user_full_name,
                created_by_name: v.creator_full_name,
            };
        });
    }
    async getSummary(month) {
        let start, end;
        if (month.includes('-')) {
            start = (0, moment_1.default)(`${month}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
            end = (0, moment_1.default)(start).add(1, 'months').format('YYYY-MM-DD');
        }
        else {
            throw new common_1.BadRequestException('Invalid month format');
        }
        const users = await this.userRepo.find({ where: { is_active: true } });
        const userIds = users.map((u) => u.id);
        if (userIds.length === 0)
            return [];
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
            const diffSecs = (0, moment_1.default)(att.check_out_time).diff((0, moment_1.default)(att.check_in_time), 'seconds');
            hoursMap[att.user_id] = (hoursMap[att.user_id] || 0) + diffSecs;
        }
        const mapArray = (arr) => arr.reduce((acc, curr) => ({ ...acc, [curr.user_id]: parseFloat(curr.total) }), {});
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
    async autoGeneratePenalties(startDateStr, endDateStr, currentUserId) {
        let settings = await this.settingsRepo.findOne({
            where: { is_active: true },
        });
        if (!settings) {
            settings = this.settingsRepo.create({
                allowed_late_minutes: 15,
                penalty_tiers: JSON.stringify([
                    { max_minutes: 15, penalty_amount: 0 },
                    { max_minutes: 30, penalty_amount: 50000 },
                    { max_minutes: 60, penalty_amount: 100000 },
                    { max_minutes: null, penalty_amount: 200000 },
                ]),
                early_checkout_grace_minutes: 10,
                early_checkout_penalty: 50000,
                absent_penalty: 100000,
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
        await this.penaltyRepo
            .createQueryBuilder()
            .delete()
            .where('date >= :startDateStr', { startDateStr })
            .andWhere('date <= :endDateStr', { endDateStr })
            .andWhere("notes LIKE '%Tự động%'")
            .execute();
        const attMap = {};
        for (const a of attendances) {
            attMap[`${a.user_id}-${typeof a.date === 'string' ? a.date : (0, moment_1.default)(a.date).format('YYYY-MM-DD')}`] = a;
        }
        const created = [];
        for (const sch of schedules) {
            const key = `${sch.user_id}-${typeof sch.work_date === 'string' ? sch.work_date : (0, moment_1.default)(sch.work_date).format('YYYY-MM-DD')}`;
            const att = attMap[key];
            let amount = 0;
            let reason = '';
            let type = '';
            if (!att || !att.check_in_time) {
                type = 'ABSENT';
                amount = settings.absent_penalty;
                reason = 'Vắng mặt không phép';
            }
            else if (att.status === enums_1.AttendanceStatus.LATE) {
                const checkInDt = (0, moment_1.default)(att.check_in_time);
                const startDt = (0, moment_1.default)(`${typeof sch.work_date === 'string' ? sch.work_date : (0, moment_1.default)(sch.work_date).format('YYYY-MM-DD')} ${sch.start_time}`, 'YYYY-MM-DD HH:mm');
                const lateMins = Math.max(0, checkInDt.diff(startDt, 'minutes'));
                for (const t of tiers) {
                    if (t.max_minutes === null || lateMins <= t.max_minutes) {
                        amount = t.penalty_amount;
                        break;
                    }
                }
                if (amount > 0) {
                    type = 'LATE';
                    reason = `Đi muộn ${lateMins} phút`;
                }
            }
            else if (att.status === enums_1.AttendanceStatus.EARLY_CHECKOUT) {
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
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.AdvancePaymentEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.BonusEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.PenaltyEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.AttendanceEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.WorkScheduleEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.AttendanceSettingsEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map