import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() ward?: string;
  @IsOptional() @IsString() business_type?: string;

  @IsOptional() @IsString() tiktok_url?: string;
  @IsOptional() @IsString() facebook_url?: string;
  @IsOptional() @IsString() youtube_url?: string;
  @IsOptional() @IsString() phone_number?: string;
  @IsOptional() @IsString() gmail?: string;
  @IsOptional() @IsString() social_address?: string;

  @IsOptional() @IsString() banner_scoreboard?: string;
  @IsOptional() @IsString() banner_tournament?: string;

  @IsOptional() @IsString() banner_ranking?: string;
  @IsOptional() @IsString() banner_member?: string;
}
