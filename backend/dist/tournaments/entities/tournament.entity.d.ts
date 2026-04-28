import { PoolArenaUserGender, ScoringRuleType } from '../../common/enums';
export declare class PoolArenaUserEntity {
    id: number;
    full_name: string;
    gender: PoolArenaUserGender;
    address: string;
    rank: string;
    phone_number: string;
    email: string;
    avatar_url: string;
    hashed_password: string;
    role: string;
    is_active: boolean;
    is_phone_verified: boolean;
    is_email_verified: boolean;
    points: number;
    tiktok_url: string;
    facebook_url: string;
    instagram_url: string;
    total_games: number;
    wins: number;
    losses: number;
    created_at: Date;
    updated_at: Date;
    get win_rate(): number;
}
export declare class TournamentRankEntity {
    id: number;
    order: number;
    name: string;
    min_score: number;
    max_score: number;
    default_score: number;
    created_at: Date;
    updated_at: Date;
}
export declare class TournamentRoundEntity {
    id: number;
    name: string;
    description: string;
    order: number;
    tournament_type: string;
    number_of_players: number;
    multiplier: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class ScoringRuleEntity {
    id: number;
    name: string;
    description: string;
    position: number;
    points: number;
    rule_type: ScoringRuleType;
    created_at: Date;
    updated_at: Date;
}
export declare class TournamentEntity {
    id: number;
    name: string;
    slug: string;
    banner: string;
    organizer_logo: string;
    sponsor_logos: string;
    ranks: string;
    display: string;
    public_date: Date;
    status: string;
    tournament_type: string;
    knockout_from_round: string;
    competition_format: string;
    number_of_players: number;
    start_date: Date;
    registration_start_date: Date;
    registration_end_date: Date;
    location: string;
    organizer: string;
    support_phone: string;
    can_register: boolean;
    free_table_fee: boolean;
    pre_payment: boolean;
    registration_fee: number;
    total_prize: number;
    first_prize: number;
    second_prize: number;
    third_prize: number;
    top_5_8_prize: number;
    top_9_16_prize: number;
    top_17_32_prize: number;
    top_33_64_prize: number;
    top_65_128_prize: number;
    top_129_256_prize: number;
    has_draw: boolean;
    draw_touch: string;
    handicap_1_touch: string;
    handicap_2_touch: string;
    round_1_64: boolean;
    round_1_16: boolean;
    round_1_32: boolean;
    round_1_8: boolean;
    semi_final: string;
    final: string;
    created_at: Date;
    updated_at: Date;
}
export declare class TournamentRegistrationEntity {
    id: number;
    tournament_id: number;
    user_id: number;
    registered_at: Date;
    tournament: TournamentEntity;
    user: PoolArenaUserEntity;
}
export declare class TournamentMatchEntity {
    id: number;
    tournament_id: number;
    match_no: number;
    bracket: string;
    round: number;
    player1_id: number;
    player2_id: number;
    player1_score: number;
    player2_score: number;
    table_no: string;
    match_time: Date;
    status: string;
    player1_check_in: string;
    player2_check_in: string;
    winner_id: number;
    created_at: Date;
    updated_at: Date;
    tournament: TournamentEntity;
    player1: PoolArenaUserEntity;
    player2: PoolArenaUserEntity;
    winner: PoolArenaUserEntity;
}
