import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Debt } from '../types/api';
import type { PaginatedResponse } from '../types/common';

interface DebtQueryParams {
    is_paid?: boolean;
    start_date?: string;
    end_date?: string;
}

interface CreateDebtData {
    debtor_name: string;
    amount: number;
    note?: string;
    debt_date?: string;
    is_paid?: boolean;
}

interface UpdateDebtData extends Partial<CreateDebtData> { }

export const debtAPI = {
    getDebts: (params?: DebtQueryParams): Promise<AxiosResponse<PaginatedResponse<Debt>>> => {
        return axiosClient.get('/api/debts', { params });
    },

    getById: (id: number): Promise<AxiosResponse<Debt>> => {
        return axiosClient.get(`/api/debts/${id}`);
    },

    create: (data: CreateDebtData): Promise<AxiosResponse<Debt>> => {
        return axiosClient.post('/api/debts', data);
    },

    update: (id: number, data: UpdateDebtData): Promise<AxiosResponse<Debt>> => {
        return axiosClient.put(`/api/debts/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/debts/${id}`);
    },
};
