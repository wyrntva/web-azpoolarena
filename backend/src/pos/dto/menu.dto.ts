import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuDto {
  @IsString()
  name: string;

  @IsString()
  icon: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  productIds?: number[] = [];
}

export class UpdateMenuDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsArray() productIds?: number[];
}

export class ReorderMenuDto {
  @IsNumber()
  id: number;

  @IsNumber()
  sort_order: number;
}
