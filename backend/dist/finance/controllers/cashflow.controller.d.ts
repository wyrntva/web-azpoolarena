import { CashflowService } from '../services/cashflow.service';
import { CreateRevenueDto, UpdateRevenueDto, CreateExchangeDto, CreateSafeDto, CreateDebtDto, UpdateDebtDto } from '../dto/finance.dto';
export declare class CashflowController {
    private readonly service;
    constructor(service: CashflowService);
    getRevenue(date: string): Promise<import("../entities").RevenueEntity | null>;
    getMonthRevenue(month: string): Promise<import("../entities").RevenueEntity[]>;
    upsertRevenue(date: string, dto: CreateRevenueDto | UpdateRevenueDto, req: any): Promise<import("../entities").RevenueEntity>;
    createExchange(dto: CreateExchangeDto, req: any): Promise<import("../entities").ExchangeEntity>;
    getExchanges(startDate?: string, endDate?: string): Promise<import("../entities").ExchangeEntity[]>;
    deleteExchange(id: number): Promise<null>;
    createSafe(dto: CreateSafeDto, req: any): Promise<import("../entities").SafeEntity>;
    getSafes(startDate?: string, endDate?: string): Promise<import("../entities").SafeEntity[]>;
    deleteSafe(id: number): Promise<null>;
    createDebt(dto: CreateDebtDto, req: any): Promise<import("../entities").DebtEntity>;
    getDebts(isPaidStr?: string): Promise<import("../entities").DebtEntity[]>;
    updateDebt(id: number, dto: UpdateDebtDto): Promise<import("../entities").DebtEntity>;
    deleteDebt(id: number): Promise<null>;
}
