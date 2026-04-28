import { TournamentSettingsService } from '../services/tournament-settings.service';
export declare class TournamentSettingsController {
    private readonly service;
    constructor(service: TournamentSettingsService);
    getRanks(): Promise<import("../entities").TournamentRankEntity[]>;
    getRank(id: number): Promise<import("../entities").TournamentRankEntity>;
    createRank(dto: any): Promise<import("../entities").TournamentRankEntity[]>;
    updateRank(id: number, dto: any): Promise<import("../entities").TournamentRankEntity>;
    deleteRank(id: number): Promise<void>;
    getRounds(): Promise<import("../entities").TournamentRoundEntity[]>;
    getRound(id: number): Promise<import("../entities").TournamentRoundEntity>;
    createRound(dto: any): Promise<import("../entities").TournamentRoundEntity[]>;
    updateRound(id: number, dto: any): Promise<import("../entities").TournamentRoundEntity>;
    deleteRound(id: number): Promise<void>;
    getScoringRules(): Promise<import("../entities").ScoringRuleEntity[]>;
    getScoringRule(id: number): Promise<import("../entities").ScoringRuleEntity>;
    createScoringRule(dto: any): Promise<import("../entities").ScoringRuleEntity[]>;
    updateScoringRule(id: number, dto: any): Promise<import("../entities").ScoringRuleEntity>;
    deleteScoringRule(id: number): Promise<void>;
}
