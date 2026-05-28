import { IsString, IsOptional, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { PoolArenaUserGender } from '../entities';

export class CreatePoolArenaUserDto {
  @IsString() full_name: string;
  @IsString() phone_number: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() hashed_password?: string;
  @IsOptional() @IsEnum(PoolArenaUserGender) gender?: PoolArenaUserGender;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() tiktok_url?: string;
  @IsOptional() @IsString() facebook_url?: string;
  @IsOptional() @IsString() instagram_url?: string;
}

export class UpdatePoolArenaUserDto {
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(PoolArenaUserGender) gender?: PoolArenaUserGender;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() tiktok_url?: string;
  @IsOptional() @IsString() facebook_url?: string;
  @IsOptional() @IsString() instagram_url?: string;
  @IsOptional() @IsString() avatar_url?: string;
  @IsOptional() @IsString() rank?: string;
  @IsOptional() @IsNumber() points?: number;
  @IsOptional() phone_number?: string;
  @IsOptional() is_active?: boolean;
}
