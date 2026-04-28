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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let CategoriesService = class CategoriesService {
    categoriesRepo;
    constructor(categoriesRepo) {
        this.categoriesRepo = categoriesRepo;
    }
    async create(dto) {
        const existing = await this.categoriesRepo.findOne({
            where: { name: dto.name },
        });
        if (existing)
            throw new common_1.BadRequestException(`Category '${dto.name}' already exists`);
        const category = this.categoriesRepo.create(dto);
        return this.categoriesRepo.save(category);
    }
    async findAll() {
        return this.categoriesRepo.find({ order: { name: 'ASC' } });
    }
    async findOne(id) {
        const category = await this.categoriesRepo.findOne({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException('Category not found');
        return category;
    }
    async update(id, dto) {
        const category = await this.findOne(id);
        if (dto.name && dto.name !== category.name) {
            const existing = await this.categoriesRepo.findOne({
                where: { name: dto.name },
            });
            if (existing)
                throw new common_1.BadRequestException(`Category '${dto.name}' already exists`);
        }
        Object.assign(category, dto);
        return this.categoriesRepo.save(category);
    }
    async remove(id) {
        const category = await this.findOne(id);
        await this.categoriesRepo.remove(category);
        return null;
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CategoryEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map