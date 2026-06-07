import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Subject } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import {
  TournamentEntity,
  TournamentMatchEntity,
  TournamentRegistrationEntity,
  TournamentMatchStatus,
  TournamentMatchBracket,
  TournamentRankEntity,
  PaymentCodeEntity,
} from '../entities';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  CreateMatchDto,
  UpdateMatchDto,
} from '../dto/tournaments.dto';
import { UserEntity } from '../../users/entities/user.entity';
import { TableEntity } from '../../areas/entities/area.entity';

@Injectable()
export class TournamentsService {
  private readonly matchUpdates$ = new Subject<{ tournamentId: number; match: any }>();
  private readonly paymentSuccess$ = new Subject<{ tournamentId: number; userId: number }>();

  getMatchUpdatesStream() {
    return this.matchUpdates$.asObservable();
  }

  getPaymentStream() {
    return this.paymentSuccess$.asObservable();
  }

  async emitMatchUpdate(matchId: number) {
    const reloaded = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: ['player1', 'player2', 'winner'],
    });
    if (reloaded) {
      this.matchUpdates$.next({ tournamentId: reloaded.tournament_id, match: reloaded });
    }
  }

  constructor(
    @InjectRepository(TournamentEntity)
    private readonly tourRepo: Repository<TournamentEntity>,
    @InjectRepository(TournamentMatchEntity)
    private readonly matchRepo: Repository<TournamentMatchEntity>,
    @InjectRepository(TournamentRegistrationEntity)
    private readonly regRepo: Repository<TournamentRegistrationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(TournamentRankEntity)
    private readonly rankRepo: Repository<TournamentRankEntity>,
    @InjectRepository(PaymentCodeEntity)
    private readonly paymentCodeRepo: Repository<PaymentCodeEntity>,
    @InjectRepository(TableEntity)
    private readonly tableRepo: Repository<TableEntity>,
  ) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let random = '';
    for (let i = 0; i < 10; i++) {
      random += chars[Math.floor(Math.random() * chars.length)];
    }
    return `POOLARENA${random}`;
  }

  async createPaymentCode(tournamentId: number, userId: number): Promise<string> {
    const existing = await this.regRepo.findOne({
      where: { tournament_id: tournamentId, user_id: userId },
    });
    if (existing) {
      throw new BadRequestException('User already registered for this tournament');
    }

    const tournament = await this.tourRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let allowedRanks: string[] = [];
    if (tournament.ranks) {
      try {
        allowedRanks = JSON.parse(tournament.ranks);
      } catch (e) {
        allowedRanks = [];
      }
    }

    if (Array.isArray(allowedRanks) && allowedRanks.length > 0) {
      const userRank = user.rank ? user.rank.toUpperCase() : '';
      const isAllowed = allowedRanks.map((r) => r.toUpperCase()).includes(userRank);
      if (!isAllowed) {
        throw new BadRequestException(
          `Hạng của bạn (${user.rank || 'N/A'}) không được tham gia giải đấu này (Chỉ nhận các hạng: ${allowedRanks.join(', ')})`,
        );
      }
    }

    // Reuse pending code if exists (user reopens modal)
    const pending = await this.paymentCodeRepo.findOne({
      where: { tournament_id: tournamentId, user_id: userId, used: false },
    });
    if (pending) return pending.code;

    let code: string;
    do {
      code = this.generateCode();
    } while (await this.paymentCodeRepo.findOne({ where: { code } }));

    const record = this.paymentCodeRepo.create({
      code,
      tournament_id: tournamentId,
      user_id: userId,
      used: false,
    });
    await this.paymentCodeRepo.save(record);
    return code;
  }

  async redeemPaymentCode(code: string, paidAmount: number): Promise<void> {
    const record = await this.paymentCodeRepo.findOne({ where: { code, used: false } });
    if (!record) {
      throw new NotFoundException(`Payment code "${code}" not found or already used`);
    }

    await this.registerPlayer(record.tournament_id, record.user_id, paidAmount);

    record.used = true;
    await this.paymentCodeRepo.save(record);

    this.paymentSuccess$.next({ tournamentId: record.tournament_id, userId: record.user_id });
  }

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

    let enabled_tables = null;
    if (t.enabled_tables) {
      try {
        enabled_tables = JSON.parse(t.enabled_tables);
      } catch (e) {
        enabled_tables = null;
      }
    }

    let priority_tables = [];
    if (t.priority_tables) {
      try {
        priority_tables = JSON.parse(t.priority_tables);
      } catch (e) {
        priority_tables = [];
      }
    }

    return {
      ...t,
      sponsor_logos,
      ranks,
      enabled_tables,
      priority_tables,
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
    const { sponsor_logos, ranks, enabled_tables, priority_tables, ...rest } = dto;
    const entity = new TournamentEntity();
    Object.assign(entity, rest);
    if (sponsor_logos !== undefined) entity.sponsor_logos = JSON.stringify(sponsor_logos);
    if (ranks !== undefined) entity.ranks = JSON.stringify(ranks);
    if (enabled_tables !== undefined) entity.enabled_tables = enabled_tables ? JSON.stringify(enabled_tables) : null;
    if (priority_tables !== undefined) entity.priority_tables = priority_tables ? JSON.stringify(priority_tables) : null;
    const saved = await this.tourRepo.save(entity);
    return this.mapTournament(saved);
  }

  async update(id: number, dto: UpdateTournamentDto) {
    const tour = await this.tourRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tournament not found');

    const { sponsor_logos, ranks, enabled_tables, priority_tables, ...rest } = dto;
    const updates: any = { ...rest };
    if (sponsor_logos !== undefined) updates.sponsor_logos = JSON.stringify(sponsor_logos);
    if (ranks !== undefined) updates.ranks = JSON.stringify(ranks);
    if (enabled_tables !== undefined) updates.enabled_tables = enabled_tables ? JSON.stringify(enabled_tables) : null;
    if (priority_tables !== undefined) updates.priority_tables = priority_tables ? JSON.stringify(priority_tables) : null;

    const playerCountChanged =
      dto.number_of_players !== undefined &&
      dto.number_of_players !== tour.number_of_players;

    Object.assign(tour, updates);
    await this.tourRepo.save(tour);

    // When player count changes, delete all matches and re-generate bracket + re-seed players
    if (playerCountChanged) {
      await this.matchRepo.delete({ tournament_id: id });
      await this.autoGenerateRound1Matches(id);
      await this.assignAllRegisteredPlayersToRound1(id);
    }

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
    } else if (imageType === 'detail_logo') {
      this.deleteLocalFile((tour as any).detail_logo);
      (tour as any).detail_logo = null;
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
    const registration_count = await this.regRepo.count({ where: { tournament_id: tour.id } });
    return {
      ...this.mapTournament(tour),
      registration_count,
    };
  }

  async findBySlug(slug: string) {
    const tour = await this.tourRepo.findOne({ where: { slug } });
    if (!tour) throw new NotFoundException('Tournament not found');
    const registration_count = await this.regRepo.count({ where: { tournament_id: tour.id } });
    return {
      ...this.mapTournament(tour),
      registration_count,
    };
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

    const statusBefore = match.status;

    Object.assign(match, dto);

    if (dto.match_time !== undefined) {
      match.match_time = dto.match_time ? new Date(dto.match_time) : null as any;
    }

    // If winner is assigned and status is not COMPLETED, mark it as COMPLETED
    if (match.winner_id && match.status !== TournamentMatchStatus.COMPLETED) {
      match.status = TournamentMatchStatus.COMPLETED;
    }

    // Auto-derive winner_id from scores/check-in when completed but winner not provided
    if (!match.winner_id && match.status === TournamentMatchStatus.COMPLETED) {
      if (match.player1_check_in === 'absent' && match.player2_id) {
        match.winner_id = match.player2_id;
      } else if (match.player2_check_in === 'absent' && match.player1_id) {
        match.winner_id = match.player1_id;
      } else if (match.player1_id && match.player2_id) {
        if (match.player1_score > match.player2_score) match.winner_id = match.player1_id;
        else if (match.player2_score > match.player1_score) match.winner_id = match.player2_id;
      }
    }

    if (
      match.status === TournamentMatchStatus.COMPLETED &&
      statusBefore !== TournamentMatchStatus.COMPLETED &&
      match.winner_id
    ) {
      await this.calculateAndApplyRating(match, match.winner_id);
    }

    await this.freezeOrUnfreezeMatchRanks(match);
    const savedMatch = await this.matchRepo.save(match);
    await this.propagateWinnerToNextRound(savedMatch);
    await this.emitMatchUpdate(savedMatch.id);
    return savedMatch;
  }

  async generateMatches(tournamentId: number, matchList: CreateMatchDto[]) {
    // A simplified match generator for initial setup
    const tournament = await this.findOne(tournamentId);

    // Delete existing matches
    await this.matchRepo.delete({ tournament_id: tournamentId });

    // Create new ones
    const matchesToSave = matchList.map((m) => {
      const match = this.matchRepo.create({
        ...m,
        tournament_id: tournamentId,
      });
      if (!match.match_time && tournament.start_date && match.player1_id && match.player2_id) {
        match.match_time = tournament.start_date;
      }
      return match;
    });
    const savedMatches = await this.matchRepo.save(matchesToSave);

    // Auto-assign all already-registered players to Round 1 slots
    await this.assignAllRegisteredPlayersToRound1(tournamentId);

    return savedMatches;
  }

  private async freezeOrUnfreezeMatchRanks(match: TournamentMatchEntity) {
    if (match.status === TournamentMatchStatus.COMPLETED) {
      if (match.player1_id && !match.player1_rank) {
        const reg = await this.regRepo.findOne({
          where: { tournament_id: match.tournament_id, user_id: match.player1_id },
        });
        match.player1_rank = reg?.rank || null;
      }
      if (match.player2_id && !match.player2_rank) {
        const reg = await this.regRepo.findOne({
          where: { tournament_id: match.tournament_id, user_id: match.player2_id },
        });
        match.player2_rank = reg?.rank || null;
      }
    } else {
      match.player1_rank = null;
      match.player2_rank = null;
    }
  }

  private async assignAllRegisteredPlayersToRound1(tournamentId: number): Promise<void> {
    const registrations = await this.regRepo.find({
      where: { tournament_id: tournamentId },
      order: { registered_at: 'ASC' },
    });

    for (const reg of registrations) {
      await this.assignPlayerToRound1(tournamentId, reg.user_id);
    }
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
      rank: r.rank || r.user?.rank || null,
      avatar_url: r.user?.avatar_url || null,
      points: r.points !== undefined && r.points !== null ? r.points : (r.user?.points || 0),
      current_points: r.user?.points !== undefined && r.user?.points !== null ? r.user.points : 0,
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
      .andWhere('m.status = :status', { status: TournamentMatchStatus.ONGOING })
      .orderBy('m.match_time', 'ASC')
      .getOne();
      
    if (!match) return null;

    const [reg1, reg2, maxRoundResult] = await Promise.all([
      match.player1_id
        ? this.regRepo.findOne({ where: { tournament_id: match.tournament_id, user_id: match.player1_id } })
        : null,
      match.player2_id
        ? this.regRepo.findOne({ where: { tournament_id: match.tournament_id, user_id: match.player2_id } })
        : null,
      match.bracket === 'knockout'
        ? this.matchRepo
            .createQueryBuilder('m')
            .select('MAX(m.round)', 'maxRound')
            .where('m.tournament_id = :tid', { tid: match.tournament_id })
            .andWhere('m.bracket = :bracket', { bracket: 'knockout' })
            .getRawOne()
        : Promise.resolve(null),
    ]);

    // Compute flat race_to for round-specific configs (semi-final, final, quarter-final).
    // When set, QML should skip rank-based handicap calculation entirely.
    let effective_race_to: number | null = null;
    if (match.bracket === 'knockout' && maxRoundResult?.maxRound) {
      const maxRound = parseInt(maxRoundResult.maxRound ?? maxRoundResult.maxround ?? 0);
      const roundsFromEnd = maxRound - match.round;
      const t = match.tournament;
      console.log(`[device] bracket=${match.bracket} round=${match.round} maxRound=${maxRound} roundsFromEnd=${roundsFromEnd} final=${t?.final} semi_final=${t?.semi_final}`);
      if (roundsFromEnd === 0 && t?.final) effective_race_to = parseInt(t.final);
      else if (roundsFromEnd === 1 && t?.semi_final) effective_race_to = parseInt(t.semi_final);
      else if (roundsFromEnd === 2 && t?.quarter_final) effective_race_to = parseInt(t.quarter_final);
    }

    // Formatting for the exact keys QML expects payload
    return {
      id: match.id,
      match_id: match.id,  // QML checks m.match_id to detect active match
      tournament_id: match.tournament_id,
      tournament_name: match.tournament?.name || '',
      banner: match.tournament?.banner || '',
      sponsor_logos: match.tournament?.sponsor_logos || '',
      match_no: match.match_no,
      round: match.round,
      match_time: match.match_time ? match.match_time.toISOString() : null,
      status: match.status,
      effective_race_to: effective_race_to,
      race_to: (match.tournament as any)?.race_to || null,
      draw_touch: match.tournament?.draw_touch || null,
      handicap_1_touch: match.tournament?.handicap_1_touch || null,
      handicap_2_touch: match.tournament?.handicap_2_touch || null,
      player1_id: match.player1_id,
      player1_name: match.player1?.full_name || 'Waiting...',
      player1_avatar: match.player1?.avatar_url || '',
      player1_rank: match.player1_rank || reg1?.rank || null,
      player1_score: match.player1_score,
      player1_check_in: match.player1_check_in,
      player2_id: match.player2_id,
      player2_name: match.player2?.full_name || 'Waiting...',
      player2_avatar: match.player2?.avatar_url || '',
      player2_rank: match.player2_rank || reg2?.rank || null,
      player2_score: match.player2_score,
      player2_check_in: match.player2_check_in,
      winner_id: match.winner_id,
    };
  }

  async updateDeviceMatchScore(matchId: number, dto: any) {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: ['player1', 'player2'],
    });
    if (!match) throw new NotFoundException('Match not found');

    const statusBefore = match.status;

    if (dto.player1_score !== undefined) match.player1_score = dto.player1_score;
    if (dto.player2_score !== undefined) match.player2_score = dto.player2_score;
    if (dto.status !== undefined) match.status = dto.status;
    if (dto.winner_id !== undefined) match.winner_id = dto.winner_id;

    if (match.winner_id && match.status !== TournamentMatchStatus.COMPLETED) {
      match.status = TournamentMatchStatus.COMPLETED;
    }

    if (
      match.status === TournamentMatchStatus.COMPLETED &&
      statusBefore !== TournamentMatchStatus.COMPLETED &&
      match.winner_id
    ) {
      await this.calculateAndApplyRating(match, match.winner_id);
    }

    await this.freezeOrUnfreezeMatchRanks(match);
    await this.matchRepo.save(match);
    
    // Broadcast the update immediately over SSE so viewers see score changes instantly!
    await this.emitMatchUpdate(match.id);

    await this.propagateWinnerToNextRound(match);
    if (match.status === TournamentMatchStatus.COMPLETED && match.winner_id) {
      await this.propagateLoserToLR1(match);
      await this.propagateLR1WinnerToLR2(match);
      await this.propagateWR2LoserToLR2(match);
    }
    await this.autoScheduleQualificationMatches(match.tournament_id);
    
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
    
    // Auto-start match if both checked in (from any non-completed status)
    if (
      match.player1_check_in === 'confirmed' &&
      match.player2_check_in === 'confirmed' &&
      match.status !== TournamentMatchStatus.COMPLETED
    ) {
      match.status = TournamentMatchStatus.ONGOING;
      updated = true;
    }

    if (updated) {
      await this.matchRepo.save(match);
      await this.emitMatchUpdate(match.id);
    }
    return { success: true };
  }

  async getEligibleUsers(tournamentId: number, search?: string) {
    const tournament = await this.tourRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

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

    let allowedRanks: string[] = [];
    if (tournament.ranks) {
      try {
        allowedRanks = JSON.parse(tournament.ranks);
      } catch (e) {
        allowedRanks = [];
      }
    }

    if (Array.isArray(allowedRanks) && allowedRanks.length > 0) {
      const upperRanks = allowedRanks.map((r) => r.toUpperCase());
      qb.andWhere('UPPER(u.rank) IN (:...upperRanks)', { upperRanks });
    }

    if (search) {
      qb.andWhere(
        '(u.full_name ILIKE :search OR u.phone_number ILIKE :search OR u.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.limit(50).getMany();
  }

  async registerPlayer(tournamentId: number, userId: number, paidAmount?: number) {
    const existing = await this.regRepo.findOne({
      where: { tournament_id: tournamentId, user_id: userId },
    });
    if (existing) {
      return existing;
    }

    const tournament = await this.tourRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (paidAmount !== undefined && tournament.registration_fee > 0) {
      if (paidAmount < tournament.registration_fee) {
        throw new BadRequestException(
          `Insufficient payment: paid ${paidAmount}, required ${tournament.registration_fee}`,
        );
      }
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate rank restriction
    let allowedRanks: string[] = [];
    if (tournament.ranks) {
      try {
        allowedRanks = JSON.parse(tournament.ranks);
      } catch (e) {
        allowedRanks = [];
      }
    }

    if (Array.isArray(allowedRanks) && allowedRanks.length > 0) {
      const userRank = user.rank ? user.rank.toUpperCase() : '';
      const isAllowed = allowedRanks.map((r) => r.toUpperCase()).includes(userRank);
      if (!isAllowed) {
        throw new BadRequestException(
          `Cơ thủ ${user.full_name} có hạng ${user.rank || 'N/A'}, không nằm trong các hạng được phép của giải đấu: ${allowedRanks.join(', ')}`,
        );
      }
    }

    const reg = this.regRepo.create({
      tournament_id: tournamentId,
      user_id: userId,
      points: user.points ?? 0,
      rank: user.rank || undefined,
    });
    await this.regRepo.save(reg);

    await this.assignPlayerToRound1(tournamentId, userId);

    return this.regRepo.findOne({
      where: { id: reg.id },
      relations: ['user'],
    });
  }

  private async assignPlayerToRound1(tournamentId: number, userId: number): Promise<void> {
    const tournament = await this.tourRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) return;

    // Fetch only the initial stage bracket matches (WINNERS for double elimination, KNOCKOUT for single elimination)
    const targetBracket = tournament.tournament_type === 'double_elimination'
      ? TournamentMatchBracket.WINNERS
      : TournamentMatchBracket.KNOCKOUT;

    let allMatches = await this.matchRepo.find({
      where: {
        tournament_id: tournamentId,
        bracket: targetBracket,
      },
    });

    if (allMatches.length === 0) {
      allMatches = await this.autoGenerateRound1Matches(tournamentId);
    }

    if (allMatches.length === 0) return;

    const available: Array<{ match: TournamentMatchEntity; slot: 1 | 2 }> = [];
    const is24Players = tournament.number_of_players === 24;

    for (const m of allMatches) {
      if (m.round === 1) {
        if (m.player1_id === null && m.player2_id !== userId) {
          available.push({ match: m, slot: 1 });
        }
        if (m.player2_id === null && m.player1_id !== userId) {
          available.push({ match: m, slot: 2 });
        }
      } else if (m.round === 2 && is24Players) {
        // For 24 players DE, player2 of Winners Round 2 is a starting slot
        if (m.player2_id === null && m.player1_id !== userId) {
          available.push({ match: m, slot: 2 });
        }
      }
    }

    if (available.length === 0) return;

    const choice = available[Math.floor(Math.random() * available.length)];
    const match = choice.match;

    if (choice.slot === 1) {
      match.player1_id = userId;
    } else {
      match.player2_id = userId;
    }

    // Always reset to pending when a player is newly placed — overrides any stale BYE state
    match.status = TournamentMatchStatus.PENDING;
    match.winner_id = null;
    match.player1_score = 0;
    match.player2_score = 0;

    // Set match time to tournament start date only if both players are present
    if (tournament?.start_date && match.player1_id && match.player2_id) {
      match.match_time = tournament.start_date;
    } else {
      match.match_time = null as any;
    }

    await this.matchRepo.save(match);
  }

  private async autoGenerateRound1Matches(tournamentId: number): Promise<TournamentMatchEntity[]> {
    const tournament = await this.tourRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) return [];

    const n = tournament.number_of_players || 16;
    const is24 = tournament.tournament_type === 'double_elimination' && n === 24;

    const matches: TournamentMatchEntity[] = [];

    if (is24) {
      // For 24-player DE, generate wr1 (1-8, round 1) and wr2 (9-16, round 2)
      for (let i = 1; i <= 8; i++) {
        matches.push(
          this.matchRepo.create({
            tournament_id: tournamentId,
            match_no: i,
            bracket: TournamentMatchBracket.WINNERS,
            round: 1,
            status: TournamentMatchStatus.PENDING,
          }),
        );
      }
      for (let i = 9; i <= 16; i++) {
        matches.push(
          this.matchRepo.create({
            tournament_id: tournamentId,
            match_no: i,
            bracket: TournamentMatchBracket.WINNERS,
            round: 2,
            status: TournamentMatchStatus.PENDING,
          }),
        );
      }
    } else {
      const matchCount = this.getQualConfig(n).wr1.count;
      const targetBracket = tournament.tournament_type === 'double_elimination'
        ? TournamentMatchBracket.WINNERS
        : TournamentMatchBracket.KNOCKOUT;

      for (let i = 1; i <= matchCount; i++) {
        matches.push(
          this.matchRepo.create({
            tournament_id: tournamentId,
            match_no: i,
            bracket: targetBracket,
            round: 1,
            status: TournamentMatchStatus.PENDING,
          }),
        );
      }
    }

    return this.matchRepo.save(matches);
  }

  async unregisterPlayer(tournamentId: number, userId: number) {
    const reg = await this.regRepo.findOne({
      where: { tournament_id: tournamentId, user_id: userId },
    });
    if (!reg) {
      throw new NotFoundException('Registration not found');
    }
    await this.regRepo.remove(reg);

    // Remove player from any match they were assigned to and reset those matches
    const assignedMatches = await this.matchRepo.find({
      where: [
        { tournament_id: tournamentId, player1_id: userId },
        { tournament_id: tournamentId, player2_id: userId },
      ],
    });

    for (const match of assignedMatches) {
      if (match.player1_id === userId) match.player1_id = null;
      if (match.player2_id === userId) match.player2_id = null;
      if (match.winner_id === userId) match.winner_id = null;
      match.status = TournamentMatchStatus.PENDING;
      match.player1_score = 0;
      match.player2_score = 0;
      match.player1_check_in = 'unconfirmed';
      match.player2_check_in = 'unconfirmed';
    }

    if (assignedMatches.length > 0) {
      await this.matchRepo.save(assignedMatches);
    }
  }

  private async applyMatchStateAndTimerLogic(match: TournamentMatchEntity): Promise<void> {
    const isNewLogic = !(match.round === 1 && (match.bracket === 'winners' || match.bracket === 'knockout'));
    if (isNewLogic) {
      // Transition from PENDING to UPCOMING if we have >= 1 player and a table assigned
      if (match.status === TournamentMatchStatus.PENDING && (match.player1_id || match.player2_id) && match.table_no) {
        match.status = TournamentMatchStatus.UPCOMING;
      }

      // Auto-assign or reset match time for UPCOMING state in new logic rounds
      if (match.status === TournamentMatchStatus.UPCOMING) {
        if (match.player1_id && match.player2_id) {
          if (!match.match_time) {
            const isTableBusy = await this.matchRepo.findOne({
              where: {
                tournament_id: match.tournament_id,
                table_no: match.table_no,
                id: Not(match.id || -1),
                status: In([TournamentMatchStatus.ONGOING, TournamentMatchStatus.UPCOMING]),
              },
            });
            if (!isTableBusy) {
              match.match_time = new Date(Date.now() + 3 * 60 * 1000);
            }
          }
        } else {
          match.match_time = null as any;
        }
      }
    } else {
      // Original round 1 winners / knockout logic
      if (match.player1_id && match.player2_id && match.table_no && !match.match_time) {
        const isTableBusy = await this.matchRepo.findOne({
          where: {
            tournament_id: match.tournament_id,
            table_no: match.table_no,
            id: Not(match.id || -1),
            status: In([TournamentMatchStatus.ONGOING, TournamentMatchStatus.UPCOMING]),
          },
        });
        if (!isTableBusy) {
          match.match_time = new Date(Date.now() + 3 * 60 * 1000);
        }
      }
    }
  }

  async upsertMatch(tournamentId: number, matchNo: number, dto: UpdateMatchDto) {
    let match = await this.matchRepo.findOne({
      where: { tournament_id: tournamentId, match_no: matchNo },
    });

    const statusBefore = match ? match.status : null;
    const oldP1Points = match ? match.player1_points : null;
    const oldP2Points = match ? match.player2_points : null;
    const oldP1Id = match ? match.player1_id : null;
    const oldP2Id = match ? match.player2_id : null;
    const oldWinnerId = match ? match.winner_id : null;

    if (
      statusBefore === TournamentMatchStatus.COMPLETED &&
      oldWinnerId &&
      oldP1Id &&
      oldP2Id
    ) {
      const p1 = await this.userRepo.findOne({ where: { id: oldP1Id } });
      const p2 = await this.userRepo.findOne({ where: { id: oldP2Id } });
      if (p1 && p2) {
        if (oldP1Points !== null && oldP1Points !== undefined) {
          p1.points = Math.max(0, (p1.points || 0) - oldP1Points);
        }
        if (oldP2Points !== null && oldP2Points !== undefined) {
          p2.points = Math.max(0, (p2.points || 0) - oldP2Points);
        }
        p1.wins = Math.max(0, (p1.wins || 0) - (oldWinnerId === p1.id ? 1 : 0));
        p1.losses = Math.max(0, (p1.losses || 0) - (oldWinnerId === p1.id ? 0 : 1));
        p1.total_games = Math.max(0, (p1.total_games || 0) - 1);

        p2.wins = Math.max(0, (p2.wins || 0) - (oldWinnerId === p2.id ? 1 : 0));
        p2.losses = Math.max(0, (p2.losses || 0) - (oldWinnerId === p2.id ? 0 : 1));
        p2.total_games = Math.max(0, (p2.total_games || 0) - 1);

        await this.userRepo.save([p1, p2]);
        await this.checkAndUpdatePlayerRank(oldP1Id, tournamentId);
        await this.checkAndUpdatePlayerRank(oldP2Id, tournamentId);
      }
    }

    if (!match) {
      match = this.matchRepo.create({
        tournament_id: tournamentId,
        match_no: matchNo,
        bracket: dto.bracket || 'knockout',
        round: dto.round || 1,
      });
    }

    // Guard: if match is already completed with valid result, don't overwrite
    // with stale 0-0 data from a frontend dialog that may have missed device scores
    const hasValidResult =
      match.status === TournamentMatchStatus.COMPLETED &&
      match.winner_id !== null &&
      (match.player1_score > 0 || match.player2_score > 0);
    const isStaleSave =
      dto.player1_score === 0 &&
      dto.player2_score === 0 &&
      !dto.winner_id &&
      dto.status === TournamentMatchStatus.COMPLETED;
    if (hasValidResult && isStaleSave) {
      const { player1_score, player2_score, winner_id, status, ...safeDto } = dto as any;
      Object.assign(match, safeDto);
    } else {
      Object.assign(match, dto);
    }

    if (dto.match_time !== undefined) {
      match.match_time = dto.match_time ? new Date(dto.match_time) : null as any;
    }

    if (match.winner_id && match.status !== TournamentMatchStatus.COMPLETED) {
      match.status = TournamentMatchStatus.COMPLETED;
    }

    // Auto-derive winner_id from scores/check-in when completed but winner not provided
    if (!match.winner_id && match.status === TournamentMatchStatus.COMPLETED) {
      if (match.player1_check_in === 'absent' && match.player2_id) {
        match.winner_id = match.player2_id;
      } else if (match.player2_check_in === 'absent' && match.player1_id) {
        match.winner_id = match.player1_id;
      } else if (match.player1_id && match.player2_id) {
        if (match.player1_score > match.player2_score) match.winner_id = match.player1_id;
        else if (match.player2_score > match.player1_score) match.winner_id = match.player2_id;
      }
    }

    if (
      match &&
      match.status === TournamentMatchStatus.COMPLETED &&
      match.winner_id
    ) {
      await this.calculateAndApplyRating(match, match.winner_id);
    }

    await this.applyMatchStateAndTimerLogic(match);

    await this.freezeOrUnfreezeMatchRanks(match);
    const isNew = !match.id;
    try {
      await this.matchRepo.save(match);
    } catch (err: any) {
      if (isNew && err?.code === '23505') {
        // Race condition: another concurrent request already inserted this match.
        // Re-fetch and merge the dto onto the existing row.
        const existing = await this.matchRepo.findOne({
          where: { tournament_id: tournamentId, match_no: matchNo },
          relations: ['player1', 'player2'],
        });
        if (!existing) throw err;
        Object.assign(existing, dto);
        await this.freezeOrUnfreezeMatchRanks(existing);
        await this.matchRepo.save(existing);
        Object.assign(match, existing);
      } else {
        throw err;
      }
    }

    await this.propagateWinnerToNextRound(match);

    // Double elimination: propagate losers + auto-schedule subsequent rounds
    if (match.status === TournamentMatchStatus.COMPLETED && match.winner_id) {
      await this.propagateLoserToLR1(match);
      await this.propagateLR1WinnerToLR2(match);
      await this.propagateWR2LoserToLR2(match);
    }
    await this.autoScheduleQualificationMatches(match.tournament_id);

    // Auto-complete tournament when the final match finishes
    if (match.status === TournamentMatchStatus.COMPLETED && match.winner_id) {
      const tour = await this.tourRepo.findOne({ where: { id: tournamentId } });
      if (tour && tour.status !== 'completed') {
        const finalMatchNo = this.getFinalMatchNo(tour.number_of_players);
        if (match.match_no === finalMatchNo) {
          tour.status = 'completed';
          await this.tourRepo.save(tour);
        }
      }
    }

    await this.emitMatchUpdate(match.id);
    const reloaded = await this.matchRepo.findOne({
      where: { id: match.id },
      relations: ['player1', 'player2', 'winner'],
    });
    return reloaded;
  }

  async calculateAndApplyRating(match: TournamentMatchEntity, winnerId: number) {
    if (!match.player1_id || !match.player2_id) return;

    // Fetch players from DB with full profiles
    const player1 = await this.userRepo.findOne({ where: { id: match.player1_id } });
    const player2 = await this.userRepo.findOne({ where: { id: match.player2_id } });

    if (!player1 || !player2) return;

    let pointsChange = 10; // Default points change if ranks cannot be compared

    const rank1Name = player1.rank;
    const rank2Name = player2.rank;

    if (rank1Name && rank2Name) {
      // Fetch all tournament ranks ordered by order ASC
      const ranks = await this.rankRepo.find({ order: { order: 'ASC' } });
      const rank1 = ranks.find((r) => r.name.toUpperCase() === rank1Name.toUpperCase());
      const rank2 = ranks.find((r) => r.name.toUpperCase() === rank2Name.toUpperCase());

      if (rank1 && rank2) {
        const order1 = rank1.order;
        const order2 = rank2.order;
        const diff = Math.abs(order1 - order2);

        // Determine who is favorite and underdog
        // Note: lower order value represents higher rank (e.g. order 1 is higher rank than order 2)
        const isPlayer1Fav = order1 < order2;
        const isWinnerFav =
          (winnerId === player1.id && isPlayer1Fav) || (winnerId === player2.id && !isPlayer1Fav);

        // Load dynamic matrix
        let ratingMatrix = [
          { diff: 0, winFav: 15, winUnd: 15, loseFav: -15, loseUnd: -15 },
          { diff: 1, winFav: 10, winUnd: 25, loseFav: -25, loseUnd: -10 },
          { diff: 2, winFav: 5, winUnd: 30, loseFav: -30, loseUnd: -5 },
        ];

        const filePath = path.join(__dirname, '..', '..', '..', 'uploads', 'rating_matrix.json');
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              ratingMatrix = parsed;
            }
          } catch {
            // silent fallback
          }
        }

        const matrixItem = ratingMatrix.find((item) => item.diff === diff);
        if (matrixItem) {
          pointsChange = isWinnerFav ? Math.abs(matrixItem.winFav) : Math.abs(matrixItem.winUnd);
        } else {
          // If chênh lệch is larger than configured diff, fallback to the last config or default cap
          const sortedMatrix = [...ratingMatrix].sort((a, b) => b.diff - a.diff);
          if (sortedMatrix.length > 0) {
            const maxConfig = sortedMatrix[0];
            pointsChange = isWinnerFav ? Math.abs(maxConfig.winFav) : Math.abs(maxConfig.winUnd);
          } else {
            pointsChange = isWinnerFav ? 5 : 35;
          }
        }
      }
    }

    let p1PointsChange = 0;
    let p2PointsChange = 0;

    if (match.player1_points !== null && match.player1_points !== undefined) {
      p1PointsChange = match.player1_points;
    } else {
      p1PointsChange = winnerId === player1.id ? pointsChange : -pointsChange;
      match.player1_points = p1PointsChange;
    }

    if (match.player2_points !== null && match.player2_points !== undefined) {
      p2PointsChange = match.player2_points;
    } else {
      p2PointsChange = winnerId === player2.id ? pointsChange : -pointsChange;
      match.player2_points = p2PointsChange;
    }

    // Save calculated points back to the match in DB
    await this.matchRepo.save(match);

    player1.points = Math.max(0, (player1.points || 0) + p1PointsChange);
    player1.wins = (player1.wins || 0) + (winnerId === player1.id ? 1 : 0);
    player1.losses = (player1.losses || 0) + (winnerId === player1.id ? 0 : 1);
    player1.total_games = (player1.total_games || 0) + 1;

    player2.points = Math.max(0, (player2.points || 0) + p2PointsChange);
    player2.wins = (player2.wins || 0) + (winnerId === player2.id ? 1 : 0);
    player2.losses = (player2.losses || 0) + (winnerId === player2.id ? 0 : 1);
    player2.total_games = (player2.total_games || 0) + 1;

    await this.userRepo.save([player1, player2]);
    await this.checkAndUpdatePlayerRank(player1.id, match.tournament_id);
    await this.checkAndUpdatePlayerRank(player2.id, match.tournament_id);
  }

  async checkAndUpdatePlayerRank(playerId: number, tournamentId: number) {
    const player = await this.userRepo.findOne({ where: { id: playerId } });
    if (!player) return;

    const ranks = await this.rankRepo.find({ order: { order: 'ASC' } });
    const matchingRank = ranks.find(
      (r) => player.points >= r.min_score && player.points <= r.max_score,
    );

    if (matchingRank && player.rank !== matchingRank.name) {
      player.rank = matchingRank.name;
      await this.userRepo.save(player);

      const reg = await this.regRepo.findOne({
        where: { tournament_id: tournamentId, user_id: player.id },
      });
      if (reg) {
        reg.rank = matchingRank.name;
        await this.regRepo.save(reg);
      }
      console.log(`Rank updated for player ${player.full_name} to ${matchingRank.name}`);
    }
  }

  private getFinalMatchNo(numberOfPlayers: number): number {
    if (numberOfPlayers > 32) return 111;
    if (numberOfPlayers > 16) return 55;
    return 27;
  }

  private getNextMatchInfo(
    matchNo: number,
    numberOfPlayers: number,
    bracket: string,
  ): { nextMatchNo: number; playerSlot: 1 | 2 } | null {
    if (numberOfPlayers === 24) {
      if (bracket === 'winners' && matchNo >= 1 && matchNo <= 8) {
        return { nextMatchNo: matchNo + 8, playerSlot: 1 };
      }
      return null;
    }
    const isKO8 = numberOfPlayers <= 16;
    const isKO32 = numberOfPlayers > 32;

    if (bracket === 'knockout') {
      if (isKO8) {
        // Tứ kết (21-24) -> Bán kết (25-26)
        if (matchNo >= 21 && matchNo <= 24) {
          const idx = matchNo - 21;
          const nextMatchNo = 25 + Math.floor(idx / 2);
          const playerSlot = idx % 2 === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
        // Bán kết (25-26) -> Chung kết (27)
        if (matchNo >= 25 && matchNo <= 26) {
          const idx = matchNo - 25;
          const nextMatchNo = 27;
          const playerSlot = idx === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
      } else if (isKO32) {
        // Vòng 1/16 (81-96) -> Vòng 1/8 (97-104)
        if (matchNo >= 81 && matchNo <= 96) {
          const idx = matchNo - 81;
          const nextMatchNo = 97 + Math.floor(idx / 2);
          const playerSlot = idx % 2 === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
        // Vòng 1/8 (97-104) -> Tứ kết (105-108)
        if (matchNo >= 97 && matchNo <= 104) {
          const idx = matchNo - 97;
          const nextMatchNo = 105 + Math.floor(idx / 2);
          const playerSlot = idx % 2 === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
        // Tứ kết (105-108) -> Bán kết (109-110)
        if (matchNo >= 105 && matchNo <= 108) {
          const idx = matchNo - 105;
          const nextMatchNo = 109 + Math.floor(idx / 2);
          const playerSlot = idx % 2 === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
        // Bán kết (109-110) -> Chung kết (111)
        if (matchNo >= 109 && matchNo <= 110) {
          const idx = matchNo - 109;
          const nextMatchNo = 111;
          const playerSlot = idx === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
      } else {
        // KO16 Mode (32 players)
        // Vòng 1/8 (41-48) -> Tứ kết (49-52)
        if (matchNo >= 41 && matchNo <= 48) {
          const idx = matchNo - 41;
          const nextMatchNo = 49 + Math.floor(idx / 2);
          const playerSlot = idx % 2 === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
        // Tứ kết (49-52) -> Bán kết (53-54)
        if (matchNo >= 49 && matchNo <= 52) {
          const idx = matchNo - 49;
          const nextMatchNo = 53 + Math.floor(idx / 2);
          const playerSlot = idx % 2 === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
        // Bán kết (53-54) -> Chung kết (55)
        if (matchNo >= 53 && matchNo <= 54) {
          const idx = matchNo - 53;
          const nextMatchNo = 55;
          const playerSlot = idx === 0 ? 1 : 2;
          return { nextMatchNo, playerSlot };
        }
      }
    } else if (bracket === 'winners') {
      const size = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
      const r1Count = size === 64 ? 32 : size === 32 ? 16 : 8;
      if (matchNo >= 1 && matchNo <= r1Count) {
        const idx = matchNo - 1;
        const start = size === 64 ? 49 : size === 32 ? 25 : 13;
        const nextMatchNo = start + Math.floor(idx / 2);
        const playerSlot = idx % 2 === 0 ? 1 : 2;
        return { nextMatchNo, playerSlot };
      }
    }

    return null;
  }

  async propagateAndEmit(match: TournamentMatchEntity): Promise<void> {
    await this.propagateWinnerToNextRound(match);
    if (match.status === TournamentMatchStatus.COMPLETED && match.winner_id) {
      await this.propagateLR1WinnerToLR2(match);
      await this.propagateWR2LoserToLR2(match);
    }
    await this.emitMatchUpdate(match.id);
  }

  // ── Qualification config ─────────────────────────────────────────────────

  private getQualConfig(numberOfPlayers: number) {
    if (numberOfPlayers === 24) {
      return {
        size: 24 as any,
        wr1: { start: 1,  count: 8  },
        lr1: { start: 17, count: 8  },
        wr2: { start: 9,  count: 8  },
        lr2: { start: 0,  count: 0  },
      };
    }
    const size: 16 | 32 | 64 = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
    const cfg = {
      16: { wr1: { start: 1,  count: 8  }, lr1: { start: 9,  count: 4  }, wr2: { start: 13, count: 4  }, lr2: { start: 17, count: 4  } },
      32: { wr1: { start: 1,  count: 16 }, lr1: { start: 17, count: 8  }, wr2: { start: 25, count: 8  }, lr2: { start: 33, count: 8  } },
      64: { wr1: { start: 1,  count: 32 }, lr1: { start: 33, count: 16 }, wr2: { start: 49, count: 16 }, lr2: { start: 65, count: 16 } },
    };
    return { size, ...cfg[size] };
  }

  private mkRange(start: number, count: number): number[] {
    return Array.from({ length: count }, (_, i) => start + i);
  }

  // Seed a single player into a target match (create if missing, skip if unchanged)
  private async seedPlayerToMatch(
    tournamentId: number,
    matchNo: number,
    bracket: string,
    round: number,
    playerId: number,
    slot: 1 | 2,
  ): Promise<void> {
    let m = await this.matchRepo.findOne({ where: { tournament_id: tournamentId, match_no: matchNo } });
    if (!m) {
      m = this.matchRepo.create({ tournament_id: tournamentId, match_no: matchNo, bracket, round, status: TournamentMatchStatus.PENDING });
    }
    const current = slot === 1 ? m.player1_id : m.player2_id;
    if (current === playerId) return;
    if (slot === 1) m.player1_id = playerId; else m.player2_id = playerId;
    if (m.status === TournamentMatchStatus.COMPLETED) {
      m.status = TournamentMatchStatus.PENDING;
      m.winner_id = null;
      m.player1_score = 0;
      m.player2_score = 0;
    }
    await this.applyMatchStateAndTimerLogic(m);
    const seedIsNew = !m.id;
    try {
      await this.matchRepo.save(m);
    } catch (err: any) {
      if (seedIsNew && err?.code === '23505') {
        const existing = await this.matchRepo.findOne({ where: { tournament_id: tournamentId, match_no: matchNo } });
        if (!existing) throw err;
        if (slot === 1) existing.player1_id = playerId; else existing.player2_id = playerId;
        await this.applyMatchStateAndTimerLogic(existing);
        await this.matchRepo.save(existing);
        m = existing;
      } else {
        throw err;
      }
    }
    if (m.id) await this.emitMatchUpdate(m.id);
  }

  // WR1 loser → LR1
  private async propagateLoserToLR1(match: TournamentMatchEntity): Promise<void> {
    if (match.bracket !== 'winners' || !match.winner_id || !match.player1_id || !match.player2_id) return;
    const tour = await this.tourRepo.findOne({ where: { id: match.tournament_id } });
    if (!tour || tour.tournament_type !== 'double_elimination') return;
    if (tour.number_of_players === 24) {
      if (match.match_no >= 1 && match.match_no <= 8) {
        const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;
        const lr1MatchNo = match.match_no + 16;
        await this.seedPlayerToMatch(match.tournament_id, lr1MatchNo, TournamentMatchBracket.LOSERS, 1, loserId, 2);
      }
      return;
    }
    const cfg = this.getQualConfig(tour.number_of_players);
    if (match.match_no < cfg.wr1.start || match.match_no >= cfg.wr1.start + cfg.wr1.count) return;
    const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;
    const idx = match.match_no - cfg.wr1.start;
    const lr1MatchNo = cfg.lr1.start + Math.floor(idx / 2);
    const slot: 1 | 2 = idx % 2 === 0 ? 1 : 2;
    await this.seedPlayerToMatch(match.tournament_id, lr1MatchNo, TournamentMatchBracket.LOSERS, 1, loserId, slot);
  }

  // LR1 winner → LR2 player1
  private async propagateLR1WinnerToLR2(match: TournamentMatchEntity): Promise<void> {
    if (match.bracket !== 'losers' || match.round !== 1 || !match.winner_id) return;
    const tour = await this.tourRepo.findOne({ where: { id: match.tournament_id } });
    if (!tour || tour.tournament_type !== 'double_elimination') return;
    if (tour.number_of_players === 24) return; // LR1 winners qualify directly to Knockout stage, no further propagation in this stage
    const cfg = this.getQualConfig(tour.number_of_players);
    if (match.match_no < cfg.lr1.start || match.match_no >= cfg.lr1.start + cfg.lr1.count) return;
    const idx = match.match_no - cfg.lr1.start;
    const lr2MatchNo = cfg.lr2.start + idx;
    await this.seedPlayerToMatch(match.tournament_id, lr2MatchNo, TournamentMatchBracket.LOSERS, 2, match.winner_id, 1);
  }

  // WR2 loser → LR2 player2 (reversed index)
  private async propagateWR2LoserToLR2(match: TournamentMatchEntity): Promise<void> {
    if (match.bracket !== 'winners' || match.round !== 2 || !match.winner_id || !match.player1_id || !match.player2_id) return;
    const tour = await this.tourRepo.findOne({ where: { id: match.tournament_id } });
    if (!tour || tour.tournament_type !== 'double_elimination') return;
    if (tour.number_of_players === 24) {
      if (match.match_no >= 9 && match.match_no <= 16) {
        const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;
        const lr1MatchNo = 33 - match.match_no;
        await this.seedPlayerToMatch(match.tournament_id, lr1MatchNo, TournamentMatchBracket.LOSERS, 1, loserId, 1);
      }
      return;
    }
    const cfg = this.getQualConfig(tour.number_of_players);
    if (match.match_no < cfg.wr2.start || match.match_no >= cfg.wr2.start + cfg.wr2.count) return;
    const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;
    const idx = match.match_no - cfg.wr2.start;
    const reversedIdx = cfg.wr2.count - 1 - idx;
    const lr2MatchNo = cfg.lr2.start + reversedIdx;
    await this.seedPlayerToMatch(match.tournament_id, lr2MatchNo, TournamentMatchBracket.LOSERS, 2, loserId, 2);
  }

  // Tự động xếp bàn + giờ khi có bàn trống (knockout: tất cả vòng; double_elimination: WR1→LR1→WR2→LR2)
  async autoScheduleQualificationMatches(tournamentId: number): Promise<void> {
    // Tự động xếp bàn đã bị vô hiệu hóa theo yêu cầu. Từ giờ sẽ xếp bàn thủ công.
    return;
  }

  private async propagateWinnerToNextRound(match: TournamentMatchEntity): Promise<void> {
    const tournament = await this.tourRepo.findOne({
      where: { id: match.tournament_id },
    });
    if (!tournament) return;

    const nextMatchInfo = this.getNextMatchInfo(
      match.match_no,
      tournament.number_of_players,
      match.bracket,
    );
    if (!nextMatchInfo) return;

    let nextMatch = await this.matchRepo.findOne({
      where: {
        tournament_id: match.tournament_id,
        match_no: nextMatchInfo.nextMatchNo,
      },
    });

    const targetWinnerId =
      match.status === TournamentMatchStatus.COMPLETED ? match.winner_id : null;

    // Only propagate when match is completed with a winner.
    // During score updates (ongoing, no winner), we must NOT clear the next match's
    // player slots — doing so would cause the scoreboard device to detect a "player
    // changed" event and incorrectly reset accumulated scores.
    if (!targetWinnerId) return;

    if (!nextMatch) {
      nextMatch = this.matchRepo.create({
        tournament_id: match.tournament_id,
        match_no: nextMatchInfo.nextMatchNo,
        bracket: match.bracket,
        round: match.round + 1,
        status: TournamentMatchStatus.PENDING,
      });
    }

    let changed = false;
    if (nextMatchInfo.playerSlot === 1) {
      if (nextMatch.player1_id !== targetWinnerId) {
        nextMatch.player1_id = targetWinnerId;
        changed = true;
      }
    } else {
      if (nextMatch.player2_id !== targetWinnerId) {
        nextMatch.player2_id = targetWinnerId;
        changed = true;
      }
    }

    if (changed) {
      // If the match was completed, but now has changing players, we must reset its status
      if (nextMatch.status === TournamentMatchStatus.COMPLETED) {
        nextMatch.status = TournamentMatchStatus.PENDING;
        nextMatch.winner_id = null;
        nextMatch.player1_score = 0;
        nextMatch.player2_score = 0;
      }

      await this.applyMatchStateAndTimerLogic(nextMatch);

      await this.matchRepo.save(nextMatch);
      const reloadedNext = await this.matchRepo.findOne({
        where: { id: nextMatch.id },
        relations: ['player1', 'player2'],
      });
      this.matchUpdates$.next({ tournamentId: nextMatch.tournament_id, match: reloadedNext || nextMatch });

      // Recursively propagate
      await this.propagateWinnerToNextRound(nextMatch);
    }
  }
}
