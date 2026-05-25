import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { AccountType } from '../entities';

// ==================== Receipt Type ====================
export class CreateReceiptTypeDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() category_id?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsBoolean() is_inventory?: boolean;
}

export class UpdateReceiptTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() category_id?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsBoolean() is_inventory?: boolean;
}

// ==================== Receipt ====================
export class CreateReceiptDto {
  @IsDateString() receipt_date: string;
  @IsNumber() amount: number;
  @IsNumber() receipt_type_id: number;
  @IsOptional() @IsString() note?: string;
  @IsBoolean() is_income: boolean;
  @IsEnum(AccountType) payment_method: AccountType;
}

export class UpdateReceiptDto {
  @IsOptional() @IsDateString() receipt_date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsNumber() receipt_type_id?: number;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() is_income?: boolean;
  @IsOptional() @IsEnum(AccountType) payment_method?: AccountType;
}

// ==================== Revenue ====================
export class CreateRevenueDto {
  @IsDateString() revenue_date: string;
  @IsOptional() @IsNumber() cash_revenue?: number;
  @IsOptional() @IsNumber() bank_revenue?: number;
  @IsOptional() @IsString() note?: string;
}

export class UpdateRevenueDto {
  @IsOptional() @IsNumber() cash_revenue?: number;
  @IsOptional() @IsNumber() bank_revenue?: number;
  @IsOptional() @IsString() note?: string;
}

// ==================== Exchange ====================
export class CreateExchangeDto {
  @IsDateString() exchange_date: string;
  @IsNumber() amount: number;
  @IsEnum(AccountType) from_account: AccountType;
  @IsEnum(AccountType) to_account: AccountType;
  @IsOptional() @IsString() note?: string;
}

export class UpdateExchangeDto {
  @IsOptional() @IsDateString() exchange_date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsEnum(AccountType) from_account?: AccountType;
  @IsOptional() @IsEnum(AccountType) to_account?: AccountType;
  @IsOptional() @IsString() note?: string;
}

// ==================== Safe ====================
export class CreateSafeDto {
  @IsDateString() safe_date: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() note?: string;
}

export class UpdateSafeDto {
  @IsOptional() @IsDateString() safe_date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() note?: string;
}

// ==================== Debt ====================
export class CreateDebtDto {
  @IsDateString() debt_date: string;
  @IsNumber() amount: number;
  @IsString() debtor_name: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() is_paid?: boolean;
  @IsOptional() @IsDateString() paid_date?: string;
  @IsOptional() @IsEnum(AccountType) payment_method?: AccountType;
}

export class UpdateDebtDto {
  @IsOptional() @IsDateString() debt_date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() debtor_name?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() is_paid?: boolean;
  @IsOptional() @IsDateString() paid_date?: string;
  @IsOptional() @IsEnum(AccountType) payment_method?: AccountType;
}
