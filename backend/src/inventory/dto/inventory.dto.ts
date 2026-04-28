import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryStatus, TransactionType, AccountType } from '../entities';

// ==================== Category ====================
export class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

// ==================== Unit ====================
export class CreateUnitDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateUnitDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

// ==================== Inventory ====================
export class CreateInventoryDto {
  @IsString() product_name: string;
  @IsNumber() quantity: number;
  @IsOptional() @IsNumber() min_quantity?: number;
  @IsNumber() category_id: number;
  @IsNumber() base_unit_id: number;
  @IsOptional() @IsNumber() conversion_unit_id?: number;
  @IsOptional() @IsNumber() conversion_rate?: number;
}

export class UpdateInventoryDto {
  @IsOptional() @IsString() product_name?: string;
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsNumber() min_quantity?: number;
  @IsOptional() @IsNumber() category_id?: number;
  @IsOptional() @IsNumber() base_unit_id?: number;
  @IsOptional() @IsNumber() conversion_unit_id?: number;
  @IsOptional() @IsNumber() conversion_rate?: number;
}

// ==================== Inventory Transaction ====================
export class TransactionDetailDto {
  @IsNumber() inventory_id: number;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() unit_type?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsEnum(AccountType) payment_method?: AccountType;
}

export class CreateTransactionDto {
  @IsString() transaction_date: string;
  @IsEnum(TransactionType) transaction_type: TransactionType;
  @IsOptional() @IsString() note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDetailDto)
  items: TransactionDetailDto[];
}
