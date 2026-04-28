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
exports.CashflowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const moment_1 = __importDefault(require("moment"));
let CashflowService = class CashflowService {
    revRepo;
    excRepo;
    safeRepo;
    debtRepo;
    constructor(revRepo, excRepo, safeRepo, debtRepo) {
        this.revRepo = revRepo;
        this.excRepo = excRepo;
        this.safeRepo = safeRepo;
        this.debtRepo = debtRepo;
    }
    async findRevenueByDate(date) {
        const d = (0, moment_1.default)(date).format('YYYY-MM-DD');
        return this.revRepo.findOne({
            where: { revenue_date: d },
            relations: ['created_by_user'],
        });
    }
    async getRevenuesByMonth(month) {
        const start = (0, moment_1.default)(`${month}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
        const end = (0, moment_1.default)(start).add(1, 'months').format('YYYY-MM-DD');
        return this.revRepo
            .createQueryBuilder('r')
            .where('r.revenue_date >= :start', { start })
            .andWhere('r.revenue_date < :end', { end })
            .orderBy('r.revenue_date', 'ASC')
            .getMany();
    }
    async upsertRevenue(dto, date, userId) {
        const d = (0, moment_1.default)(date).format('YYYY-MM-DD');
        let rev = await this.revRepo.findOne({ where: { revenue_date: d } });
        if (!rev) {
            rev = this.revRepo.create({
                revenue_date: d,
                created_by: userId,
                ...dto,
            });
        }
        else {
            Object.assign(rev, dto);
        }
        return this.revRepo.save(rev);
    }
    async createExchange(dto, userId) {
        const exc = this.excRepo.create({ ...dto, created_by: userId });
        return this.excRepo.save(exc);
    }
    async findExchanges(startDate, endDate) {
        const qb = this.excRepo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.created_by_user', 'creator')
            .orderBy('e.exchange_date', 'DESC');
        if (startDate)
            qb.andWhere('e.exchange_date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('e.exchange_date <= :endDate', { endDate });
        return qb.getMany();
    }
    async deleteExchange(id) {
        const exc = await this.excRepo.findOne({ where: { id } });
        if (exc)
            await this.excRepo.remove(exc);
        return null;
    }
    async createSafe(dto, userId) {
        const safe = this.safeRepo.create({ ...dto, created_by: userId });
        return this.safeRepo.save(safe);
    }
    async findSafes(startDate, endDate) {
        const qb = this.safeRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.created_by_user', 'creator')
            .orderBy('s.safe_date', 'DESC');
        if (startDate)
            qb.andWhere('s.safe_date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('s.safe_date <= :endDate', { endDate });
        return qb.getMany();
    }
    async deleteSafe(id) {
        const safe = await this.safeRepo.findOne({ where: { id } });
        if (safe)
            await this.safeRepo.remove(safe);
        return null;
    }
    async createDebt(dto, userId) {
        const debt = this.debtRepo.create({ ...dto, created_by: userId });
        return this.debtRepo.save(debt);
    }
    async findDebts(isPaid) {
        const qb = this.debtRepo
            .createQueryBuilder('d')
            .leftJoinAndSelect('d.created_by_user', 'creator')
            .orderBy('d.created_at', 'DESC');
        if (isPaid !== undefined)
            qb.andWhere('d.is_paid = :isPaid', { isPaid });
        return qb.getMany();
    }
    async updateDebt(id, dto) {
        const debt = await this.debtRepo.findOne({ where: { id } });
        if (!debt)
            throw new common_1.NotFoundException('Debt not found');
        Object.assign(debt, dto);
        return this.debtRepo.save(debt);
    }
    async deleteDebt(id) {
        const debt = await this.debtRepo.findOne({ where: { id } });
        if (debt)
            await this.debtRepo.remove(debt);
        return null;
    }
};
exports.CashflowService = CashflowService;
exports.CashflowService = CashflowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.RevenueEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ExchangeEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.SafeEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.DebtEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CashflowService);
//# sourceMappingURL=cashflow.service.js.map