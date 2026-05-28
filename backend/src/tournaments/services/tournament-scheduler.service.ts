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
    const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);

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
      .andWhere('m.match_time <= :fiveMinFromNow', { fiveMinFromNow })
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
