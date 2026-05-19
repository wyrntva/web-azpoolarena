import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../common/enums';

// --- Work Schedules ---
export class CreateWorkScheduleDto {
  @IsNumber()
  user_id: number;

  @IsString()
  work_date: string; // YYYY-MM-DD

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Must be HH:MM format',
  })
  start_time: string;

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Must be HH:MM format',
  })
  end_time: string;

  @IsOptional()
  @IsNumber()
  allowed_late_minutes?: number;
}

export class UpdateWorkScheduleDto {
  @IsOptional() @IsString() start_time?: string;
  @IsOptional() @IsString() end_time?: string;
  @IsOptional() @IsNumber() allowed_late_minutes?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class CopyScheduleRequestDto {
  @IsNumber() user_id: number;
  @IsString() from_date: string;
  @IsArray() @IsString({ each: true }) to_dates: string[];
}

export class CopyWeekScheduleRequestDto {
  @IsString() from_week_start: string;
  @IsString() to_week_start: string;
  @IsOptional() @IsArray() @IsNumber({}, { each: true }) user_ids?: number[];
}

// --- Attendance Settings ---
export class PenaltyTierDto {
  @IsOptional() @IsNumber() max_minutes: number | null;
  @IsNumber() penalty_amount: number;
}

export class CreateAttendanceSettingsDto {
  @IsOptional() @IsNumber() allowed_late_minutes?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PenaltyTierDto) penalty_tiers: PenaltyTierDto[];
  @IsOptional() @IsNumber() early_checkout_grace_minutes?: number;
  @IsOptional() @IsNumber() early_checkout_penalty?: number;
  @IsOptional() @IsNumber() missing_checkout_penalty?: number;
  @IsOptional() @IsNumber() absent_penalty?: number;
  @IsOptional() @IsBoolean() auto_absent_enabled?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAttendanceSettingsDto {
  @IsOptional() @IsNumber() allowed_late_minutes?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PenaltyTierDto) penalty_tiers?: PenaltyTierDto[];
  @IsOptional() @IsNumber() early_checkout_grace_minutes?: number;
  @IsOptional() @IsNumber() early_checkout_penalty?: number;
  @IsOptional() @IsNumber() missing_checkout_penalty?: number;
  @IsOptional() @IsNumber() absent_penalty?: number;
  @IsOptional() @IsBoolean() auto_absent_enabled?: boolean;
  @IsOptional() @IsString() notes?: string;
}

// --- Attendance Checks ---
export class PublicAttendanceCheckRequestDto {
  @IsString() pin: string;
  @IsString() qr_token: string;
  @IsOptional() @IsString() wifi_ssid?: string;
  @IsOptional() @IsString() wifi_bssid?: string;
}

export class AttendanceCheckRequestDto {
  @IsString() pin: string;
  @IsString() qr_token: string;
  @IsString() wifi_ssid: string;
  @IsString() wifi_bssid: string;
}

export class UpdateAttendanceDto {
  @IsOptional() check_in_time?: Date | null;
  @IsOptional() check_out_time?: Date | null;
  @IsOptional() @IsString() notes?: string;
}

export class CreateManualAttendanceDto {
  @IsNumber() user_id: number;
  @IsString() date: string; // YYYY-MM-DD
  @IsOptional() check_in_time?: Date | null;
  @IsOptional() check_out_time?: Date | null;
  @IsOptional() @IsString() notes?: string;
}

export class CreateQRTokenDto {
  @IsString() token_type: string;
}

// --- WiFi Configs ---
export class CreateWiFiConfigDto {
  @IsString() ssid: string;
  @IsOptional() @IsString() bssid?: string;
  @IsOptional() @IsString() ip_range?: string;
  @IsOptional() @IsString() ip_subnet?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateWiFiConfigDto {
  @IsOptional() @IsString() ssid?: string;
  @IsOptional() @IsString() bssid?: string;
  @IsOptional() @IsString() ip_range?: string;
  @IsOptional() @IsString() ip_subnet?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

// --- Payroll ---
export class CreateAdvancePaymentDto {
  @IsNumber() user_id: number;
  @IsString() date: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAdvancePaymentDto {
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreateBonusDto {
  @IsNumber() user_id: number;
  @IsString() date: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateBonusDto {
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePenaltyDto {
  @IsNumber() user_id: number;
  @IsString() date: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePenaltyDto {
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() notes?: string;
}

// --- QR Access ---
export class RegisterQRDeviceDto {
  @IsString() device_name: string;
}

export class RequestQRAccessTokenDto {
  @IsString() device_id: string;
  @IsString() purpose: string;
}
