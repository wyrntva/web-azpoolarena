import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsArray,
} from 'class-validator';
import {
  ScoringRuleType,
  TournamentMatchBracket,
  TournamentMatchStatus,
} from '../entities';

export class CreateTournamentDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsOptional() @IsString() banner?: string | null;
  @IsOptional() @IsString() organizer_logo?: string | null;
  @IsOptional() @IsString() detail_logo?: string | null;
  @IsOptional() @IsArray() sponsor_logos?: string[];
  @IsOptional() @IsArray() ranks?: string[];
  @IsOptional() @IsString() display?: string;
  @IsOptional() @IsString() public_date?: string | null;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() tournament_type?: string;
  @IsOptional() @IsString() knockout_from_round?: string | null;
  @IsOptional() @IsString() competition_format?: string | null;
  @IsOptional() @IsNumber() number_of_players?: number;
  @IsOptional() @IsString() start_date?: string | null;
  @IsOptional() @IsString() registration_start_date?: string | null;
  @IsOptional() @IsString() registration_end_date?: string | null;
  @IsOptional() @IsString() location?: string | null;
  @IsOptional() @IsString() organizer?: string | null;
  @IsOptional() @IsString() support_phone?: string | null;
  @IsOptional() @IsBoolean() can_register?: boolean;
  @IsOptional() @IsBoolean() free_table_fee?: boolean;
  @IsOptional() @IsBoolean() pre_payment?: boolean;
  @IsOptional() @IsNumber() registration_fee?: number | null;
  @IsOptional() @IsNumber() total_prize?: number | null;
  @IsOptional() @IsNumber() first_prize?: number | null;
  @IsOptional() @IsNumber() second_prize?: number | null;
  @IsOptional() @IsNumber() third_prize?: number | null;
  @IsOptional() @IsNumber() top_5_8_prize?: number | null;
  @IsOptional() @IsNumber() top_9_16_prize?: number | null;
  @IsOptional() @IsNumber() top_17_32_prize?: number | null;
  @IsOptional() @IsNumber() top_33_64_prize?: number | null;
  @IsOptional() @IsNumber() top_65_128_prize?: number | null;
  @IsOptional() @IsNumber() top_129_256_prize?: number | null;
  @IsOptional() @IsBoolean() has_draw?: boolean;
  @IsOptional() @IsString() draw_touch?: string | null;
  @IsOptional() @IsString() handicap_1_touch?: string | null;
  @IsOptional() @IsString() handicap_2_touch?: string | null;
  @IsOptional() @IsBoolean() round_1_64?: boolean;
  @IsOptional() @IsBoolean() round_1_32?: boolean;
  @IsOptional() @IsBoolean() round_1_16?: boolean;
  @IsOptional() @IsBoolean() round_1_8?: boolean;
  @IsOptional() @IsString() quarter_final?: string | null;
  @IsOptional() @IsString() draw_from_round?: string | null;
  @IsOptional() @IsString() semi_final?: string | null;
  @IsOptional() @IsString() final?: string | null;
  @IsOptional() @IsArray() enabled_tables?: string[] | null;
  @IsOptional() @IsArray() priority_tables?: string[] | null;
}

export class UpdateTournamentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() banner?: string | null;
  @IsOptional() @IsString() organizer_logo?: string | null;
  @IsOptional() @IsString() detail_logo?: string | null;
  @IsOptional() @IsArray() sponsor_logos?: string[];
  @IsOptional() @IsArray() ranks?: string[];
  @IsOptional() @IsString() display?: string;
  @IsOptional() @IsString() public_date?: string | null;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() tournament_type?: string;
  @IsOptional() @IsString() knockout_from_round?: string | null;
  @IsOptional() @IsString() competition_format?: string | null;
  @IsOptional() @IsNumber() number_of_players?: number;
  @IsOptional() @IsString() start_date?: string | null;
  @IsOptional() @IsString() registration_start_date?: string | null;
  @IsOptional() @IsString() registration_end_date?: string | null;
  @IsOptional() @IsString() location?: string | null;
  @IsOptional() @IsString() organizer?: string | null;
  @IsOptional() @IsString() support_phone?: string | null;
  @IsOptional() @IsBoolean() can_register?: boolean;
  @IsOptional() @IsBoolean() free_table_fee?: boolean;
  @IsOptional() @IsBoolean() pre_payment?: boolean;
  @IsOptional() @IsNumber() registration_fee?: number | null;
  @IsOptional() @IsNumber() total_prize?: number | null;
  @IsOptional() @IsNumber() first_prize?: number | null;
  @IsOptional() @IsNumber() second_prize?: number | null;
  @IsOptional() @IsNumber() third_prize?: number | null;
  @IsOptional() @IsNumber() top_5_8_prize?: number | null;
  @IsOptional() @IsNumber() top_9_16_prize?: number | null;
  @IsOptional() @IsNumber() top_17_32_prize?: number | null;
  @IsOptional() @IsNumber() top_33_64_prize?: number | null;
  @IsOptional() @IsNumber() top_65_128_prize?: number | null;
  @IsOptional() @IsNumber() top_129_256_prize?: number | null;
  @IsOptional() @IsBoolean() has_draw?: boolean;
  @IsOptional() @IsString() draw_touch?: string | null;
  @IsOptional() @IsString() handicap_1_touch?: string | null;
  @IsOptional() @IsString() handicap_2_touch?: string | null;
  @IsOptional() @IsBoolean() round_1_64?: boolean;
  @IsOptional() @IsBoolean() round_1_32?: boolean;
  @IsOptional() @IsBoolean() round_1_16?: boolean;
  @IsOptional() @IsBoolean() round_1_8?: boolean;
  @IsOptional() @IsString() quarter_final?: string | null;
  @IsOptional() @IsString() draw_from_round?: string | null;
  @IsOptional() @IsString() semi_final?: string | null;
  @IsOptional() @IsString() final?: string | null;
  @IsOptional() @IsArray() enabled_tables?: string[] | null;
  @IsOptional() @IsArray() priority_tables?: string[] | null;
}

export class CreateMatchDto {
  @IsNumber() match_no: number;
  @IsEnum(TournamentMatchBracket) bracket: string;
  @IsNumber() round: number;
  @IsOptional() @IsNumber() player1_id?: number | null;
  @IsOptional() @IsNumber() player2_id?: number | null;
  @IsOptional() @IsDateString() match_time?: string;
}

export class UpdateMatchDto {
  @IsOptional() @IsNumber() player1_id?: number | null;
  @IsOptional() @IsNumber() player2_id?: number | null;
  @IsOptional() @IsNumber() player1_score?: number;
  @IsOptional() @IsNumber() player2_score?: number;
  @IsOptional() @IsString() table_no?: string;
  @IsOptional() @IsEnum(TournamentMatchStatus) status?: string;
  @IsOptional() @IsNumber() winner_id?: number | null;
  @IsOptional() @IsDateString() match_time?: string;
  @IsOptional() @IsString() player1_check_in?: string;
  @IsOptional() @IsString() player2_check_in?: string;
  @IsOptional() @IsString() bracket?: string;
  @IsOptional() @IsNumber() round?: number;
  @IsOptional() @IsNumber() player1_points?: number | null;
  @IsOptional() @IsNumber() player2_points?: number | null;
}
