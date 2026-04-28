import { PayrollService } from '../services/payroll.service';
import { CreateAdvancePaymentDto, UpdateAdvancePaymentDto, CreateBonusDto, UpdateBonusDto, CreatePenaltyDto, UpdatePenaltyDto } from '../dto/hr.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    getAdvances(startDate?: string, endDate?: string, userIdStr?: string): Promise<any[]>;
    createAdvance(dto: CreateAdvancePaymentDto, req: any): Promise<import("../entities").AdvancePaymentEntity>;
    updateAdvance(id: number, dto: UpdateAdvancePaymentDto): Promise<import("../entities").AdvancePaymentEntity>;
    deleteAdvance(id: number): Promise<{
        message: string;
    }>;
    getBonuses(startDate?: string, endDate?: string, userIdStr?: string): Promise<any[]>;
    createBonus(dto: CreateBonusDto, req: any): Promise<import("../entities").BonusEntity>;
    updateBonus(id: number, dto: UpdateBonusDto): Promise<import("../entities").BonusEntity>;
    deleteBonus(id: number): Promise<{
        message: string;
    }>;
    getPenalties(startDate?: string, endDate?: string, userIdStr?: string): Promise<any[]>;
    createPenalty(dto: CreatePenaltyDto, req: any): Promise<import("../entities").PenaltyEntity>;
    updatePenalty(id: number, dto: UpdatePenaltyDto): Promise<import("../entities").PenaltyEntity>;
    deletePenalty(id: number): Promise<{
        message: string;
    }>;
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
    autoGeneratePenalties(startDate: string, endDate: string, req: any): Promise<{
        message: string;
        created: number;
        data: any[];
    }>;
}
