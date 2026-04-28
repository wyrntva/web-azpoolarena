import { AttendanceSettingsService } from '../services/attendance-settings.service';
import { CreateAttendanceSettingsDto, UpdateAttendanceSettingsDto } from '../dto/hr.dto';
export declare class AttendanceSettingsController {
    private readonly settingsService;
    constructor(settingsService: AttendanceSettingsService);
    getSettings(): Promise<{
        id: number;
        allowed_late_minutes: number;
        penalty_tiers: any;
        early_checkout_grace_minutes: number;
        early_checkout_penalty: number;
        absent_penalty: number;
        auto_absent_enabled: boolean;
        notes: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    updateSettings(dto: UpdateAttendanceSettingsDto): Promise<{
        id: number;
        allowed_late_minutes: number;
        penalty_tiers: any;
        early_checkout_grace_minutes: number;
        early_checkout_penalty: number;
        absent_penalty: number;
        auto_absent_enabled: boolean;
        notes: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    createSettings(dto: CreateAttendanceSettingsDto): Promise<{
        id: number;
        allowed_late_minutes: number;
        penalty_tiers: any;
        early_checkout_grace_minutes: number;
        early_checkout_penalty: number;
        absent_penalty: number;
        auto_absent_enabled: boolean;
        notes: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
}
