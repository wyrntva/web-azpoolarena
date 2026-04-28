import { ReportsService } from '../services/reports.service';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
    getMonthlyExpenseReport(month: string): Promise<{
        month: string;
        categories: any[];
        total_expenses: any;
    }>;
}
