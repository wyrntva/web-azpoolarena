import { AttendanceStatus, QRTokenType } from '../common/enums';
export declare class WiFiConfigEntity {
    id: number;
    ssid: string;
    bssid: string;
    ip_range: string;
    ip_subnet: string;
    description: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class QRSessionEntity {
    id: number;
    qr_token: string;
    token_type: QRTokenType;
    expires_at: Date;
    is_used: boolean;
    used_by: number;
    used_at: Date;
    created_at: Date;
}
export declare class WorkScheduleEntity {
    id: number;
    user_id: number;
    work_date: string;
    start_time: string;
    end_time: string;
    allowed_late_minutes: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    attendances: AttendanceEntity[];
    user: any;
}
export declare class AttendanceEntity {
    id: number;
    user_id: number;
    work_schedule_id: number;
    date: string;
    check_in_time: Date | null;
    check_out_time: Date | null;
    check_in_qr_token: string;
    check_out_qr_token: string;
    wifi_ssid: string;
    wifi_bssid: string;
    ip_address: string;
    status: AttendanceStatus;
    notes: string;
    created_at: Date;
    updated_at: Date;
    work_schedule: WorkScheduleEntity;
    user: any;
}
export declare class AttendanceSettingsEntity {
    id: number;
    allowed_late_minutes: number;
    penalty_tiers: string;
    early_checkout_grace_minutes: number;
    early_checkout_penalty: number;
    absent_penalty: number;
    auto_absent_enabled: boolean;
    notes: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class AdvancePaymentEntity {
    id: number;
    user_id: number;
    date: string;
    amount: number;
    notes: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
export declare class BonusEntity {
    id: number;
    user_id: number;
    date: string;
    amount: number;
    notes: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
export declare class PenaltyEntity {
    id: number;
    user_id: number;
    date: string;
    amount: number;
    notes: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
export declare class QRAccessDeviceEntity {
    id: number;
    device_id: string;
    device_name: string;
    api_key_hash: string;
    is_active: boolean;
    last_used_at: Date;
    created_at: Date;
}
export declare class QRAccessTokenEntity {
    id: number;
    access_token: string;
    device_id: string;
    purpose: string;
    expires_at: Date;
    is_used: boolean;
    used_at: Date;
    used_by_pin: string;
    created_at: Date;
    device: QRAccessDeviceEntity;
}
