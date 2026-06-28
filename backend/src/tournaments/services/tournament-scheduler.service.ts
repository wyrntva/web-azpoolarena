import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TournamentEntity,
  TournamentMatchEntity,
  TournamentMatchStatus,
  TournamentMatchBracket,
} from '../entities';
import { TournamentsService } from './tournaments.service';

@Injectable()
export class TournamentSchedulerService {
  private readonly logger = new Logger(TournamentSchedulerService.name);

  constructor(
    @InjectRepository(TournamentMatchEntity)
    private readonly matchRepo: Repository<TournamentMatchEntity>,
    @InjectRepository(TournamentEntity)
    private readonly tourRepo: Repository<TournamentEntity>,
    private readonly tournamentsService: TournamentsService,
  ) {}

  // Trả về match_no của trận chung kết dựa theo số người chơi
  private getFinalMatchNo(numberOfPlayers: number): number {
    if (numberOfPlayers > 32) return 111;
    if (numberOfPlayers > 16) return 55;
    return 27;
  }

  // Chạy mỗi 30 giây — tự động cập nhật trạng thái trận đấu
  // Quy tắc:
  //   Vòng 1: PENDING → UPCOMING khi hết hạn đăng kí + đủ 2 người
  //   Vòng 2+: PENDING → UPCOMING khi đủ 2 người + có bàn + có giờ + giờ trong vòng 15 phút tới
  //   UPCOMING → PENDING  : mất điều kiện (trừ vòng 1 sau đăng kí)
  //   UPCOMING → ONGOING  : giờ đã đến + có bàn
  @Cron('*/30 * * * * *')
  async autoUpdateMatchStatus() {
    const now = new Date();

    // Query tournaments whose registration has ended
    const toursPastRegistration = await this.tourRepo
      .createQueryBuilder('t')
      .where('t.registration_end_date IS NOT NULL')
      .andWhere('t.registration_end_date <= :now', { now })
      .andWhere("t.status != 'completed'")
      .getMany();
    const tourIdsPastReg = toursPastRegistration.map((t) => t.id);

    // 1a. Reset vòng mới (Vòng 2+ & Vòng 1 nhánh thua) UPCOMING → PENDING nếu không có người chơi nào hoặc không có bàn
    await this.matchRepo
      .createQueryBuilder()
      .update(TournamentMatchEntity)
      .set({ status: TournamentMatchStatus.PENDING, match_time: () => 'NULL' })
      .where('status = :status', { status: TournamentMatchStatus.UPCOMING })
      .andWhere('(round > 1 OR (round = 1 AND bracket = :loserBracket))', {
        loserBracket: TournamentMatchBracket.LOSERS,
      })
      .andWhere(
        '((player1_id IS NULL AND player2_id IS NULL) OR table_no IS NULL)',
      )
      .execute();

    // 1b. Reset vòng 1 nhánh thắng/knockout UPCOMING → PENDING nếu chưa hết hạn đăng kí HOẶC thiếu người chơi
    if (tourIdsPastReg.length > 0) {
      await this.matchRepo
        .createQueryBuilder()
        .update(TournamentMatchEntity)
        .set({ status: TournamentMatchStatus.PENDING })
        .where('status = :status', { status: TournamentMatchStatus.UPCOMING })
        .andWhere('round = 1')
        .andWhere("bracket IN ('winners', 'knockout')")
        .andWhere(
          '(player1_id IS NULL OR player2_id IS NULL OR tournament_id NOT IN (:...tourIdsPastReg))',
          { tourIdsPastReg },
        )
        .execute();
    } else {
      await this.matchRepo
        .createQueryBuilder()
        .update(TournamentMatchEntity)
        .set({ status: TournamentMatchStatus.PENDING })
        .where('status = :status', { status: TournamentMatchStatus.UPCOMING })
        .andWhere('round = 1')
        .andWhere("bracket IN ('winners', 'knockout')")
        .execute();
    }

    // Helper: kiểm tra bàn có đang bận không (có trận ongoing/upcoming khác dùng bàn này)
    const isTableBusy = async (
      tableNo: string,
      excludeId: number,
    ): Promise<boolean> => {
      const busy = await this.matchRepo.findOne({
        where: [
          { table_no: tableNo, status: TournamentMatchStatus.ONGOING },
          { table_no: tableNo, status: TournamentMatchStatus.UPCOMING },
        ],
      });
      return !!(busy && busy.id !== excludeId);
    };

    // 2. Vòng 1: PENDING → UPCOMING khi hết hạn đăng kí + đủ 2 người + có bàn + bàn không bận
    // Knockout bracket round 1: thêm điều kiện 75% — ít nhất 75% trận trong vòng phải đủ 2 người
    if (toursPastRegistration.length > 0) {
      const tourIds = tourIdsPastReg;
      const round1Candidates = await this.matchRepo
        .createQueryBuilder('m')
        .where('m.status = :status', { status: TournamentMatchStatus.PENDING })
        .andWhere('m.round = 1')
        .andWhere("m.bracket IN ('winners', 'knockout')")
        .andWhere('m.player1_id IS NOT NULL')
        .andWhere('m.player2_id IS NOT NULL')
        .andWhere('m.table_no IS NOT NULL')
        .andWhere('m.tournament_id IN (:...tourIds)', { tourIds })
        .getMany();

      const round1ToUpcoming: typeof round1Candidates = [];
      for (const m of round1Candidates) {
        // Knockout bracket: enforce 75% threshold
        if (m.bracket === 'knockout') {
          const allKoR1 = await this.matchRepo.find({
            where: {
              tournament_id: m.tournament_id,
              bracket: TournamentMatchBracket.KNOCKOUT,
              round: 1,
            },
          });
          const filledCount = allKoR1.filter(
            (x) => x.player1_id && x.player2_id,
          ).length;
          const threshold = Math.ceil(allKoR1.length * 0.75);
          if (filledCount < threshold) {
            this.logger.log(
              `Tournament ${m.tournament_id} KO round 1: ${filledCount}/${allKoR1.length} filled (need ${threshold}) — skipping UPCOMING for match ${m.match_no}`,
            );
            continue;
          }
        }
        // Bàn không được đang bận
        if (await isTableBusy(m.table_no, m.id)) {
          this.logger.log(
            `Match ${m.match_no}: bàn ${m.table_no} đang bận — bỏ qua UPCOMING`,
          );
          continue;
        }
        round1ToUpcoming.push(m);
      }

      if (round1ToUpcoming.length > 0) {
        for (const m of round1ToUpcoming) {
          m.status = TournamentMatchStatus.UPCOMING;
          this.logger.log(
            `Match ${m.match_no} (tour ${m.tournament_id}) → upcoming (vòng 1)`,
          );
        }
        await this.matchRepo.save(round1ToUpcoming);
        for (const m of round1ToUpcoming) {
          await this.tournamentsService
            .emitMatchUpdate(m.id)
            .catch((err) =>
              this.logger.error(
                `Emit upcoming failed for match ${m.match_no}: ${err.message}`,
              ),
            );
        }
      }
    }

    // 3. Vòng 2+ & Vòng 1 nhánh thua: PENDING → UPCOMING khi có ít nhất 1 người chơi + có bàn
    const pendingToUpcoming = await this.matchRepo
      .createQueryBuilder('m')
      .where('m.status = :status', { status: TournamentMatchStatus.PENDING })
      .andWhere(
        '(m.round > 1 OR (m.round = 1 AND m.bracket = :loserBracket))',
        { loserBracket: TournamentMatchBracket.LOSERS },
      )
      .andWhere('(m.player1_id IS NOT NULL OR m.player2_id IS NOT NULL)')
      .andWhere('m.table_no IS NOT NULL')
      .getMany();

    if (pendingToUpcoming.length > 0) {
      for (const m of pendingToUpcoming) {
        m.status = TournamentMatchStatus.UPCOMING;
        // Nếu đủ 2 người chơi, tự động đặt match_time = now + 3 phút (nếu bàn không bận)
        if (m.player1_id && m.player2_id) {
          if (!m.match_time) {
            if (!(await isTableBusy(m.table_no, m.id))) {
              m.match_time = new Date(now.getTime() + 3 * 60 * 1000);
            }
          }
        } else {
          m.match_time = null as any;
        }
        this.logger.log(
          `Match ${m.match_no} (tour ${m.tournament_id}) → upcoming`,
        );
      }
      await this.matchRepo.save(pendingToUpcoming);
      for (const m of pendingToUpcoming) {
        await this.tournamentsService
          .emitMatchUpdate(m.id)
          .catch((err) =>
            this.logger.error(
              `Emit upcoming failed for match ${m.match_no}: ${err.message}`,
            ),
          );
      }
    }

    // 3b. Cập nhật đếm ngược cho các trận UPCOMING thuộc vòng mới:
    // - Đủ 2 người chơi mà chưa có match_time -> đặt match_time = now + 3 phút (nếu bàn không bận)
    // - Chỉ có 1 người chơi mà đang có match_time -> reset match_time = null
    const upcomingCandidates = await this.matchRepo
      .createQueryBuilder('m')
      .where('m.status = :status', { status: TournamentMatchStatus.UPCOMING })
      .andWhere(
        '(m.round > 1 OR (m.round = 1 AND m.bracket = :loserBracket))',
        { loserBracket: TournamentMatchBracket.LOSERS },
      )
      .getMany();

    const upcomingToSave: typeof upcomingCandidates = [];
    for (const m of upcomingCandidates) {
      if (m.player1_id && m.player2_id) {
        if (!m.match_time) {
          if (!(await isTableBusy(m.table_no, m.id))) {
            m.match_time = new Date(now.getTime() + 3 * 60 * 1000);
            upcomingToSave.push(m);
            this.logger.log(
              `Match ${m.match_no} (tour ${m.tournament_id}) đủ 2 người chơi -> đặt match_time = +3 phút`,
            );
          }
        }
      } else {
        if (m.match_time) {
          m.match_time = null as any;
          upcomingToSave.push(m);
          this.logger.log(
            `Match ${m.match_no} (tour ${m.tournament_id}) thiếu người chơi -> reset match_time = null`,
          );
        }
      }
    }

    if (upcomingToSave.length > 0) {
      await this.matchRepo.save(upcomingToSave);
      for (const m of upcomingToSave) {
        await this.tournamentsService
          .emitMatchUpdate(m.id)
          .catch((err) =>
            this.logger.error(
              `Emit upcoming update failed for match ${m.match_no}: ${err.message}`,
            ),
          );
      }
    }

    // 4. UPCOMING → ONGOING: giờ đã đến + có bàn + bàn không đang có trận ongoing khác + đủ 2 người chơi
    const upcomingToOngoingRaw = await this.matchRepo
      .createQueryBuilder('m')
      .where('m.status = :status', { status: TournamentMatchStatus.UPCOMING })
      .andWhere('m.table_no IS NOT NULL')
      .andWhere('m.player1_id IS NOT NULL')
      .andWhere('m.player2_id IS NOT NULL')
      .andWhere('m.match_time IS NOT NULL')
      .andWhere('m.match_time <= :now', { now })
      .getMany();

    const upcomingToOngoing: typeof upcomingToOngoingRaw = [];
    for (const m of upcomingToOngoingRaw) {
      // Bàn không được có trận ongoing khác
      const ongoingOnTable = await this.matchRepo.findOne({
        where: { table_no: m.table_no, status: TournamentMatchStatus.ONGOING },
      });
      if (ongoingOnTable && ongoingOnTable.id !== m.id) {
        this.logger.log(
          `Match ${m.match_no}: bàn ${m.table_no} đang có trận ongoing — chờ`,
        );
        continue;
      }
      upcomingToOngoing.push(m);
    }

    if (upcomingToOngoing.length > 0) {
      for (const m of upcomingToOngoing) {
        m.status = TournamentMatchStatus.ONGOING;
        this.logger.log(
          `Match ${m.match_no} (tour ${m.tournament_id}) → ongoing`,
        );
      }
      await this.matchRepo.save(upcomingToOngoing);
      for (const m of upcomingToOngoing) {
        await this.tournamentsService
          .emitMatchUpdate(m.id)
          .catch((err) =>
            this.logger.error(
              `Emit ongoing failed for match ${m.match_no}: ${err.message}`,
            ),
          );
      }
    }
  }

