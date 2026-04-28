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
exports.RankingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../pool-arena/entities");
let RankingsService = class RankingsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getRankings(page = 1, limit = 20, rankId, gender, sort = '-points') {
        const qb = this.repo.createQueryBuilder('u').where('u.is_active = true');
        if (rankId && rankId !== 'all') {
            if (rankId === 'gplus') {
                qb.andWhere('u.rank = :r', { r: 'G+' });
            }
            else {
                qb.andWhere('u.rank = :r', { r: rankId });
            }
        }
        if (gender &&
            (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female')) {
            qb.andWhere('u.gender = :g', { g: gender.toLowerCase() });
        }
        if (sort === '-points') {
            qb.orderBy('u.points', 'DESC').addOrderBy('u.id', 'ASC');
        }
        else if (sort === 'points') {
            qb.orderBy('u.points', 'ASC').addOrderBy('u.id', 'ASC');
        }
        else {
            qb.orderBy('u.points', 'DESC');
        }
        const [users, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        const data = users.map((user) => ({
            id: String(user.id),
            points: user.points || 0,
            rank_id: user.rank,
            rank_name: user.rank || 'N/A',
            player: {
                id: String(user.id),
                name: user.full_name,
                avatar_url: user.avatar_url || '',
            },
        }));
        return {
            data,
            meta: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total,
                per_page: limit,
            },
        };
    }
};
exports.RankingsService = RankingsService;
exports.RankingsService = RankingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PoolArenaUserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RankingsService);
//# sourceMappingURL=rankings.service.js.map