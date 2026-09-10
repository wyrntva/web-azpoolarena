import axiosClient from './axiosClient';

export interface DailyReportManualData {
    id?: number;
    report_date: string;
    cash_income: number;
    cash_expense: number;
    bank_exchange: number;
    bank_income: number;
    bank_expense: number;
    system_revenue: number;
    note?: string;
}

export interface MonthlyFinancialReportData {
    id?: number;
    month: string;
    salary: number;
    fixed_cost: number;
    premises: number;
    yard?: number;
    cloth?: number;
    prev_month_cash_balance: number;
}

export const tempReportAPI = {
    getDailyManualReports: (params?: { start_date?: string; end_date?: string }) => {
        return axiosClient.get<DailyReportManualData[]>('/api/finance/reports/daily-manual', { params });
    },

    saveDailyManualReport: (data: Partial<DailyReportManualData> & { report_date: string }) => {
        return axiosClient.post<DailyReportManualData>('/api/finance/reports/daily-manual', data);
    },

    getMonthlySummary: (month: string) => {
        return axiosClient.get<MonthlyFinancialReportData>('/api/finance/reports/monthly-summary', {
            params: { month },
        });
    },

    saveMonthlySummary: (data: Partial<MonthlyFinancialReportData> & { month: string }) => {
        return axiosClient.post<MonthlyFinancialReportData>('/api/finance/reports/monthly-summary', data);
    },
};
