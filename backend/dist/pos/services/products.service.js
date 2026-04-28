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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let ProductsService = class ProductsService {
    productRepo;
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    mapToResponse(p) {
        return {
            id: p.id,
            name: p.name,
            categoryId: p.category_id,
            type: p.type,
            code: p.code,
            sellPrice: p.sell_price,
            price: p.sell_price,
            costPrice: p.cost_price,
            unit: p.unit,
            color: p.color,
            image: p.image,
            description: p.description,
            channels: p.channels,
            inventoryLinked: p.inventory_linked,
            inventoryId: p.inventory_id,
            showOnScoreboard: p.show_on_scoreboard,
            hourlyPrice: p.hourly_price,
            timeIntervalValue: p.time_interval_value,
            timeIntervalUnit: p.time_interval_unit,
            firstHourEnabled: p.first_hour_enabled,
            specialHourEnabled: p.special_hour_enabled,
            createdAt: p.created_at?.toISOString(),
        };
    }
    async findAll() {
        const products = await this.productRepo.find({ order: { id: 'ASC' } });
        return products.map((p) => this.mapToResponse(p));
    }
    async findOne(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return this.mapToResponse(product);
    }
    async create(dto) {
        const p = this.productRepo.create({
            name: dto.name,
            category_id: dto.categoryId,
            type: dto.type,
            code: dto.code,
            sell_price: dto.sellPrice,
            cost_price: dto.costPrice,
            unit: dto.unit,
            color: dto.color,
            image: dto.image,
            description: dto.description,
            channels: dto.channels,
            inventory_linked: dto.inventoryLinked,
            inventory_id: dto.inventoryId,
            show_on_scoreboard: dto.showOnScoreboard,
            hourly_price: dto.hourlyPrice,
            time_interval_value: dto.timeIntervalValue,
            time_interval_unit: dto.timeIntervalUnit,
            first_hour_enabled: dto.firstHourEnabled,
            special_hour_enabled: dto.specialHourEnabled,
        });
        await this.productRepo.save(p);
        return this.mapToResponse(p);
    }
    async update(id, dto) {
        const p = await this.productRepo.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Product not found');
        if (dto.categoryId !== undefined)
            p.category_id = dto.categoryId;
        if (dto.sellPrice !== undefined)
            p.sell_price = dto.sellPrice;
        if (dto.costPrice !== undefined)
            p.cost_price = dto.costPrice;
        if (dto.inventoryLinked !== undefined)
            p.inventory_linked = dto.inventoryLinked;
        if (dto.inventoryId !== undefined)
            p.inventory_id = dto.inventoryId;
        if (dto.showOnScoreboard !== undefined)
            p.show_on_scoreboard = dto.showOnScoreboard;
        if (dto.hourlyPrice !== undefined)
            p.hourly_price = dto.hourlyPrice;
        if (dto.timeIntervalValue !== undefined)
            p.time_interval_value = dto.timeIntervalValue;
        if (dto.timeIntervalUnit !== undefined)
            p.time_interval_unit = dto.timeIntervalUnit;
        if (dto.firstHourEnabled !== undefined)
            p.first_hour_enabled = dto.firstHourEnabled;
        if (dto.specialHourEnabled !== undefined)
            p.special_hour_enabled = dto.specialHourEnabled;
        if (dto.name !== undefined)
            p.name = dto.name;
        if (dto.type !== undefined)
            p.type = dto.type;
        if (dto.code !== undefined)
            p.code = dto.code;
        if (dto.unit !== undefined)
            p.unit = dto.unit;
        if (dto.color !== undefined)
            p.color = dto.color;
        if (dto.image !== undefined)
            p.image = dto.image;
        if (dto.description !== undefined)
            p.description = dto.description;
        if (dto.channels !== undefined)
            p.channels = dto.channels;
        await this.productRepo.save(p);
        return this.mapToResponse(p);
    }
    async remove(id) {
        const p = await this.productRepo.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Product not found');
        await this.productRepo.remove(p);
        return null;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ProductEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map