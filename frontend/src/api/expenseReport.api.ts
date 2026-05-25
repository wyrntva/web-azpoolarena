import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';

interface ExpenseReportParams {
    start_date?: string;
    end_date?: string;
    type?: 'income' | 'expense' | 'all';
}

interface ExpenseReportData {
    total_income: number;
    total_expense: number;
    net: number;
    income_by_type: Array<{
        type_name: string;
        total: number;
    }>;
    expense_by_type: Array<{
        type_name: string;
        total: number;
    }>;
}

interface MonthlyExpenseReportData {
    month: string;
    total_expenses: number;
    categories: Array<{
        category_id?: number | null;
        category_name: string;
        total_amount: number;
        is_salary?: boolean;
    }>;
}

export const expenseReportAPI = {
    getReport: (params?: ExpenseReportParams): Promise<AxiosResponse<ExpenseReportData>> => {
        return axiosClient.get('/api/expense-report', { params });
    },

    exportReport: (params?: ExpenseReportParams): Promise<AxiosResponse<Blob>> => {
        return axiosClient.get('/api/expense-report/export', {
            params,
            responseType: 'blob',
        });
    },

    // Backward compatibility
    getMonthlyExpenseReport(month: string): Promise<AxiosResponse<MonthlyExpenseReportData>> {
        return axiosClient.get('/api/expense-report/monthly', { params: { month } });
    },
};
