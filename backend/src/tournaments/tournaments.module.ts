import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TournamentEntity,
  TournamentMatchEntity,
  TournamentRegistrationEntity,
  TournamentRankEntity,
  TournamentRoundEntity,
  ScoringRuleEntity,
} from './entities';
import { TournamentsService } from './services/tournaments.service';
import { TournamentsController } from './controllers/tournaments.controller';
import { TournamentSettingsService } from './services/tournament-settings.service';
import { TournamentSettingsController } from './controllers/tournament-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentEntity,
      TournamentMatchEntity,
      TournamentRegistrationEntity,
      TournamentRankEntity,
      TournamentRoundEntity,
      ScoringRuleEntity,
    ]),
  ],
  controllers: [TournamentsController, TournamentSettingsController],
  providers: [TournamentsService, TournamentSettingsService],
  exports: [TournamentsService, TournamentSettingsService],
})
export class TournamentsModule {}
