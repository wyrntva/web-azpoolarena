import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosOrderItemCreateDto {
  @IsNumber()
  product_id: number;

  @IsNumber()
  qty: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsBoolean()
  is_time_based?: boolean = false;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class PosOrderCreateDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsNumber()
  table_id?: number;

  @IsOptional()
  @IsNumber()
  area_id?: number;

  @IsOptional()
  @IsString()
  table_name?: string;

  @IsOptional()
  @IsNumber()
  table_number?: number;

  @IsOptional()
  @IsString()
  order_type?: string = 'dine-in';

  @IsOptional()
  @IsString()
  payment_info?: string;

  @IsOptional()
  @IsNumber()
  customer_count?: number = 1;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemCreateDto)
  items: PosOrderItemCreateDto[];

  @IsOptional()
  @IsString()
  status?: string = 'pending';

  @IsOptional()
  @IsString()
  created_at?: string;
}
