import { Repository } from 'typeorm';
import { ReceiptEntity, ReceiptTypeEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { AttendanceEntity, BonusEntity } from '../../hr/entities';
export declare class ReportsService {
    private receiptRepo;
    private receiptTypeRepo;
    private userRepo;
    private attendanceRepo;
    private bonusRepo;
    constructor(receiptRepo: Repository<ReceiptEntity>, receiptTypeRepo: Repository<ReceiptTypeEntity>, userRepo: Repository<UserEntity>, attendanceRepo: Repository<AttendanceEntity>, bonusRepo: Repository<BonusEntity>);
    getMonthlyExpenseReport(month: string): Promise<{
        month: string;
        categories: any[];
        total_expenses: any;
    }>;
}
