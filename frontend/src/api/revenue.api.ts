import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Revenue } from '../types/api';
import type { PaginatedResponse } from '../types/common';

interface RevenueQueryParams {
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}

interface CreateRevenueData {
    amount: number;
    description?: string;
    date: string;
}

type UpdateRevenueData = Partial<CreateRevenueData>;

export const revenueAPI = {
    getRevenues: (params?: RevenueQueryParams): Promise<AxiosResponse<PaginatedResponse<Revenue>>> => {
        return axiosClient.get('/api/revenues', { params });
    },

    getRevenue: (id: number): Promise<AxiosResponse<Revenue>> => {
        return axiosClient.get(`/api/revenues/${id}`);
    },

    getRevenueByDate: (date: string): Promise<AxiosResponse<Revenue>> => {
        return axiosClient.get(`/api/revenues/by-date/${date}`);
    },

    createRevenue: (data: CreateRevenueData): Promise<AxiosResponse<Revenue>> => {
        return axiosClient.post('/api/revenues', data);
    },

    updateRevenue: (id: number, data: UpdateRevenueData): Promise<AxiosResponse<Revenue>> => {
        return axiosClient.patch(`/api/revenues/${id}`, data);
    },

    deleteRevenue: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/revenues/${id}`);
    },
};
