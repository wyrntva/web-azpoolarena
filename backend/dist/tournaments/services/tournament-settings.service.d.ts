import { Repository } from 'typeorm';
import { TournamentRankEntity, TournamentRoundEntity, ScoringRuleEntity } from '../entities';
export declare class TournamentSettingsService {
    private readonly rankRepo;
    private readonly roundRepo;
    private readonly ruleRepo;
    constructor(rankRepo: Repository<TournamentRankEntity>, roundRepo: Repository<TournamentRoundEntity>, ruleRepo: Repository<ScoringRuleEntity>);
    getRanks(): Promise<TournamentRankEntity[]>;
    getRank(id: number): Promise<TournamentRankEntity>;
    createRank(data: any): Promise<TournamentRankEntity[]>;
    updateRank(id: number, data: any): Promise<TournamentRankEntity>;
    deleteRank(id: number): Promise<void>;
    getRounds(): Promise<TournamentRoundEntity[]>;
    getRound(id: number): Promise<TournamentRoundEntity>;
    createRound(data: any): Promise<TournamentRoundEntity[]>;
    updateRound(id: number, data: any): Promise<TournamentRoundEntity>;
    deleteRound(id: number): Promise<void>;
    getScoringRules(): Promise<ScoringRuleEntity[]>;
    getScoringRule(id: number): Promise<ScoringRuleEntity>;
    createScoringRule(data: any): Promise<ScoringRuleEntity[]>;
    updateScoringRule(id: number, data: any): Promise<ScoringRuleEntity>;
    deleteScoringRule(id: number): Promise<void>;
}
