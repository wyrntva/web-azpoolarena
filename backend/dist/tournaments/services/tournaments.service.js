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
exports.TournamentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let TournamentsService = class TournamentsService {
    tourRepo;
    matchRepo;
    regRepo;
    constructor(tourRepo, matchRepo, regRepo) {
        this.tourRepo = tourRepo;
        this.matchRepo = matchRepo;
        this.regRepo = regRepo;
    }
    async findAll(skip = 0, limit = 50) {
        const qb = this.tourRepo
            .createQueryBuilder('t')
            .skip(skip)
            .take(limit)
            .orderBy('t.created_at', 'DESC');
        return qb.getManyAndCount();
    }
    async findOne(id) {
        const tour = await this.tourRepo.findOne({ where: { id } });
        if (!tour)
            throw new common_1.NotFoundException('Tournament not found');
        return tour;
    }
    async findBySlug(slug) {
        const tour = await this.tourRepo.findOne({ where: { slug } });
        if (!tour)
            throw new common_1.NotFoundException('Tournament not found');
        return tour;
    }
    async getMatches(tournamentId) {
        return this.matchRepo
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.player1', 'player1')
            .leftJoinAndSelect('m.player2', 'player2')
            .leftJoinAndSelect('m.winner', 'winner')
            .where('m.tournament_id = :id', { id: tournamentId })
            .getMany();
    }
    async updateMatch(matchId, dto) {
        const match = await this.matchRepo.findOne({
            where: { id: matchId },
            relations: ['player1', 'player2'],
        });
        if (!match)
            throw new common_1.NotFoundException('Match not found');
        Object.assign(match, dto);
        if (match.winner_id && match.status !== entities_1.TournamentMatchStatus.COMPLETED) {
            match.status = entities_1.TournamentMatchStatus.COMPLETED;
        }
        return this.matchRepo.save(match);
    }
    async generateMatches(tournamentId, matchList) {
        const tournament = await this.findOne(tournamentId);
        await this.matchRepo.delete({ tournament_id: tournamentId });
        const matchesToSave = matchList.map((m) => this.matchRepo.create({
            ...m,
            tournament_id: tournamentId,
        }));
        return this.matchRepo.save(matchesToSave);
    }
    async getRegistrations(tournamentId) {
        return this.regRepo
            .createQueryBuilder('r')
            .leftJoinAndSelect('r.user', 'user')
            .where('r.tournament_id = :id', { id: tournamentId })
            .getMany();
    }
    async getActiveMatchForDevice(tableName) {
        if (!tableName)
            return null;
        const match = await this.matchRepo
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.tournament', 't')
            .leftJoinAndSelect('m.player1', 'p1')
            .leftJoinAndSelect('m.player2', 'p2')
            .where('m.table_no = :tableName', { tableName })
            .andWhere('m.status IN (:...statuses)', {
            statuses: [entities_1.TournamentMatchStatus.UPCOMING, entities_1.TournamentMatchStatus.ONGOING]
        })
            .orderBy('m.match_time', 'ASC')
            .getOne();
        if (!match)
            return null;
        return {
            id: match.id,
            tournament_id: match.tournament_id,
            tournament_name: match.tournament?.name || '',
            banner: match.tournament?.banner || '',
            sponsor_logos: match.tournament?.sponsor_logos || '',
            match_no: match.match_no,
            round: match.round,
            status: match.status,
            player1_id: match.player1_id,
            player1_name: match.player1?.full_name || 'Waiting...',
            player1_avatar: match.player1?.avatar_url || '',
            player1_score: match.player1_score,
            player1_check_in: match.player1_check_in,
            player2_id: match.player2_id,
            player2_name: match.player2?.full_name || 'Waiting...',
            player2_avatar: match.player2?.avatar_url || '',
            player2_score: match.player2_score,
            player2_check_in: match.player2_check_in,
            winner_id: match.winner_id,
        };
    }
    async updateDeviceMatchScore(matchId, dto) {
        const match = await this.matchRepo.findOne({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException('Match not found');
        if (dto.player1_score !== undefined)
            match.player1_score = dto.player1_score;
        if (dto.player2_score !== undefined)
            match.player2_score = dto.player2_score;
        if (dto.status !== undefined)
            match.status = dto.status;
        if (dto.winner_id !== undefined)
            match.winner_id = dto.winner_id;
        if (match.winner_id && match.status !== entities_1.TournamentMatchStatus.COMPLETED) {
            match.status = entities_1.TournamentMatchStatus.COMPLETED;
        }
        await this.matchRepo.save(match);
        return { success: true };
    }
    async updateDeviceMatchCheckIn(matchId, dto) {
        const match = await this.matchRepo.findOne({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException('Match not found');
        let updated = false;
        if (dto.player1_check_in) {
            match.player1_check_in = dto.player1_check_in;
            updated = true;
        }
        if (dto.player2_check_in) {
            match.player2_check_in = dto.player2_check_in;
            updated = true;
        }
        if (match.player1_check_in === 'confirmed' &&
            match.player2_check_in === 'confirmed' &&
            match.status === entities_1.TournamentMatchStatus.UPCOMING) {
            match.status = entities_1.TournamentMatchStatus.ONGOING;
            updated = true;
        }
        if (updated)
            await this.matchRepo.save(match);
        return { success: true };
    }
};
exports.TournamentsService = TournamentsService;
exports.TournamentsService = TournamentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TournamentEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TournamentMatchEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TournamentRegistrationEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TournamentsService);
//# sourceMappingURL=tournaments.service.js.map