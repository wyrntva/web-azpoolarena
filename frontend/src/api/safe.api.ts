import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Safe } from '../types/api';
import type { PaginatedResponse } from '../types/pagination';

interface CreateSafeData {
    safe_date: string;
    amount: number;
    note?: string;
}

interface UpdateSafeData extends Partial<CreateSafeData> { }

export const safeAPI = {
    getAll: (params?: { month?: number; year?: number; skip?: number; limit?: number }): Promise<AxiosResponse<PaginatedResponse<Safe>>> => {
        return axiosClient.get('/api/safes', { params });
    },

    getById: (id: number): Promise<AxiosResponse<Safe>> => {
        return axiosClient.get(`/api/safes/${id}`);
    },

    create: (data: CreateSafeData): Promise<AxiosResponse<Safe>> => {
        return axiosClient.post('/api/safes', data);
    },

    update: (id: number, data: UpdateSafeData): Promise<AxiosResponse<Safe>> => {
        return axiosClient.patch(`/api/safes/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/safes/${id}`);
    },

    getBalance: (params?: { month?: number; year?: number }): Promise<AxiosResponse<{ balance: number; bank_balance: number }>> => {
        return axiosClient.get('/api/safes/balance', { params });
    },
};
