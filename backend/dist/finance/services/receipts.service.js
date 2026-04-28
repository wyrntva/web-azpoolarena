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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let ReceiptsService = class ReceiptsService {
    receiptTypeRepo;
    receiptRepo;
    constructor(receiptTypeRepo, receiptRepo) {
        this.receiptTypeRepo = receiptTypeRepo;
        this.receiptRepo = receiptRepo;
    }
    async createType(dto) {
        const existing = await this.receiptTypeRepo.findOne({
            where: { name: dto.name },
        });
        if (existing)
            throw new common_1.BadRequestException(`Receipt type '${dto.name}' already exists`);
        const rt = this.receiptTypeRepo.create(dto);
        return this.receiptTypeRepo.save(rt);
    }
    async findAllTypes() {
        return this.receiptTypeRepo.find({
            relations: ['category'],
            order: { name: 'ASC' },
        });
    }
    async findTypeById(id) {
        const rt = await this.receiptTypeRepo.findOne({
            where: { id },
            relations: ['category'],
        });
        if (!rt)
            throw new common_1.NotFoundException('Receipt type not found');
        return rt;
    }
    async updateType(id, dto) {
        const rt = await this.findTypeById(id);
        if (dto.name && dto.name !== rt.name) {
            const existing = await this.receiptTypeRepo.findOne({
                where: { name: dto.name },
            });
            if (existing)
                throw new common_1.BadRequestException(`Receipt type '${dto.name}' already exists`);
        }
        Object.assign(rt, dto);
        return this.receiptTypeRepo.save(rt);
    }
    async deleteType(id) {
        const rt = await this.findTypeById(id);
        await this.receiptTypeRepo.remove(rt);
        return null;
    }
    async createReceipt(dto, userId) {
        const receipt = this.receiptRepo.create({ ...dto, created_by: userId });
        return this.receiptRepo.save(receipt);
    }
    async findAllReceipts(skip = 0, limit = 100, startDate, endDate, typeId) {
        const qb = this.receiptRepo
            .createQueryBuilder('r')
            .leftJoinAndSelect('r.receipt_type', 'type')
            .leftJoinAndSelect('r.created_by_user', 'creator')
            .orderBy('r.receipt_date', 'DESC')
            .addOrderBy('r.created_at', 'DESC')
            .skip(skip)
            .take(limit);
        if (startDate)
            qb.andWhere('r.receipt_date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('r.receipt_date <= :endDate', { endDate });
        if (typeId)
            qb.andWhere('r.receipt_type_id = :typeId', { typeId });
        return qb.getManyAndCount();
    }
    async findReceiptById(id) {
        const receipt = await this.receiptRepo.findOne({
            where: { id },
            relations: ['receipt_type', 'created_by_user'],
        });
        if (!receipt)
            throw new common_1.NotFoundException('Receipt not found');
        return receipt;
    }
    async updateReceipt(id, dto) {
        const receipt = await this.findReceiptById(id);
        Object.assign(receipt, dto);
        return this.receiptRepo.save(receipt);
    }
    async deleteReceipt(id) {
        const receipt = await this.findReceiptById(id);
        await this.receiptRepo.remove(receipt);
        return null;
    }
};
exports.ReceiptsService = ReceiptsService;
exports.ReceiptsService = ReceiptsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ReceiptTypeEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ReceiptEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReceiptsService);
//# sourceMappingURL=receipts.service.js.map