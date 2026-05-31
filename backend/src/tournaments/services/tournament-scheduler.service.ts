import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentEntity, TournamentMatchEntity, TournamentMatchStatus } from '../entities';
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
  //   PENDING  → UPCOMING : đủ 2 người + có bàn + có giờ (giờ chưa đến)
  //   UPCOMING → PENDING  : mất bàn hoặc mất người hoặc mất giờ
  //   UPCOMING → ONGOING  : giờ đã đến + có bàn
  @Cron('*/30 * * * * *')
  async autoUpdateMatchStatus() {
    const now = new Date();

    // 1. Reset UPCOMING → PENDING nếu thiếu bất kỳ điều kiện nào
    // QUAN TRỌNG: dùng ngoặc để tránh lỗi SQL precedence với OR
    await this.matchRepo
      .createQueryBuilder()
      .update(TournamentMatchEntity)
      .set({ status: TournamentMatchStatus.PENDING })
      .where('status = :status', { status: TournamentMatchStatus.UPCOMING })
      .andWhere(
        '(player1_id IS NULL OR player2_id IS NULL OR table_no IS NULL OR match_time IS NULL)',
      )
      .execute();

    // 2. PENDING → UPCOMING: đủ 2 người + có bàn + có giờ + giờ chưa đến
    const pendingToUpcoming = await this.matchRepo
      .createQueryBuilder('m')
      .where('m.status = :status', { status: TournamentMatchStatus.PENDING })
      .andWhere('m.player1_id IS NOT NULL')
      .andWhere('m.player2_id IS NOT NULL')
      .andWhere('m.table_no IS NOT NULL')
      .andWhere('m.match_time IS NOT NULL')
      .andWhere('m.match_time > :now', { now })
      .getMany();

    if (pendingToUpcoming.length > 0) {
      for (const m of pendingToUpcoming) {
        m.status = TournamentMatchStatus.UPCOMING;
        this.logger.log(`Match ${m.match_no} (tour ${m.tournament_id}) → upcoming`);
      }
      await this.matchRepo.save(pendingToUpcoming);
      for (const m of pendingToUpcoming) {
        await this.tournamentsService.emitMatchUpdate(m.id).catch((err) =>
          this.logger.error(`Emit upcoming failed for match ${m.match_no}: ${err.message}`),
        );
      }
    }

    // 3. UPCOMING → ONGOING: giờ đã đến + có bàn
    const upcomingToOngoing = await this.matchRepo
      .createQueryBuilder('m')
      .where('m.status = :status', { status: TournamentMatchStatus.UPCOMING })
      .andWhere('m.table_no IS NOT NULL')
      .andWhere('m.match_time <= :now', { now })
      .getMany();

    if (upcomingToOngoing.length > 0) {
      for (const m of upcomingToOngoing) {
        m.status = TournamentMatchStatus.ONGOING;
        this.logger.log(`Match ${m.match_no} (tour ${m.tournament_id}) → ongoing`);
      }
      await this.matchRepo.save(upcomingToOngoing);
      for (const m of upcomingToOngoing) {
        await this.tournamentsService.emitMatchUpdate(m.id).catch((err) =>
          this.logger.error(`Emit ongoing failed for match ${m.match_no}: ${err.message}`),
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
      const allowedBrackets = tour.tournament_type === 'double_elimination'
        ? "'winners'"
        : "'winners', 'knockout'";
      const byeMatches = await this.matchRepo
        .createQueryBuilder('m')
        .where('m.tournament_id = :id', { id: tour.id })
        .andWhere('m.round = 1')
        .andWhere(`m.bracket IN (${allowedBrackets})`)
        .andWhere('m.status != :completed', { completed: TournamentMatchStatus.COMPLETED })
        .andWhere(
          '((m.player1_id IS NOT NULL AND m.player2_id IS NULL) OR (m.player1_id IS NULL AND m.player2_id IS NOT NULL))',
        )
        .getMany();

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
        const lr1Start = tour.number_of_players > 32 ? 33 : tour.number_of_players > 16 ? 17 : 9;

        const lr1ByeCandidates = await this.matchRepo
          .createQueryBuilder('m')
          .where('m.tournament_id = :id', { id: tour.id })
          .andWhere('m.round = 1')
          .andWhere("m.bracket = 'losers'")
          .andWhere('m.status != :completed', { completed: TournamentMatchStatus.COMPLETED })
          .andWhere(
            '((m.player1_id IS NOT NULL AND m.player2_id IS NULL) OR (m.player1_id IS NULL AND m.player2_id IS NOT NULL))',
          )
          .getMany();

        for (const lrMatch of lr1ByeCandidates) {
          const lrIdx = lrMatch.match_no - lr1Start;
          // slot trống → xác định WR1 feeder tương ứng
          const emptySlot = lrMatch.player1_id === null ? 1 : 2;
          const feederWR1No = emptySlot === 1
            ? wr1Start + lrIdx * 2       // WR1 match cho slot1
            : wr1Start + lrIdx * 2 + 1;  // WR1 match cho slot2

          const feederWR1 = await this.matchRepo.findOne({
            where: { tournament_id: tour.id, match_no: feederWR1No },
          });

          // Chỉ complete WO khi WR1 feeder đã kết thúc VÀ bản thân là bye (chỉ có 1 người)
          // Nếu WR1 feeder có cả 2 người → luôn tạo ra loser → không phải bye LR1
          if (!feederWR1 || feederWR1.status !== TournamentMatchStatus.COMPLETED) {
            continue; // WR1 feeder chưa xong → chờ
          }
          const feederWasBye = !feederWR1.player1_id || !feederWR1.player2_id;
          if (!feederWasBye) {
            continue; // WR1 feeder có 2 người → có loser thật, đang chờ propagation, không phải bye
          }

          const winnerId = lrMatch.player1_id ?? lrMatch.player2_id;
          lrMatch.status = TournamentMatchStatus.COMPLETED;
          lrMatch.winner_id = winnerId;
          await this.matchRepo.save(lrMatch);
          await this.tournamentsService.propagateAndEmit(lrMatch);
          this.logger.log(
            `Tournament ${tour.id} LR1 match ${lrMatch.match_no}: WO (WR1-${feederWR1No} bye) → winner=${winnerId}`,
          );
        }
      }
    }
  }

  // Chạy mỗi 30 giây — tự động xếp bàn + giờ cho các vòng tiếp theo khi có bàn trống
  @Cron('*/30 * * * * *')
  async autoScheduleQualificationCron() {
    const now = new Date();
    const fifteenMinFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Bao gồm giải đang diễn ra + giải sắp bắt đầu trong 15 phút tới
    const tours = await this.tourRepo
      .createQueryBuilder('t')
      .where('t.status = :ongoing', { ongoing: 'ongoing' })
      .orWhere(
        't.status = :upcoming AND t.start_date IS NOT NULL AND t.start_date <= :soon',
        { upcoming: 'upcoming', soon: fifteenMinFromNow },
      )
      .getMany();

    for (const tour of tours) {
      await this.tournamentsService.autoScheduleQualificationMatches(tour.id).catch((err) => {
        this.logger.error(`autoScheduleQualification failed for tournament ${tour.id}: ${err.message}`);
      });
    }
  }

  // Chạy mỗi 30 giây — tự động cập nhật trạng thái giải đấu
  @Cron('*/30 * * * * *')
  async autoUpdateTournamentStatus() {
    const now = new Date();

    // upcoming → ongoing: khi đến ngày bắt đầu
    const upcomingTours = await this.tourRepo.find({ where: { status: 'upcoming' } });
    const toStart = upcomingTours.filter(
      (t) => t.start_date && now >= new Date(t.start_date),
    );
    if (toStart.length > 0) {
      for (const t of toStart) t.status = 'ongoing';
      await this.tourRepo.save(toStart);
      toStart.forEach((t) =>
        this.logger.log(`Tournament ${t.id} "${t.name}" → ongoing (start_date: ${t.start_date})`),
      );
    }

    // ongoing → completed: khi trận chung kết đã có người thắng
    const ongoingTours = await this.tourRepo.find({ where: { status: 'ongoing' } });
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
