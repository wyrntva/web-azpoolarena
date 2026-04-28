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
exports.TournamentSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let TournamentSettingsService = class TournamentSettingsService {
    rankRepo;
    roundRepo;
    ruleRepo;
    constructor(rankRepo, roundRepo, ruleRepo) {
        this.rankRepo = rankRepo;
        this.roundRepo = roundRepo;
        this.ruleRepo = ruleRepo;
    }
    async getRanks() {
        return this.rankRepo.find({ order: { order: 'ASC' } });
    }
    async getRank(id) {
        const rank = await this.rankRepo.findOne({ where: { id } });
        if (!rank)
            throw new common_1.NotFoundException('Rank not found');
        return rank;
    }
    async createRank(data) {
        return this.rankRepo.save(this.rankRepo.create(data));
    }
    async updateRank(id, data) {
        const rank = await this.getRank(id);
        Object.assign(rank, data);
        return this.rankRepo.save(rank);
    }
    async deleteRank(id) {
        const rank = await this.getRank(id);
        await this.rankRepo.remove(rank);
    }
    async getRounds() {
        return this.roundRepo.find({ order: { order: 'ASC' } });
    }
    async getRound(id) {
        const round = await this.roundRepo.findOne({ where: { id } });
        if (!round)
            throw new common_1.NotFoundException('Round not found');
        return round;
    }
    async createRound(data) {
        return this.roundRepo.save(this.roundRepo.create(data));
    }
    async updateRound(id, data) {
        const round = await this.getRound(id);
        Object.assign(round, data);
        return this.roundRepo.save(round);
    }
    async deleteRound(id) {
        const round = await this.getRound(id);
        await this.roundRepo.remove(round);
    }
    async getScoringRules() {
        return this.ruleRepo.find({ order: { position: 'ASC' } });
    }
    async getScoringRule(id) {
        const rule = await this.ruleRepo.findOne({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('Rule not found');
        return rule;
    }
    async createScoringRule(data) {
        return this.ruleRepo.save(this.ruleRepo.create(data));
    }
    async updateScoringRule(id, data) {
        const rule = await this.getScoringRule(id);
        Object.assign(rule, data);
        return this.ruleRepo.save(rule);
    }
    async deleteScoringRule(id) {
        const rule = await this.getScoringRule(id);
        await this.ruleRepo.remove(rule);
    }
};
exports.TournamentSettingsService = TournamentSettingsService;
exports.TournamentSettingsService = TournamentSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TournamentRankEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TournamentRoundEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.ScoringRuleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TournamentSettingsService);
//# sourceMappingURL=tournament-settings.service.js.map