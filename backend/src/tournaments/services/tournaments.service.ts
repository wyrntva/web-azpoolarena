import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import {
  TournamentEntity,
  TournamentMatchEntity,
  TournamentRegistrationEntity,
  TournamentMatchStatus,
} from '../entities';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  CreateMatchDto,
  UpdateMatchDto,
} from '../dto/tournaments.dto';
import { UserEntity } from '../../users/entities/user.entity';

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

  private mapTournament(t: TournamentEntity) {
    if (!t) return t;

    let sponsor_logos = [];
    if (t.sponsor_logos) {
      try {
        sponsor_logos = JSON.parse(t.sponsor_logos);
      } catch (e) {
        sponsor_logos = [];
      }
    }

    let ranks = [];
    if (t.ranks) {
      try {
        ranks = JSON.parse(t.ranks);
      } catch (e) {
        ranks = [];
      }
    }

    return {
      ...t,
      sponsor_logos,
      ranks,
    };
  }

  async findAll(skip = 0, limit = 50) {
    const qb = this.tourRepo
      .createQueryBuilder('t')
      .addSelect(
        (qb2) =>
          qb2
            .select('COUNT(*)')
            .from(TournamentRegistrationEntity, 'r')
            .where('r.tournament_id = t.id'),
        'registration_count',
      )
      .skip(skip)
      .take(limit)
      .orderBy('t.created_at', 'DESC');

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await this.tourRepo.count();
    const data = entities.map((t, idx) => ({
      ...this.mapTournament(t),
      registration_count: parseInt(raw[idx]?.registration_count ?? '0', 10),
    }));
    return [data, total];
  }

  async create(dto: CreateTournamentDto) {
    const { sponsor_logos, ranks, ...rest } = dto;
    const entity = new TournamentEntity();
    Object.assign(entity, rest);
    if (sponsor_logos !== undefined) entity.sponsor_logos = JSON.stringify(sponsor_logos);
    if (ranks !== undefined) entity.ranks = JSON.stringify(ranks);
    const saved = await this.tourRepo.save(entity);
    return this.mapTournament(saved);
  }

  async update(id: number, dto: UpdateTournamentDto) {
    const tour = await this.tourRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tournament not found');

    const { sponsor_logos, ranks, ...rest } = dto;
    const updates: any = { ...rest };
    if (sponsor_logos !== undefined) updates.sponsor_logos = JSON.stringify(sponsor_logos);
    if (ranks !== undefined) updates.ranks = JSON.stringify(ranks);

    Object.assign(tour, updates);
    await this.tourRepo.save(tour);
    return this.mapTournament(tour);
  }

  async delete(id: number) {
    const tour = await this.tourRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tournament not found');
    // Delete child records first to avoid FK constraint violations
    await this.matchRepo.delete({ tournament_id: id });
    await this.regRepo.delete({ tournament_id: id });
    await this.tourRepo.remove(tour);
  }

  private deleteLocalFile(url: string | null | undefined) {
    if (!url || !url.startsWith('/uploads/')) return;
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
    const relativePath = url.replace(/^\/uploads\//, '');
    const fullPath = path.join(uploadsDir, relativePath);
    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch { /* ignore */ }
  }

  async removeImage(id: number, imageType: string, sponsorIndex?: number) {
    const tour = await this.tourRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tournament not found');

    if (imageType === 'banner') {
      this.deleteLocalFile(tour.banner);
      (tour as any).banner = null;
    } else if (imageType === 'organizer_logo') {
      this.deleteLocalFile(tour.organizer_logo);
      (tour as any).organizer_logo = null;
    } else if (imageType === 'sponsor_logo') {
      let logos: string[] = [];
      try { logos = JSON.parse(tour.sponsor_logos || '[]'); } catch { logos = []; }
      if (sponsorIndex !== undefined && sponsorIndex >= 0 && sponsorIndex < logos.length) {
        this.deleteLocalFile(logos[sponsorIndex]);
        logos.splice(sponsorIndex, 1);
      }
      tour.sponsor_logos = JSON.stringify(logos);
    }

    await this.tourRepo.save(tour);
    return this.mapTournament(tour);
  }

  async findPublic(skip = 0, limit = 50) {
    const qb = this.tourRepo
      .createQueryBuilder('t')
      .addSelect(
        (qb2) =>
          qb2
            .select('COUNT(*)')
            .from(TournamentRegistrationEntity, 'r')
            .where('r.tournament_id = t.id'),
        'registration_count',
      )
      .where('t.display = :display', { display: 'public' })
      .skip(skip)
      .take(limit)
      .orderBy('t.created_at', 'DESC');

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await this.tourRepo
      .createQueryBuilder('t')
      .where('t.display = :display', { display: 'public' })
      .getCount();
    const data = entities.map((t, idx) => ({
      ...this.mapTournament(t),
      registration_count: parseInt(raw[idx]?.registration_count ?? '0', 10),
    }));
    return [data, total];
  }

  async findOne(id: number) {
    const tour = await this.tourRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tournament not found');
    return this.mapTournament(tour);
  }

  async findBySlug(slug: string) {
    const tour = await this.tourRepo.findOne({ where: { slug } });
    if (!tour) throw new NotFoundException('Tournament not found');
    return this.mapTournament(tour);
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
    const regs = await this.regRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.tournament_id = :id', { id: tournamentId })
      .orderBy('r.registered_at', 'ASC')
      .getMany();

    return regs.map((r) => ({
      id: r.user?.id ?? r.user_id,
      full_name: r.user?.full_name || '',
      phone_number: r.user?.phone_number || '',
      rank: r.user?.rank || null,
      avatar_url: r.user?.avatar_url || null,
      registered_at: r.registered_at ? (r.registered_at as Date).toISOString() : null,
    }));
  }

  async getRegistrationsBySlug(slug: string) {
    const tour = await this.tourRepo.findOne({ where: { slug } });
    if (!tour) throw new NotFoundException('Tournament not found');
    return this.getRegistrations(tour.id);
  }

  async getMatchesBySlug(slug: string) {
    const tour = await this.tourRepo.findOne({ where: { slug } });
    if (!tour) throw new NotFoundException('Tournament not found');
    return this.getMatches(tour.id);
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

  async getEligibleUsers(tournamentId: number, search?: string) {
    const regs = await this.regRepo.find({
      where: { tournament_id: tournamentId },
      select: ['user_id'],
    });
    const registeredUserIds = regs.map((r) => r.user_id);

    const qb = this.regRepo.manager
      .getRepository(UserEntity)
      .createQueryBuilder('u')
      .where('u.is_active = :isActive', { isActive: true });

    if (registeredUserIds.length > 0) {
      qb.andWhere('u.id NOT IN (:...ids)', { ids: registeredUserIds });
    }

    if (search) {
      qb.andWhere(
        '(u.full_name ILIKE :search OR u.phone_number ILIKE :search OR u.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.limit(50).getMany();
  }

  async registerPlayer(tournamentId: number, userId: number) {
    const existing = await this.regRepo.findOne({
      where: { tournament_id: tournamentId, user_id: userId },
    });
    if (existing) {
      return existing;
    }

    const reg = this.regRepo.create({
      tournament_id: tournamentId,
      user_id: userId,
    });
    await this.regRepo.save(reg);

    return this.regRepo.findOne({
      where: { id: reg.id },
      relations: ['user'],
    });
  }

  async unregisterPlayer(tournamentId: number, userId: number) {
    const reg = await this.regRepo.findOne({
      where: { tournament_id: tournamentId, user_id: userId },
    });
    if (!reg) {
      throw new NotFoundException('Registration not found');
    }
    await this.regRepo.remove(reg);
  }

  async upsertMatch(tournamentId: number, matchNo: number, dto: UpdateMatchDto) {
    let match = await this.matchRepo.findOne({
      where: { tournament_id: tournamentId, match_no: matchNo },
    });

    if (!match) {
      match = this.matchRepo.create({
        tournament_id: tournamentId,
        match_no: matchNo,
        bracket: dto.bracket || 'knockout',
        round: dto.round || 1,
      });
    }

    Object.assign(match, dto);

    if (match.winner_id && match.status !== TournamentMatchStatus.COMPLETED) {
      match.status = TournamentMatchStatus.COMPLETED;
    }

    await this.matchRepo.save(match);

    return this.matchRepo.findOne({
      where: { id: match.id },
      relations: ['player1', 'player2', 'winner'],
    });
  }
}
