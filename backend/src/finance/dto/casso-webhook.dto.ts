import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CassoTransactionDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  tid?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  when?: string;

  @IsOptional()
  @IsString()
  cusName?: string;

  @IsOptional()
  @IsString()
  subAccount?: string;

  @IsOptional()
  @IsString()
  bankName?: string;
}

export class CassoWebhookPayloadDto {
  @IsOptional()
  error?: any;

  @IsOptional()
  data?: any;
}
