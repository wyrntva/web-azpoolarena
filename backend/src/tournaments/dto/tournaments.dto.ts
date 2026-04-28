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

export class UpdateTournamentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() display?: string;
  @IsOptional() @IsString() banner?: string;
  @IsOptional() @IsString() match_bracket?: string;

  // Additional match attributes can be added here
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
}
