import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Exchange } from '../types/api';
import type { PaginatedResponse } from '../types/pagination';

interface ExchangeQueryParams {
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
}

interface CreateExchangeData {
    exchange_date: string;
    amount: number;
    from_account: 'cash' | 'bank';
    to_account: 'cash' | 'bank';
    note?: string;
}

interface UpdateExchangeData extends Partial<CreateExchangeData> { }

export const exchangeAPI = {
    getAll: (params?: { start_date?: string; end_date?: string; skip?: number; limit?: number }): Promise<AxiosResponse<PaginatedResponse<Exchange>>> => {
        return axiosClient.get('/api/exchanges', { params });
    },

    getById: (id: number): Promise<AxiosResponse<Exchange>> => {
        return axiosClient.get(`/api/exchanges/${id}`);
    },

    create: (data: CreateExchangeData): Promise<AxiosResponse<Exchange>> => {
        return axiosClient.post('/api/exchanges', data);
    },

    update: (id: number, data: UpdateExchangeData): Promise<AxiosResponse<Exchange>> => {
        return axiosClient.patch(`/api/exchanges/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/exchanges/${id}`);
    },
};
