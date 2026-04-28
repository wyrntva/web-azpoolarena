import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { ReceiptType } from '../types/api';
import type { PaginatedResponse } from '../types/pagination';

interface CreateReceiptTypeData {
    name: string;
    is_active?: boolean;
    is_inventory?: boolean;
    description?: string;
}

interface UpdateReceiptTypeData extends Partial<CreateReceiptTypeData> { }

export const receiptTypeAPI = {
    getAll: (params?: { active_only?: boolean; skip?: number; limit?: number }): Promise<AxiosResponse<PaginatedResponse<ReceiptType>>> => {
        return axiosClient.get('/api/receipt-types', { params });
    },

    getById: (id: number): Promise<AxiosResponse<ReceiptType>> => {
        return axiosClient.get(`/api/receipt-types/${id}`);
    },

    create: (data: CreateReceiptTypeData): Promise<AxiosResponse<ReceiptType>> => {
        return axiosClient.post('/api/receipt-types', data);
    },

    update: (id: number, data: UpdateReceiptTypeData): Promise<AxiosResponse<ReceiptType>> => {
        return axiosClient.patch(`/api/receipt-types/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/receipt-types/${id}`);
    },
};
