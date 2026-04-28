import { Repository } from 'typeorm';
import { AdvancePaymentEntity, BonusEntity, PenaltyEntity, AttendanceEntity, WorkScheduleEntity, AttendanceSettingsEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { CreateAdvancePaymentDto, UpdateAdvancePaymentDto, CreateBonusDto, UpdateBonusDto, CreatePenaltyDto, UpdatePenaltyDto } from '../dto/hr.dto';
export declare class PayrollService {
    private readonly advanceRepo;
    private readonly bonusRepo;
    private readonly penaltyRepo;
    private readonly attendanceRepo;
    private readonly scheduleRepo;
    private readonly settingsRepo;
    private readonly userRepo;
    constructor(advanceRepo: Repository<AdvancePaymentEntity>, bonusRepo: Repository<BonusEntity>, penaltyRepo: Repository<PenaltyEntity>, attendanceRepo: Repository<AttendanceEntity>, scheduleRepo: Repository<WorkScheduleEntity>, settingsRepo: Repository<AttendanceSettingsEntity>, userRepo: Repository<UserEntity>);
    createAdvance(dto: CreateAdvancePaymentDto, currentUserId: number): Promise<AdvancePaymentEntity>;
    updateAdvance(id: number, dto: UpdateAdvancePaymentDto): Promise<AdvancePaymentEntity>;
    deleteAdvance(id: number): Promise<null>;
    findAllAdvances(userId?: number, startDate?: string, endDate?: string): Promise<any[]>;
    createBonus(dto: CreateBonusDto, currentUserId: number): Promise<BonusEntity>;
    updateBonus(id: number, dto: UpdateBonusDto): Promise<BonusEntity>;
    deleteBonus(id: number): Promise<null>;
    findAllBonuses(userId?: number, startDate?: string, endDate?: string): Promise<any[]>;
    createPenalty(dto: CreatePenaltyDto, currentUserId: number): Promise<PenaltyEntity>;
    updatePenalty(id: number, dto: UpdatePenaltyDto): Promise<PenaltyEntity>;
    deletePenalty(id: number): Promise<null>;
    findAllPenalties(userId?: number, startDate?: string, endDate?: string): Promise<any[]>;
    getSummary(month: string): Promise<{
        user_id: number;
        user_name: string;
        month: string;
        total_hours: number;
        total_advances: any;
        total_bonuses: any;
        total_penalties: any;
        net_adjustment: number;
    }[]>;
    autoGeneratePenalties(startDateStr: string, endDateStr: string, currentUserId: number): Promise<{
        message: string;
        created: number;
        data: any[];
    }>;
}
