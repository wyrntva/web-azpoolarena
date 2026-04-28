"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolArenaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const bcrypt = __importStar(require("bcryptjs"));
let PoolArenaService = class PoolArenaService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const existing = await this.repo.findOne({
            where: { phone_number: dto.phone_number },
        });
        if (existing)
            throw new common_1.BadRequestException('Phone number already registered');
        const hashedPassword = await bcrypt.hash(dto.hashed_password || '123456', 10);
        const user = this.repo.create({
            ...dto,
            hashed_password: hashedPassword,
            rank: 'K',
        });
        return this.repo.save(user);
    }
    async findAll(skip = 0, limit = 50, search) {
        const qb = this.repo
            .createQueryBuilder('u')
            .skip(skip)
            .take(limit)
            .orderBy('u.points', 'DESC')
            .addOrderBy('u.created_at', 'DESC');
        if (search) {
            qb.where('u.full_name ILIKE :s OR u.phone_number ILIKE :s', {
                s: `%${search}%`,
            });
        }
        return qb.getManyAndCount();
    }
    async findOne(id) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('PoolArena user not found');
        return user;
    }
    async update(id, dto) {
        const user = await this.findOne(id);
        Object.assign(user, dto);
        return this.repo.save(user);
    }
    async getRankings(limit = 100) {
        return this.repo
            .createQueryBuilder('u')
            .where('u.is_active = true')
            .select([
            'u.id',
            'u.full_name',
            'u.avatar_url',
            'u.points',
            'u.rank',
            'u.wins',
            'u.losses',
            'u.total_games',
        ])
            .orderBy('u.points', 'DESC')
            .take(limit)
            .getMany();
    }
};
exports.PoolArenaService = PoolArenaService;
exports.PoolArenaService = PoolArenaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PoolArenaUserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PoolArenaService);
//# sourceMappingURL=pool-arena.service.js.map