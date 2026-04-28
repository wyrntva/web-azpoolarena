"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
const tournaments_service_1 = require("./services/tournaments.service");
const tournaments_controller_1 = require("./controllers/tournaments.controller");
const tournament_settings_service_1 = require("./services/tournament-settings.service");
const tournament_settings_controller_1 = require("./controllers/tournament-settings.controller");
let TournamentsModule = class TournamentsModule {
};
exports.TournamentsModule = TournamentsModule;
exports.TournamentsModule = TournamentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.TournamentEntity,
                entities_1.TournamentMatchEntity,
                entities_1.TournamentRegistrationEntity,
                entities_1.TournamentRankEntity,
                entities_1.TournamentRoundEntity,
                entities_1.ScoringRuleEntity,
            ]),
        ],
        controllers: [tournaments_controller_1.TournamentsController, tournament_settings_controller_1.TournamentSettingsController],
        providers: [tournaments_service_1.TournamentsService, tournament_settings_service_1.TournamentSettingsService],
        exports: [tournaments_service_1.TournamentsService, tournament_settings_service_1.TournamentSettingsService],
    })
], TournamentsModule);
//# sourceMappingURL=tournaments.module.js.map