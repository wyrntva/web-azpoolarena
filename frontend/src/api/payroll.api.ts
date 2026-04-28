import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { PayrollSummary, AdvancePayment, Bonus, Penalty } from '../types/api';

interface PayrollQueryParams {
    user_id?: number;
    month?: string;
    year?: number;
}

interface AdvancePaymentData {
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
}

interface BonusData {
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
}

interface PenaltyData {
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
}

export const payrollAPI = {
    // Payroll Summary
    getPayrollSummary: (params?: PayrollQueryParams): Promise<AxiosResponse<PayrollSummary[]>> => {
        return axiosClient.get('/api/payroll/summary', { params });
    },

    calculatePayroll: (params: { user_id: number; month: string }): Promise<AxiosResponse<PayrollSummary>> => {
        return axiosClient.post('/api/payroll/calculate', params);
    },

    // Advance Payments
    getAdvances: (params?: { user_id?: number; start_date?: string; end_date?: string }): Promise<AxiosResponse<AdvancePayment[]>> => {
        return axiosClient.get('/api/payroll/advances', { params });
    },

    createAdvance: (data: AdvancePaymentData): Promise<AxiosResponse<AdvancePayment>> => {
        return axiosClient.post('/api/payroll/advances', data);
    },

    deleteAdvance: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/payroll/advances/${id}`);
    },

    // Bonuses
    getBonuses: (params?: { user_id?: number; start_date?: string; end_date?: string }): Promise<AxiosResponse<Bonus[]>> => {
        return axiosClient.get('/api/payroll/bonuses', { params });
    },

    createBonus: (data: BonusData): Promise<AxiosResponse<Bonus>> => {
        return axiosClient.post('/api/payroll/bonuses', data);
    },

    deleteBonus: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/payroll/bonuses/${id}`);
    },

    // Penalties
    getPenalties: (params?: { user_id?: number; start_date?: string; end_date?: string }): Promise<AxiosResponse<Penalty[]>> => {
        return axiosClient.get('/api/payroll/penalties', { params });
    },

    createPenalty: (data: PenaltyData): Promise<AxiosResponse<Penalty>> => {
        return axiosClient.post('/api/payroll/penalties', data);
    },

    deletePenalty: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/payroll/penalties/${id}`);
    },

    // Update methods
    updateAdvance: (id: number, data: Partial<AdvancePaymentData>): Promise<AxiosResponse<AdvancePayment>> => {
        return axiosClient.put(`/api/payroll/advances/${id}`, data);
    },

    updateBonus: (id: number, data: Partial<BonusData>): Promise<AxiosResponse<Bonus>> => {
        return axiosClient.put(`/api/payroll/bonuses/${id}`, data);
    },

    updatePenalty: (id: number, data: Partial<PenaltyData>): Promise<AxiosResponse<Penalty>> => {
        return axiosClient.put(`/api/payroll/penalties/${id}`, data);
    },

    // Auto-generate penalties from attendance
    autoGeneratePenalties: (params: { start_date: string; end_date: string }): Promise<AxiosResponse<Penalty[]>> => {
        return axiosClient.post('/api/payroll/auto-generate-penalties', null, { params });
    },
};
