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
exports.InventoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let InventoriesService = class InventoriesService {
    invRepo;
    constructor(invRepo) {
        this.invRepo = invRepo;
    }
    updateStatus(inv) {
        if (inv.quantity <= 0) {
            inv.status = entities_1.InventoryStatus.OUT_OF_STOCK;
        }
        else if (inv.quantity <= inv.min_quantity) {
            inv.status = entities_1.InventoryStatus.LOW_STOCK;
        }
        else {
            inv.status = entities_1.InventoryStatus.IN_STOCK;
        }
    }
    async create(dto, userId) {
        const existing = await this.invRepo.findOne({
            where: { product_name: dto.product_name },
        });
        if (existing)
            throw new common_1.BadRequestException(`Sản phẩm '${dto.product_name}' đã tồn tại`);
        const inv = this.invRepo.create({ ...dto, created_by: userId });
        this.updateStatus(inv);
        const saved = await this.invRepo.save(inv);
        return this.findOne(saved.id);
    }
    async findAll(skip = 0, limit = 100, statusFilter, search) {
        const qb = this.invRepo
            .createQueryBuilder('inv')
            .leftJoinAndSelect('inv.created_by_user', 'creator')
            .leftJoinAndSelect('inv.category', 'category')
            .leftJoinAndSelect('inv.base_unit_ref', 'base_unit')
            .leftJoinAndSelect('inv.conversion_unit_ref', 'conversion_unit')
            .orderBy('inv.product_name', 'ASC')
            .skip(skip)
            .take(limit);
        if (statusFilter) {
            qb.andWhere('inv.status = :statusFilter', { statusFilter });
        }
        if (search) {
            qb.andWhere('inv.product_name ILIKE :search', { search: `%${search}%` });
        }
        const [data, total] = await qb.getManyAndCount();
        return {
            data: data.map((inv) => ({
                ...inv,
                base_unit: inv.base_unit_ref,
                large_unit: inv.conversion_unit_ref,
            })),
            meta: { total, skip, limit },
        };
    }
    async findOne(id) {
        const inv = await this.invRepo.findOne({
            where: { id },
            relations: [
                'created_by_user',
                'category',
                'base_unit_ref',
                'conversion_unit_ref',
            ],
        });
        if (!inv)
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        return {
            ...inv,
            base_unit: inv.base_unit_ref,
            large_unit: inv.conversion_unit_ref,
        };
    }
    async update(id, dto) {
        const inv = await this.invRepo.findOne({ where: { id } });
        if (!inv)
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        if (dto.product_name && dto.product_name !== inv.product_name) {
            const existing = await this.invRepo.findOne({
                where: { product_name: dto.product_name },
            });
            if (existing && existing.id !== id)
                throw new common_1.BadRequestException(`Sản phẩm '${dto.product_name}' đã tồn tại`);
        }
        Object.assign(inv, dto);
        this.updateStatus(inv);
        await this.invRepo.save(inv);
        return this.findOne(id);
    }
    async remove(id) {
        const inv = await this.invRepo.findOne({ where: { id } });
        if (!inv)
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        await this.invRepo.remove(inv);
        return null;
    }
};
exports.InventoriesService = InventoriesService;
exports.InventoriesService = InventoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.InventoryEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InventoriesService);
//# sourceMappingURL=inventories.service.js.map