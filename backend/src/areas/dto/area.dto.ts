import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAreaDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  table_count: number;
}

export class UpdateAreaDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() table_count?: number;
}

export class TablePositionUpdateDto {
  @IsNumber()
  id: number;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsString()
  device_code?: string | null;

  @IsOptional()
  @IsString()
  device_type?: string | null;

  @IsOptional()
  @IsString()
  device_os?: string | null;

  @IsOptional()
  @IsString()
  device_id?: string | null;

  @IsOptional()
  @IsString()
  device_app_version?: string | null;

  @IsOptional()
  @IsString()
  device_ip?: string | null;

  @IsOptional()
  @IsString()
  device_mac?: string | null;

  @IsOptional()
  @IsString()
  camera_main_stream?: string | null;

  @IsOptional()
  @IsString()
  camera_sub_stream?: string | null;
}

export class DeviceActivationRequestDto {
  @IsString()
  device_code: string;

  @IsOptional()
  @IsString()
  device_type?: string;

  @IsOptional()
  @IsString()
  device_os?: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsString()
  device_app_version?: string;

  @IsOptional()
  @IsString()
  device_ip?: string;

  @IsOptional()
  @IsString()
  device_mac?: string;
}

export class DeviceStatusRequestDto {
  @IsString()
  device_code: string;

  @IsString()
  device_id: string;

  @IsOptional()
  @IsString()
  device_ip?: string;

  @IsOptional()
  @IsString()
  device_mac?: string;

  @IsOptional()
  @IsString()
  device_app_version?: string;
}
