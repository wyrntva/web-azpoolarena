import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TournamentRankEntity,
  TournamentRoundEntity,
  ScoringRuleEntity,
} from '../entities';

@Injectable()
export class TournamentSettingsService {
  constructor(
    @InjectRepository(TournamentRankEntity)
    private readonly rankRepo: Repository<TournamentRankEntity>,
    @InjectRepository(TournamentRoundEntity)
    private readonly roundRepo: Repository<TournamentRoundEntity>,
    @InjectRepository(ScoringRuleEntity)
    private readonly ruleRepo: Repository<ScoringRuleEntity>,
  ) {}

  // Ranks
  async getRanks() {
    return this.rankRepo.find({ order: { order: 'ASC' } });
  }
  async getRank(id: number) {
    const rank = await this.rankRepo.findOne({ where: { id } });
    if (!rank) throw new NotFoundException('Rank not found');
    return rank;
  }
  async createRank(data: any) {
    return this.rankRepo.save(this.rankRepo.create(data));
  }
  async updateRank(id: number, data: any) {
    const rank = await this.getRank(id);
    Object.assign(rank, data);
    return this.rankRepo.save(rank);
  }
  async deleteRank(id: number) {
    const rank = await this.getRank(id);
    await this.rankRepo.remove(rank);
  }

  // Rounds
  async getRounds() {
    return this.roundRepo.find({ order: { order: 'ASC' } });
  }
  async getRound(id: number) {
    const round = await this.roundRepo.findOne({ where: { id } });
    if (!round) throw new NotFoundException('Round not found');
    return round;
  }
  async createRound(data: any) {
    return this.roundRepo.save(this.roundRepo.create(data));
  }
  async updateRound(id: number, data: any) {
    const round = await this.getRound(id);
    Object.assign(round, data);
    return this.roundRepo.save(round);
  }
  async deleteRound(id: number) {
    const round = await this.getRound(id);
    await this.roundRepo.remove(round);
  }

  // Scoring Rules
  async getScoringRules() {
    return this.ruleRepo.find({ order: { position: 'ASC' } });
  }
  async getScoringRule(id: number) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }
  async createScoringRule(data: any) {
    return this.ruleRepo.save(this.ruleRepo.create(data));
  }
  async updateScoringRule(id: number, data: any) {
    const rule = await this.getScoringRule(id);
    Object.assign(rule, data);
    return this.ruleRepo.save(rule);
  }
  async deleteScoringRule(id: number) {
    const rule = await this.getScoringRule(id);
    await this.ruleRepo.remove(rule);
  }
}
