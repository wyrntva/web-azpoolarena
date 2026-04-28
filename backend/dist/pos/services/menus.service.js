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
exports.MenusService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let MenusService = class MenusService {
    menuRepo;
    constructor(menuRepo) {
        this.menuRepo = menuRepo;
    }
    mapToResponse(m) {
        return {
            id: m.id,
            name: m.name,
            icon: m.icon,
            image: m.image,
            productIds: m.product_ids || [],
            sort_order: m.sort_order,
            createdAt: m.created_at?.toISOString(),
        };
    }
    async findAll() {
        const menus = await this.menuRepo.find({ order: { sort_order: 'ASC' } });
        return menus.map((m) => this.mapToResponse(m));
    }
    async findOne(id) {
        const m = await this.menuRepo.findOne({ where: { id } });
        if (!m)
            throw new common_1.NotFoundException('Menu not found');
        return this.mapToResponse(m);
    }
    async create(dto) {
        const count = await this.menuRepo.count();
        const m = this.menuRepo.create({
            name: dto.name,
            icon: dto.icon,
            image: dto.image,
            product_ids: dto.productIds,
            sort_order: count,
        });
        await this.menuRepo.save(m);
        return this.mapToResponse(m);
    }
    async update(id, dto) {
        const m = await this.menuRepo.findOne({ where: { id } });
        if (!m)
            throw new common_1.NotFoundException('Menu not found');
        if (dto.name !== undefined)
            m.name = dto.name;
        if (dto.icon !== undefined)
            m.icon = dto.icon;
        if (dto.image !== undefined)
            m.image = dto.image;
        if (dto.productIds !== undefined)
            m.product_ids = dto.productIds;
        await this.menuRepo.save(m);
        return this.mapToResponse(m);
    }
    async remove(id) {
        const m = await this.menuRepo.findOne({ where: { id } });
        if (!m)
            throw new common_1.NotFoundException('Menu not found');
        await this.menuRepo.remove(m);
        return null;
    }
    async reorder(items) {
        for (const item of items) {
            await this.menuRepo.update(item.id, { sort_order: item.sort_order });
        }
        return this.findAll();
    }
};
exports.MenusService = MenusService;
exports.MenusService = MenusService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.MenuEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MenusService);
//# sourceMappingURL=menus.service.js.map