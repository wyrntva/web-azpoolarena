"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentMatchEntity = exports.TournamentMatchBracket = exports.TournamentMatchStatus = exports.TournamentRegistrationEntity = exports.TournamentEntity = exports.ScoringRuleEntity = exports.ScoringRuleType = exports.TournamentRoundEntity = exports.TournamentRankEntity = void 0;
const typeorm_1 = require("typeorm");
const entities_1 = require("../pool-arena/entities");
let TournamentRankEntity = class TournamentRankEntity {
    id;
    order;
    name;
    min_score;
    max_score;
    default_score;
    created_at;
    updated_at;
};
exports.TournamentRankEntity = TournamentRankEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TournamentRankEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unique: true }),
    __metadata("design:type", Number)
], TournamentRankEntity.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, unique: true }),
    __metadata("design:type", String)
], TournamentRankEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentRankEntity.prototype, "min_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentRankEntity.prototype, "max_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentRankEntity.prototype, "default_score", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TournamentRankEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TournamentRankEntity.prototype, "updated_at", void 0);
exports.TournamentRankEntity = TournamentRankEntity = __decorate([
    (0, typeorm_1.Entity)('tournament_ranks')
], TournamentRankEntity);
let TournamentRoundEntity = class TournamentRoundEntity {
    id;
    name;
    description;
    order;
    tournament_type;
    number_of_players;
    multiplier;
    is_active;
    created_at;
    updated_at;
};
exports.TournamentRoundEntity = TournamentRoundEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TournamentRoundEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TournamentRoundEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TournamentRoundEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unique: true }),
    __metadata("design:type", Number)
], TournamentRoundEntity.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentRoundEntity.prototype, "tournament_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], TournamentRoundEntity.prototype, "number_of_players", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TournamentRoundEntity.prototype, "multiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TournamentRoundEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TournamentRoundEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TournamentRoundEntity.prototype, "updated_at", void 0);
exports.TournamentRoundEntity = TournamentRoundEntity = __decorate([
    (0, typeorm_1.Entity)('tournament_rounds')
], TournamentRoundEntity);
var ScoringRuleType;
(function (ScoringRuleType) {
    ScoringRuleType["WIN"] = "win";
    ScoringRuleType["LOSE"] = "lose";
    ScoringRuleType["DRAW"] = "draw";
    ScoringRuleType["BONUS"] = "bonus";
    ScoringRuleType["PENALTY"] = "penalty";
})(ScoringRuleType || (exports.ScoringRuleType = ScoringRuleType = {}));
let ScoringRuleEntity = class ScoringRuleEntity {
    id;
    name;
    description;
    position;
    points;
    rule_type;
    created_at;
    updated_at;
};
exports.ScoringRuleEntity = ScoringRuleEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ScoringRuleEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ScoringRuleEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ScoringRuleEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unique: true }),
    __metadata("design:type", Number)
], ScoringRuleEntity.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ScoringRuleEntity.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ScoringRuleType }),
    __metadata("design:type", String)
], ScoringRuleEntity.prototype, "rule_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScoringRuleEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScoringRuleEntity.prototype, "updated_at", void 0);
exports.ScoringRuleEntity = ScoringRuleEntity = __decorate([
    (0, typeorm_1.Entity)('scoring_rules')
], ScoringRuleEntity);
let TournamentEntity = class TournamentEntity {
    id;
    name;
    slug;
    banner;
    organizer_logo;
    sponsor_logos;
    ranks;
    display;
    public_date;
    status;
    tournament_type;
    knockout_from_round;
    competition_format;
    number_of_players;
    start_date;
    registration_start_date;
    registration_end_date;
    location;
    organizer;
    support_phone;
    can_register;
    free_table_fee;
    pre_payment;
    registration_fee;
    total_prize;
    first_prize;
    second_prize;
    third_prize;
    top_5_8_prize;
    top_9_16_prize;
    top_17_32_prize;
    top_33_64_prize;
    top_65_128_prize;
    top_129_256_prize;
    has_draw;
    draw_touch;
    handicap_1_touch;
    handicap_2_touch;
    round_1_64;
    round_1_16;
    round_1_32;
    round_1_8;
    semi_final;
    final;
    created_at;
    updated_at;
};
exports.TournamentEntity = TournamentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "banner", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "organizer_logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "sponsor_logos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "ranks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'public' }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "display", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TournamentEntity.prototype, "public_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'upcoming' }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'knockout' }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "tournament_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "knockout_from_round", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "competition_format", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 32 }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "number_of_players", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TournamentEntity.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TournamentEntity.prototype, "registration_start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TournamentEntity.prototype, "registration_end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "organizer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "support_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "can_register", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "free_table_fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "pre_payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "registration_fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "total_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "first_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "second_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "third_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "top_5_8_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "top_9_16_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "top_17_32_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "top_33_64_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "top_65_128_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TournamentEntity.prototype, "top_129_256_prize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "has_draw", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "draw_touch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "handicap_1_touch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "handicap_2_touch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "round_1_64", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "round_1_16", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "round_1_32", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentEntity.prototype, "round_1_8", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "semi_final", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentEntity.prototype, "final", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TournamentEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TournamentEntity.prototype, "updated_at", void 0);
exports.TournamentEntity = TournamentEntity = __decorate([
    (0, typeorm_1.Entity)('tournaments')
], TournamentEntity);
let TournamentRegistrationEntity = class TournamentRegistrationEntity {
    id;
    tournament_id;
    user_id;
    registered_at;
    tournament;
    user;
};
exports.TournamentRegistrationEntity = TournamentRegistrationEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TournamentRegistrationEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentRegistrationEntity.prototype, "tournament_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentRegistrationEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TournamentRegistrationEntity.prototype, "registered_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TournamentEntity),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", TournamentEntity)
], TournamentRegistrationEntity.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entities_1.PoolArenaUserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", entities_1.PoolArenaUserEntity)
], TournamentRegistrationEntity.prototype, "user", void 0);
exports.TournamentRegistrationEntity = TournamentRegistrationEntity = __decorate([
    (0, typeorm_1.Entity)('tournament_registrations')
], TournamentRegistrationEntity);
var TournamentMatchStatus;
(function (TournamentMatchStatus) {
    TournamentMatchStatus["UPCOMING"] = "upcoming";
    TournamentMatchStatus["ONGOING"] = "ongoing";
    TournamentMatchStatus["COMPLETED"] = "completed";
})(TournamentMatchStatus || (exports.TournamentMatchStatus = TournamentMatchStatus = {}));
var TournamentMatchBracket;
(function (TournamentMatchBracket) {
    TournamentMatchBracket["WINNERS"] = "winners";
    TournamentMatchBracket["LOSERS"] = "losers";
    TournamentMatchBracket["KNOCKOUT"] = "knockout";
})(TournamentMatchBracket || (exports.TournamentMatchBracket = TournamentMatchBracket = {}));
let TournamentMatchEntity = class TournamentMatchEntity {
    id;
    tournament_id;
    match_no;
    bracket;
    round;
    player1_id;
    player2_id;
    player1_score;
    player2_score;
    table_no;
    match_time;
    status;
    player1_check_in;
    player2_check_in;
    winner_id;
    created_at;
    updated_at;
    tournament;
    player1;
    player2;
    winner;
};
exports.TournamentMatchEntity = TournamentMatchEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TournamentMatchEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentMatchEntity.prototype, "tournament_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentMatchEntity.prototype, "match_no", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], TournamentMatchEntity.prototype, "bracket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TournamentMatchEntity.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], TournamentMatchEntity.prototype, "player1_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], TournamentMatchEntity.prototype, "player2_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentMatchEntity.prototype, "player1_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentMatchEntity.prototype, "player2_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TournamentMatchEntity.prototype, "table_no", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TournamentMatchEntity.prototype, "match_time", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: TournamentMatchStatus.UPCOMING,
    }),
    __metadata("design:type", String)
], TournamentMatchEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'unconfirmed' }),
    __metadata("design:type", String)
], TournamentMatchEntity.prototype, "player1_check_in", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'unconfirmed' }),
    __metadata("design:type", String)
], TournamentMatchEntity.prototype, "player2_check_in", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], TournamentMatchEntity.prototype, "winner_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TournamentMatchEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TournamentMatchEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TournamentEntity),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", TournamentEntity)
], TournamentMatchEntity.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entities_1.PoolArenaUserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'player1_id' }),
    __metadata("design:type", entities_1.PoolArenaUserEntity)
], TournamentMatchEntity.prototype, "player1", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entities_1.PoolArenaUserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'player2_id' }),
    __metadata("design:type", entities_1.PoolArenaUserEntity)
], TournamentMatchEntity.prototype, "player2", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entities_1.PoolArenaUserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'winner_id' }),
    __metadata("design:type", entities_1.PoolArenaUserEntity)
], TournamentMatchEntity.prototype, "winner", void 0);
exports.TournamentMatchEntity = TournamentMatchEntity = __decorate([
    (0, typeorm_1.Entity)('tournament_matches')
], TournamentMatchEntity);
//# sourceMappingURL=entities.js.map