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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("../roles/entities/role.entity");
const auth_service_1 = require("../auth/auth.service");
let UsersService = class UsersService {
    userRepo;
    roleRepo;
    authService;
    constructor(userRepo, roleRepo, authService) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.authService = authService;
    }
    parseUserPermissions(user) {
        return this.authService.parseUserPermissions(user);
    }
    async create(dto) {
        const existing = await this.userRepo.findOne({
            where: { username: dto.username },
        });
        if (existing)
            throw new common_1.BadRequestException('Username already exists');
        if (dto.email) {
            const existingEmail = await this.userRepo.findOne({
                where: { email: dto.email },
            });
            if (existingEmail)
                throw new common_1.BadRequestException('Email already exists');
        }
        const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const user = this.userRepo.create({
            username: dto.username,
            email: dto.email,
            full_name: dto.full_name,
            hashed_password: await this.authService.hashPassword(dto.password),
            role_id: dto.role_id,
            pin: dto.pin,
            salary_type: dto.salary_type,
            hourly_rate: dto.hourly_rate,
            fixed_salary: dto.fixed_salary,
        });
        const saved = await this.userRepo.save(user);
        const full = await this.userRepo.findOne({
            where: { id: saved.id },
            relations: ['role'],
        });
        return this.parseUserPermissions(full);
    }
    async findAll(skip = 0, limit = 100) {
        const users = await this.userRepo.find({
            relations: ['role'],
            order: { display_order: { direction: 'ASC', nulls: 'LAST' }, id: 'ASC' },
            skip,
            take: limit,
        });
        return users.map((u) => this.parseUserPermissions(u));
    }
    async findOne(id) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['role'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.parseUserPermissions(user);
    }
    async update(id, dto) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['role'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (dto.email) {
            const existing = await this.userRepo.findOne({
                where: { email: dto.email },
            });
            if (existing && existing.id !== id)
                throw new common_1.BadRequestException('Email already exists');
        }
        if (dto.password) {
            dto.hashed_password = await this.authService.hashPassword(dto.password);
            delete dto.password;
        }
        if (dto.role_id) {
            const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
            if (!role)
                throw new common_1.NotFoundException('Role not found');
        }
        Object.assign(user, dto);
        const saved = await this.userRepo.save(user);
        const full = await this.userRepo.findOne({
            where: { id: saved.id },
            relations: ['role'],
        });
        return this.parseUserPermissions(full);
    }
    async remove(id, currentUserId) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.id === currentUserId)
            throw new common_1.BadRequestException('Cannot delete your own account');
        await this.userRepo.remove(user);
    }
    async updateDisplayOrder(orders) {
        for (const item of orders) {
            await this.userRepo.update(item.user_id, {
                display_order: item.display_order,
            });
        }
        return { status: 'success', message: 'Display order updated successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.RoleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService])
], UsersService);
//# sourceMappingURL=users.service.js.map