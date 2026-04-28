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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../entities/role.entity");
let RolesService = class RolesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async findAll() {
        const roles = await this.repo.find();
        return roles.map(r => ({
            ...r,
            permissions: r.permissions ? JSON.parse(r.permissions) : []
        }));
    }
    async findOne(id) {
        const r = await this.repo.findOne({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException('Role not found');
        return {
            ...r,
            permissions: r.permissions ? JSON.parse(r.permissions) : []
        };
    }
    async create(data) {
        const exists = await this.repo.findOne({ where: { name: data.name } });
        if (exists)
            throw new common_1.BadRequestException('Role name already exists');
        const role = this.repo.create({
            name: data.name,
            description: data.description || '',
            permissions: JSON.stringify(data.permissions || []),
            requires_timekeeping: data.requires_timekeeping ?? false,
            is_active: data.is_active ?? true,
        });
        const saved = await this.repo.save(role);
        return this.findOne(saved.id);
    }
    async update(id, data) {
        const role = await this.repo.findOne({ where: { id } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        if (data.name && data.name !== role.name) {
            const exists = await this.repo.findOne({ where: { name: data.name } });
            if (exists)
                throw new common_1.BadRequestException('Role name already exists');
            role.name = data.name;
        }
        if (data.description !== undefined)
            role.description = data.description;
        if (data.permissions !== undefined)
            role.permissions = JSON.stringify(data.permissions);
        if (data.requires_timekeeping !== undefined)
            role.requires_timekeeping = data.requires_timekeeping;
        if (data.is_active !== undefined)
            role.is_active = data.is_active;
        await this.repo.save(role);
        return this.findOne(role.id);
    }
    async remove(id) {
        const role = await this.repo.findOne({ where: { id } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        if (role.is_system)
            throw new common_1.BadRequestException('Cannot delete system role');
        await this.repo.remove(role);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.RoleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map