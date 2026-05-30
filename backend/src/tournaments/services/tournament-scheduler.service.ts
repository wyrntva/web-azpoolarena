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

  // Chạy mỗi 30 giây — tự động cập nhật trạng thái trận đấu theo match_time
  @Cron('*/30 * * * * *')
  async autoUpdateMatchStatus() {
    const now = new Date();
    const tenMinFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    // Reset về pending các match trống (không có player) đang bị sai trạng thái upcoming
    await this.matchRepo
      .createQueryBuilder()
      .update(TournamentMatchEntity)
      .set({ status: TournamentMatchStatus.PENDING })
      .where('player1_id IS NULL')
      .andWhere('player2_id IS NULL')
      .andWhere('status = :status', { status: TournamentMatchStatus.UPCOMING })
      .execute();

    const matches = await this.matchRepo
      .createQueryBuilder('m')
      .where('m.status NOT IN (:...statuses)', {
        statuses: [TournamentMatchStatus.COMPLETED, TournamentMatchStatus.ONGOING],
      })
      .andWhere('m.match_time IS NOT NULL')
      .andWhere('m.player1_id IS NOT NULL')
      .andWhere('m.player2_id IS NOT NULL')
      .andWhere('m.match_time <= :tenMinFromNow', { tenMinFromNow })
      .getMany();

    if (matches.length === 0) return;

    const toUpdate: TournamentMatchEntity[] = [];

    for (const match of matches) {
      const matchTime = new Date(match.match_time);

      if (now >= matchTime && match.status !== TournamentMatchStatus.ONGOING) {
        match.status = TournamentMatchStatus.ONGOING;
        toUpdate.push(match);
        this.logger.log(`Match ${match.match_no} → ongoing (match_time: ${matchTime.toISOString()})`);
      } else if (now < matchTime && match.status === TournamentMatchStatus.PENDING) {
        // Chỉ đổi upcoming để hiển thị trong UI admin, không ảnh hưởng scoreboard
        match.status = TournamentMatchStatus.UPCOMING;
        toUpdate.push(match);
        this.logger.log(`Match ${match.match_no} → upcoming (match_time: ${matchTime.toISOString()})`);
      }
    }

    if (toUpdate.length > 0) {
      await this.matchRepo.save(toUpdate);
      for (const m of toUpdate) {
        await this.tournamentsService.emitMatchUpdate(m.id).catch((err) => {
          this.logger.error(`Failed to emit scheduler match status update for match ${m.match_no}: ${err.message}`);
        });
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
      // Tìm các trận vòng 1 chỉ có đúng 1 player, chưa completed
      const byeMatches = await this.matchRepo
        .createQueryBuilder('m')
        .where('m.tournament_id = :id', { id: tour.id })
        .andWhere('m.round = 1')
        .andWhere('m.status != :completed', { completed: TournamentMatchStatus.COMPLETED })
        .andWhere(
          '(m.player1_id IS NOT NULL AND m.player2_id IS NULL) OR (m.player1_id IS NULL AND m.player2_id IS NOT NULL)',
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
    }
  }

  // Chạy mỗi 30 giây — tự động xếp bàn + giờ cho các vòng tiếp theo khi có bàn trống
  @Cron('*/30 * * * * *')
  async autoScheduleQualificationCron() {
    const activeTours = await this.tourRepo.find({ where: { status: 'ongoing' } });
    for (const tour of activeTours) {
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
