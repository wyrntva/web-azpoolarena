import { Repository } from 'typeorm';
import { AttendanceSettingsEntity } from '../entities';
import { CreateAttendanceSettingsDto, UpdateAttendanceSettingsDto } from '../dto/hr.dto';
export declare class AttendanceSettingsService {
    private readonly settingsRepo;
    constructor(settingsRepo: Repository<AttendanceSettingsEntity>);
    private getDefaultPenaltyTiers;
    private mapResponse;
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
