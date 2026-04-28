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
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let UnitsService = class UnitsService {
    unitsRepo;
    constructor(unitsRepo) {
        this.unitsRepo = unitsRepo;
    }
    async create(dto) {
        const existing = await this.unitsRepo.findOne({
            where: { name: dto.name },
        });
        if (existing)
            throw new common_1.BadRequestException(`Unit '${dto.name}' already exists`);
        const unit = this.unitsRepo.create(dto);
        return this.unitsRepo.save(unit);
    }
    async findAll() {
        return this.unitsRepo.find({ order: { name: 'ASC' } });
    }
    async findOne(id) {
        const unit = await this.unitsRepo.findOne({ where: { id } });
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        return unit;
    }
    async update(id, dto) {
        const unit = await this.findOne(id);
        if (dto.name && dto.name !== unit.name) {
            const existing = await this.unitsRepo.findOne({
                where: { name: dto.name },
            });
            if (existing)
                throw new common_1.BadRequestException(`Unit '${dto.name}' already exists`);
        }
        Object.assign(unit, dto);
        return this.unitsRepo.save(unit);
    }
    async remove(id) {
        const unit = await this.findOne(id);
        await this.unitsRepo.remove(unit);
        return null;
    }
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UnitEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UnitsService);
//# sourceMappingURL=units.service.js.map