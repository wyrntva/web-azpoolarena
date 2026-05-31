import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TournamentEntity,
  TournamentMatchEntity,
  TournamentRegistrationEntity,
  TournamentRankEntity,
  TournamentRoundEntity,
  ScoringRuleEntity,
  PaymentCodeEntity,
} from './entities';
import { TournamentsService } from './services/tournaments.service';
import { TournamentsController } from './controllers/tournaments.controller';
import { TournamentSettingsService } from './services/tournament-settings.service';
import { TournamentSettingsController } from './controllers/tournament-settings.controller';
import { TournamentSchedulerService } from './services/tournament-scheduler.service';
import { UserEntity } from '../users/entities/user.entity';
import { TableEntity } from '../areas/entities/area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentEntity,
      TournamentMatchEntity,
      TournamentRegistrationEntity,
      TournamentRankEntity,
      TournamentRoundEntity,
      ScoringRuleEntity,
      PaymentCodeEntity,
      UserEntity,
      TableEntity,
    ]),
  ],
  controllers: [TournamentsController, TournamentSettingsController],
  providers: [TournamentsService, TournamentSettingsService, TournamentSchedulerService],
  exports: [TournamentsService, TournamentSettingsService],
})
export class TournamentsModule {}
