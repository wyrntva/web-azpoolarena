import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Subject } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class TournamentsService {
  private readonly matchUpdates$ = new Subject<{ tournamentId: number; match: any }>();

  getMatchUpdatesStream() {
    return this.matchUpdates$.asObservable();
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
      rank: r.rank || r.user?.rank || null,
      avatar_url: r.user?.avatar_url || null,
      points: r.points !== undefined && r.points !== null ? r.points : (r.user?.points || 0),
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
      race_to: (match.tournament as any)?.race_to || null,
      draw_touch: match.tournament?.draw_touch || null,
      handicap_1_touch: match.tournament?.handicap_1_touch || null,
      handicap_2_touch: match.tournament?.handicap_2_touch || null,
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

    await this.matchRepo.save(match);
    await this.emitMatchUpdate(match.id);
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
    const round1Matches = await this.matchRepo.find({
      where: [
        { tournament_id: tournamentId, round: 1, bracket: TournamentMatchBracket.WINNERS },
        { tournament_id: tournamentId, round: 1, bracket: TournamentMatchBracket.KNOCKOUT },
      ],
    });

    if (round1Matches.length === 0) return;

    // Find matches that have an empty slot and the player is not already in this match
    const available = round1Matches.filter(
      (m) =>
        (m.player1_id === null || m.player2_id === null) &&
        m.player1_id !== userId &&
        m.player2_id !== userId,
    );

    if (available.length === 0) return;

    const match = available[Math.floor(Math.random() * available.length)];

    if (match.player1_id === null) {
      match.player1_id = userId;
    } else {
      match.player2_id = userId;
    }

    await this.matchRepo.save(match);
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
      relations: ['player1', 'player2'],
    });

    const statusBefore = match ? match.status : null;

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
      statusBefore !== TournamentMatchStatus.COMPLETED &&
      match.winner_id
    ) {
      await this.calculateAndApplyRating(match, match.winner_id);
    }

    await this.matchRepo.save(match);
    await this.propagateWinnerToNextRound(match);

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

    // Update players points and game stats
    const winner = player1.id === winnerId ? player1 : player2;
    const loser = player1.id === winnerId ? player2 : player1;

    winner.points = (winner.points || 0) + pointsChange;
    winner.wins = (winner.wins || 0) + 1;
    winner.total_games = (winner.total_games || 0) + 1;

    // Cap points to 0 so they don't go negative
    loser.points = Math.max(0, (loser.points || 0) - pointsChange);
    loser.losses = (loser.losses || 0) + 1;
    loser.total_games = (loser.total_games || 0) + 1;

    await this.userRepo.save([winner, loser]);
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

    if (!nextMatch) {
      if (!targetWinnerId) return; // No need to create a next match just to set null players
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
