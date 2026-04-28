export declare class CreateWorkScheduleDto {
    user_id: number;
    work_date: string;
    start_time: string;
    end_time: string;
    allowed_late_minutes?: number;
}
export declare class UpdateWorkScheduleDto {
    start_time?: string;
    end_time?: string;
    allowed_late_minutes?: number;
    is_active?: boolean;
}
export declare class CopyScheduleRequestDto {
    user_id: number;
    from_date: string;
    to_dates: string[];
}
export declare class CopyWeekScheduleRequestDto {
    from_week_start: string;
    to_week_start: string;
    user_ids?: number[];
}
export declare class PenaltyTierDto {
    max_minutes: number | null;
    penalty_amount: number;
}
export declare class CreateAttendanceSettingsDto {
    allowed_late_minutes?: number;
    penalty_tiers: PenaltyTierDto[];
    early_checkout_grace_minutes?: number;
    early_checkout_penalty?: number;
    absent_penalty?: number;
    auto_absent_enabled?: boolean;
    notes?: string;
}
export declare class UpdateAttendanceSettingsDto {
    allowed_late_minutes?: number;
    penalty_tiers?: PenaltyTierDto[];
    early_checkout_grace_minutes?: number;
    early_checkout_penalty?: number;
    absent_penalty?: number;
    auto_absent_enabled?: boolean;
    notes?: string;
}
export declare class PublicAttendanceCheckRequestDto {
    pin: string;
    qr_token: string;
    wifi_ssid?: string;
    wifi_bssid?: string;
}
export declare class AttendanceCheckRequestDto {
    pin: string;
    qr_token: string;
    wifi_ssid: string;
    wifi_bssid: string;
}
export declare class UpdateAttendanceDto {
    check_in_time?: Date | null;
    check_out_time?: Date | null;
    notes?: string;
}
export declare class CreateManualAttendanceDto {
    user_id: number;
    date: string;
    check_in_time?: Date | null;
    check_out_time?: Date | null;
    notes?: string;
}
export declare class CreateQRTokenDto {
    token_type: string;
}
export declare class CreateWiFiConfigDto {
    ssid: string;
    bssid?: string;
    ip_range?: string;
    ip_subnet?: string;
    description?: string;
    is_active?: boolean;
}
export declare class UpdateWiFiConfigDto {
    ssid?: string;
    bssid?: string;
    ip_range?: string;
    ip_subnet?: string;
    description?: string;
    is_active?: boolean;
}
export declare class CreateAdvancePaymentDto {
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
}
export declare class UpdateAdvancePaymentDto {
    date?: string;
    amount?: number;
    notes?: string;
}
export declare class CreateBonusDto {
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
}
export declare class UpdateBonusDto {
    date?: string;
    amount?: number;
    notes?: string;
}
export declare class CreatePenaltyDto {
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
}
export declare class UpdatePenaltyDto {
    date?: string;
    amount?: number;
    notes?: string;
}
export declare class RegisterQRDeviceDto {
    device_name: string;
}
export declare class RequestQRAccessTokenDto {
    device_id: string;
    purpose: string;
}
