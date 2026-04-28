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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const user_entity_1 = require("../../users/entities/user.entity");
const entities_2 = require("../../hr/entities");
const enums_1 = require("../../common/enums");
const moment_1 = __importDefault(require("moment"));
let ReportsService = class ReportsService {
    receiptRepo;
    receiptTypeRepo;
    userRepo;
    attendanceRepo;
    bonusRepo;
    constructor(receiptRepo, receiptTypeRepo, userRepo, attendanceRepo, bonusRepo) {
        this.receiptRepo = receiptRepo;
        this.receiptTypeRepo = receiptTypeRepo;
        this.userRepo = userRepo;
        this.attendanceRepo = attendanceRepo;
        this.bonusRepo = bonusRepo;
    }
    async getMonthlyExpenseReport(month) {
        if (!/^\d{4}-\d{2}$/.test(month))
            throw new common_1.BadRequestException('Invalid month format. Use YYYY-MM');
        const startDate = (0, moment_1.default)(`${month}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
        const endDate = (0, moment_1.default)(startDate).add(1, 'months').format('YYYY-MM-DD');
        const categories = [];
        const attendances = await this.attendanceRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.user', 'user')
            .where('a.date >= :startDate', { startDate })
            .andWhere('a.date < :endDate', { endDate })
            .andWhere('a.status IN (:...statuses)', {
            statuses: [
                enums_1.AttendanceStatus.PRESENT,
                enums_1.AttendanceStatus.LATE,
                enums_1.AttendanceStatus.EARLY_CHECKOUT,
            ],
        })
            .getMany();
        let totalHourlySalary = 0;
        for (const att of attendances) {
            if (att.user && att.user.salary_type === enums_1.SalaryType.HOURLY) {
                if (att.check_in_time && att.check_out_time) {
                    const hours = (0, moment_1.default)(att.check_out_time).diff((0, moment_1.default)(att.check_in_time), 'hours', true);
                    const rate = att.user.hourly_rate || 25000;
                    totalHourlySalary += hours * rate;
                }
            }
        }
        const fixedUsers = await this.userRepo.find({
            where: { is_active: true, salary_type: enums_1.SalaryType.FIXED },
        });
        let totalFixedSalary = 0;
        for (const u of fixedUsers) {
            if (u.fixed_salary)
                totalFixedSalary += u.fixed_salary;
        }
        const bonusSum = await this.bonusRepo
            .createQueryBuilder('b')
            .select('SUM(b.amount)', 'total')
            .where('b.date >= :startDate', { startDate })
            .andWhere('b.date < :endDate', { endDate })
            .getRawOne();
        const totalBonuses = parseFloat(bonusSum?.total) || 0;
        const employeeSalaryCost = totalHourlySalary + totalFixedSalary + totalBonuses;
        categories.push({
            category_id: null,
            category_name: 'Chi phí lương nhân viên',
            total_amount: employeeSalaryCost,
            is_salary: true,
        });
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
        const totalExpenses = categories.reduce((sum, cat) => sum + cat.total_amount, 0);
        return {
            month,
            categories,
            total_expenses: totalExpenses,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ReceiptEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ReceiptTypeEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_2.AttendanceEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_2.BonusEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map