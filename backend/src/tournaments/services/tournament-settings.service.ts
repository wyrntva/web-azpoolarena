import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import {
  TournamentRankEntity,
  TournamentRoundEntity,
  ScoringRuleEntity,
  CoefficientEntity,
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
    @InjectRepository(CoefficientEntity)
    private readonly coefficientRepo: Repository<CoefficientEntity>,
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

  // Coefficients
  async getCoefficients() {
    return this.coefficientRepo.find({ order: { order: 'ASC' } });
  }
  async getCoefficient(id: number) {
    const item = await this.coefficientRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Coefficient not found');
    return item;
  }
  async createCoefficient(data: any) {
    return this.coefficientRepo.save(this.coefficientRepo.create(data));
  }
  async updateCoefficient(id: number, data: any) {
    const item = await this.getCoefficient(id);
    Object.assign(item, data);
    return this.coefficientRepo.save(item);
  }
  async deleteCoefficient(id: number) {
    const item = await this.getCoefficient(id);
    await this.coefficientRepo.remove(item);
  }

  private getMatrixFilePath() {
    return path.join(__dirname, '..', '..', '..', 'uploads', 'rating_matrix.json');
  }

  async getRatingMatrix() {
    const filePath = this.getMatrixFilePath();
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      } catch {
        // Fallback to default matrix if file is corrupt
      }
    }

    // Default matrix as specified by user requirements
    return [
      { diff: 0, winFav: 15, winUnd: 15, loseFav: -15, loseUnd: -15 },
      { diff: 1, winFav: 10, winUnd: 25, loseFav: -25, loseUnd: -10 },
      { diff: 2, winFav: 5, winUnd: 30, loseFav: -30, loseUnd: -5 },
    ];
  }

  async saveRatingMatrix(matrix: any[]) {
    const filePath = this.getMatrixFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(matrix, null, 2), 'utf8');
    return { success: true };
  }

  // Table fee
  private getTableFeeFilePath() {
    return path.join(__dirname, '..', '..', '..', 'uploads', 'table_fee.json');
  }

  async getTableFee(): Promise<{ price: number; per_minutes: number; surcharge: number }> {
    const filePath = this.getTableFeeFilePath();
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        return { price: data.price ?? 0, per_minutes: data.per_minutes ?? 1, surcharge: data.surcharge ?? 0 };
      } catch {
        // fallback
      }
    }
    return { price: 0, per_minutes: 1, surcharge: 0 };
  }

  async saveTableFee(data: { price: number; per_minutes: number; surcharge?: number }): Promise<{ success: boolean }> {
    const filePath = this.getTableFeeFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  }
}