  // Chạy mỗi 30 giây — tự động xử lý BYE sau khi hết hạn đăng kí
  // Trận vòng 1 chỉ có 1 người (người kia chưa đăng kí) → người có mặt thắng walkover
  @Cron('*/30 * * * * *')
  async autoCompleteByeMatchesAfterRegistration() {
    const now = new Date();

    // Chỉ xét các giải đã qua registration_end_date
    const tours = await this.tourRepo
      .createQueryBuilder('t')
      .where('t.registration_end_date IS NOT NULL')
      .andWhere('t.registration_end_date <= :now', { now })
      .andWhere('t.status != :completed', { completed: 'completed' })
      .getMany();

    for (const tour of tours) {
      // 1. Nhánh thắng / knockout: trận vòng 1 chỉ có 1 player → bye thật (người kia không đăng kí)
      // Với double_elimination: chỉ xét 'winners' bracket (bỏ 'knockout' vì trận 21+ chờ kết quả LR2)
      const allowedBrackets =
        tour.tournament_type === 'double_elimination'
          ? "'winners'"
          : "'winners', 'knockout'";
      let byeMatches: TournamentMatchEntity[] = [];
      if (tour.number_of_players === 24) {
        // For 24 players: round 1 has standard byes (either player null),
        // round 2 has bye if player1 is present but player2 is null (starting slot)
        byeMatches = await this.matchRepo
          .createQueryBuilder('m')
          .where('m.tournament_id = :id', { id: tour.id })
          .andWhere(`m.bracket IN (${allowedBrackets})`)
          .andWhere('m.status != :completed', {
            completed: TournamentMatchStatus.COMPLETED,
          })
          .andWhere(
            '((m.round = 1 AND ((m.player1_id IS NOT NULL AND m.player2_id IS NULL) OR (m.player1_id IS NULL AND m.player2_id IS NOT NULL))) OR ' +
            '(m.round = 2 AND m.player1_id IS NOT NULL AND m.player2_id IS NULL))'
          )
          .getMany();
      } else {
        byeMatches = await this.matchRepo
          .createQueryBuilder('m')
          .where('m.tournament_id = :id', { id: tour.id })
          .andWhere('m.round = 1')
          .andWhere(`m.bracket IN (${allowedBrackets})`)
          .andWhere('m.status != :completed', {
            completed: TournamentMatchStatus.COMPLETED,
          })
          .andWhere(
            '((m.player1_id IS NOT NULL AND m.player2_id IS NULL) OR (m.player1_id IS NULL AND m.player2_id IS NOT NULL))',
          )
          .getMany();
      }

      for (const match of byeMatches) {
        const winnerId = match.player1_id ?? match.player2_id;
        match.status = TournamentMatchStatus.COMPLETED;
        match.winner_id = winnerId;
        await this.matchRepo.save(match);
        await this.tournamentsService.propagateAndEmit(match);
        this.logger.log(
          `Tournament ${tour.id} match ${match.match_no}: BYE walkover → winner=${winnerId}`,
        );
      }

      // 2. Nhánh thua (double elimination) LR1: chỉ complete WO khi WR1 feeder đã xong
      //    Nếu WR1 feeder còn đang chơi → slot đang chờ loser, KHÔNG phải bye
      if (tour.tournament_type === 'double_elimination') {
        const wr1Start = 1;
        const lr1Start =
          tour.number_of_players > 32
            ? 33
            : tour.number_of_players > 16
              ? 17
              : 9;

        const lr1ByeCandidates = await this.matchRepo
          .createQueryBuilder('m')
          .where('m.tournament_id = :id', { id: tour.id })
          .andWhere('m.round = 1')
          .andWhere("m.bracket = 'losers'")
          .andWhere('m.status != :completed', {
            completed: TournamentMatchStatus.COMPLETED,
          })
          .andWhere(
            '((m.player1_id IS NOT NULL AND m.player2_id IS NULL) OR (m.player1_id IS NULL AND m.player2_id IS NOT NULL))',
          )
          .getMany();

        for (const lrMatch of lr1ByeCandidates) {
          const lrIdx = lrMatch.match_no - lr1Start;
          const emptySlot = lrMatch.player1_id === null ? 1 : 2;

          // 24-player format: LR1 P1 = loser of WR2 (match 16-lrIdx), P2 = loser of WR1 (match 1+lrIdx)
          // Standard format: LR1 P1 = loser of WR1 (lrIdx*2), P2 = loser of WR1 (lrIdx*2+1)
          let feederMatchNo: number;
          let feederRound: number;
          if (tour.number_of_players === 24) {
            feederMatchNo = emptySlot === 1 ? 16 - lrIdx : wr1Start + lrIdx;
            feederRound = emptySlot === 1 ? 2 : 1; // slot1 feeds from WR2, slot2 from WR1
          } else {
            feederMatchNo =
              emptySlot === 1 ? wr1Start + lrIdx * 2 : wr1Start + lrIdx * 2 + 1;
            feederRound = 1;
          }

          const feeder = await this.matchRepo.findOne({
            where: {
              tournament_id: tour.id,
              match_no: feederMatchNo,
              round: feederRound,
            },
          });

          // Chỉ complete WO khi feeder đã kết thúc VÀ là bye (chỉ có 1 người)
          if (!feeder || feeder.status !== TournamentMatchStatus.COMPLETED) {
            continue; // Feeder chưa xong → chờ
          }
          const feederWasBye = !feeder.player1_id || !feeder.player2_id;
          if (!feederWasBye) {
            continue; // Feeder có 2 người → có loser thật, không phải bye
          }

          const winnerId = lrMatch.player1_id ?? lrMatch.player2_id;
          lrMatch.status = TournamentMatchStatus.COMPLETED;
          lrMatch.winner_id = winnerId;
          await this.matchRepo.save(lrMatch);
          await this.tournamentsService.propagateAndEmit(lrMatch);
          this.logger.log(
            `Tournament ${tour.id} LR1 match ${lrMatch.match_no}: WO (feeder-${feederMatchNo} bye) → winner=${winnerId}`,
          );
        }
      }
    }
  }

