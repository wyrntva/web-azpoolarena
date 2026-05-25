import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  type?: string = 'Tính tiền theo số lượng';

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  sellPrice?: number;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  channels?: string[];

  @IsOptional()
  @IsBoolean()
  inventoryLinked?: boolean;

  @IsOptional()
  @IsNumber()
  inventoryId?: number;

  @IsOptional()
  @IsBoolean()
  showOnScoreboard?: boolean = true;

  @IsOptional()
  @IsNumber()
  hourlyPrice?: number;

  @IsOptional()
  @IsNumber()
  timeIntervalValue?: number;

  @IsOptional()
  @IsString()
  timeIntervalUnit?: string;

  @IsOptional()
  @IsBoolean()
  firstHourEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  specialHourEnabled?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() categoryId?: number;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsNumber() sellPrice?: number;
  @IsOptional() @IsNumber() costPrice?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() channels?: string[];
  @IsOptional() @IsBoolean() inventoryLinked?: boolean;
  @IsOptional() @IsNumber() inventoryId?: number;
  @IsOptional() @IsBoolean() showOnScoreboard?: boolean;
  @IsOptional() @IsNumber() hourlyPrice?: number;
  @IsOptional() @IsNumber() timeIntervalValue?: number;
  @IsOptional() @IsString() timeIntervalUnit?: string;
  @IsOptional() @IsBoolean() firstHourEnabled?: boolean;
  @IsOptional() @IsBoolean() specialHourEnabled?: boolean;
}
