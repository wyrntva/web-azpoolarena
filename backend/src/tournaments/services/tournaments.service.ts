import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TournamentEntity,
  TournamentMatchEntity,
  TournamentRegistrationEntity,
  TournamentMatchStatus,
} from '../entities';
import {
  UpdateTournamentDto,
  CreateMatchDto,
  UpdateMatchDto,
} from '../dto/tournaments.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(TournamentEntity)
    private readonly tourRepo: Repository<TournamentEntity>,
    @InjectRepository(TournamentMatchEntity)
    private readonly matchRepo: Repository<TournamentMatchEntity>,
    @InjectRepository(TournamentRegistrationEntity)
    private readonly regRepo: Repository<TournamentRegistrationEntity>,
  ) {}

  async findAll(skip = 0, limit = 50) {
    const qb = this.tourRepo
      .createQueryBuilder('t')
      .skip(skip)
      .take(limit)
      .orderBy('t.created_at', 'DESC');
    return qb.getManyAndCount();
  }

  async findPublic(skip = 0, limit = 50) {
    const qb = this.tourRepo
      .createQueryBuilder('t')
      .where('t.display = :display', { display: 'public' })
      .skip(skip)
      .take(limit)
      .orderBy('t.created_at', 'DESC');
    return qb.getManyAndCount();
  }

  async findOne(id: number) {
    const tour = await this.tourRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tournament not found');
    return tour;
  }

  async findBySlug(slug: string) {
    const tour = await this.tourRepo.findOne({ where: { slug } });
    if (!tour) throw new NotFoundException('Tournament not found');
    return tour;
  }

  async getMatches(tournamentId: number) {
    return this.matchRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.player1', 'player1')
      .leftJoinAndSelect('m.player2', 'player2')
      .leftJoinAndSelect('m.winner', 'winner')
      .where('m.tournament_id = :id', { id: tournamentId })
      .getMany();
  }

  async updateMatch(matchId: number, dto: UpdateMatchDto) {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: ['player1', 'player2'],
    });
    if (!match) throw new NotFoundException('Match not found');

    Object.assign(match, dto);

    // If winner is assigned and status is not COMPLETED, mark it as COMPLETED
    if (match.winner_id && match.status !== TournamentMatchStatus.COMPLETED) {
      match.status = TournamentMatchStatus.COMPLETED;
    }

    return this.matchRepo.save(match);
  }

  async generateMatches(tournamentId: number, matchList: CreateMatchDto[]) {
    // A simplified match generator for initial setup
    const tournament = await this.findOne(tournamentId);

    // Delete existing matches
    await this.matchRepo.delete({ tournament_id: tournamentId });

    // Create new ones
    const matchesToSave = matchList.map((m) =>
      this.matchRepo.create({
        ...m,
        tournament_id: tournamentId,
      }),
    );
    return this.matchRepo.save(matchesToSave);
  }

  async getRegistrations(tournamentId: number) {
    return this.regRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.tournament_id = :id', { id: tournamentId })
      .getMany();
  }

  // ==== DEVICE API ==== //

  async getActiveMatchForDevice(tableName: string) {
    if (!tableName) return null;
    const match = await this.matchRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.tournament', 't')
      .leftJoinAndSelect('m.player1', 'p1')
      .leftJoinAndSelect('m.player2', 'p2')
      .where('m.table_no = :tableName', { tableName })
      .andWhere('m.status IN (:...statuses)', { 
         statuses: [TournamentMatchStatus.UPCOMING, TournamentMatchStatus.ONGOING] 
      })
      .orderBy('m.match_time', 'ASC')
      .getOne();
      
    if (!match) return null;

    // Formatting for the exact keys QML expects payload
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

  async updateDeviceMatchScore(matchId: number, dto: any) {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    if (dto.player1_score !== undefined) match.player1_score = dto.player1_score;
    if (dto.player2_score !== undefined) match.player2_score = dto.player2_score;
    if (dto.status !== undefined) match.status = dto.status;
    if (dto.winner_id !== undefined) match.winner_id = dto.winner_id;

    if (match.winner_id && match.status !== TournamentMatchStatus.COMPLETED) {
      match.status = TournamentMatchStatus.COMPLETED;
    }

    await this.matchRepo.save(match);
    return { success: true };
  }

  async updateDeviceMatchCheckIn(matchId: number, dto: any) {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    let updated = false;
    if (dto.player1_check_in) {
      match.player1_check_in = dto.player1_check_in;
      updated = true;
    }
    if (dto.player2_check_in) {
      match.player2_check_in = dto.player2_check_in;
      updated = true;
    }
    
    // Auto-start match if both checked in
    if (
      match.player1_check_in === 'confirmed' &&
      match.player2_check_in === 'confirmed' &&
      match.status === TournamentMatchStatus.UPCOMING
    ) {
      match.status = TournamentMatchStatus.ONGOING;
      updated = true;
    }

    if (updated) await this.matchRepo.save(match);
    return { success: true };
  }
}