  // Chạy mỗi 30 giây — tự động xếp bàn + giờ cho các vòng tiếp theo khi có bàn trống
  @Cron('*/30 * * * * *')
  async autoScheduleQualificationCron() {
    // Tự động xếp bàn đã bị vô hiệu hóa theo yêu cầu. Từ giờ sẽ xếp bàn thủ công.
    return;
  }

  // Chạy mỗi 30 giây — tự động cập nhật trạng thái giải đấu
  @Cron('*/30 * * * * *')
  async autoUpdateTournamentStatus() {
    const now = new Date();

    // upcoming → ongoing: khi đến ngày bắt đầu
    const upcomingTours = await this.tourRepo.find({
      where: { status: 'upcoming' },
    });
    const toStart = upcomingTours.filter(
      (t) => t.start_date && now >= new Date(t.start_date),
    );
    if (toStart.length > 0) {
      for (const t of toStart) t.status = 'ongoing';
      await this.tourRepo.save(toStart);
      toStart.forEach((t) =>
        this.logger.log(
          `Tournament ${t.id} "${t.name}" → ongoing (start_date: ${t.start_date})`,
        ),
      );
    }

    // ongoing → completed: khi trận chung kết đã có người thắng
    const ongoingTours = await this.tourRepo.find({
      where: { status: 'ongoing' },
    });
    const toComplete: TournamentEntity[] = [];
    for (const t of ongoingTours) {
      const finalMatchNo = this.getFinalMatchNo(t.number_of_players);
      const finalMatch = await this.matchRepo.findOne({
        where: {
          tournament_id: t.id,
          match_no: finalMatchNo,
          status: TournamentMatchStatus.COMPLETED,
        },
      });
      if (finalMatch?.winner_id) {
        t.status = 'completed';
        toComplete.push(t);
        this.logger.log(
          `Tournament ${t.id} "${t.name}" → completed (trận chung kết ${finalMatchNo}, người thắng: ${finalMatch.winner_id})`,
        );
      }
    }
    if (toComplete.length > 0) {
      await this.tourRepo.save(toComplete);
    }
  }
}
