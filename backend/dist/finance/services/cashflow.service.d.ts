import { Repository } from 'typeorm';
import { RevenueEntity, ExchangeEntity, SafeEntity, DebtEntity } from '../entities';
import { CreateRevenueDto, UpdateRevenueDto, CreateExchangeDto, CreateSafeDto, CreateDebtDto, UpdateDebtDto } from '../dto/finance.dto';
export declare class CashflowService {
    private revRepo;
    private excRepo;
    private safeRepo;
    private debtRepo;
    constructor(revRepo: Repository<RevenueEntity>, excRepo: Repository<ExchangeEntity>, safeRepo: Repository<SafeEntity>, debtRepo: Repository<DebtEntity>);
    findRevenueByDate(date: string): Promise<RevenueEntity | null>;
    getRevenuesByMonth(month: string): Promise<RevenueEntity[]>;
    upsertRevenue(dto: CreateRevenueDto | UpdateRevenueDto, date: string, userId: number): Promise<RevenueEntity>;
    createExchange(dto: CreateExchangeDto, userId: number): Promise<ExchangeEntity>;
    findExchanges(startDate?: string, endDate?: string): Promise<ExchangeEntity[]>;
    deleteExchange(id: number): Promise<null>;
    createSafe(dto: CreateSafeDto, userId: number): Promise<SafeEntity>;
    findSafes(startDate?: string, endDate?: string): Promise<SafeEntity[]>;
    deleteSafe(id: number): Promise<null>;
    createDebt(dto: CreateDebtDto, userId: number): Promise<DebtEntity>;
    findDebts(isPaid?: boolean): Promise<DebtEntity[]>;
    updateDebt(id: number, dto: UpdateDebtDto): Promise<DebtEntity>;
    deleteDebt(id: number): Promise<null>;
}
