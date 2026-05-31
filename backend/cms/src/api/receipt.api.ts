import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Receipt } from '../types/api';
import type { PaginatedResponse } from '../types/common';

interface ReceiptQueryParams {
    receipt_type_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
}

interface CreateReceiptData {
    receipt_date: string;
    receipt_type_id: number;
    amount: number;
    is_income: boolean;
    payment_method: 'cash' | 'bank';
    note?: string;
}

type UpdateReceiptData = Partial<CreateReceiptData>;

export const receiptAPI = {
    getAll: (params?: ReceiptQueryParams): Promise<AxiosResponse<PaginatedResponse<Receipt>>> => {
        return axiosClient.get('/api/receipts', { params });
    },

    create: (data: CreateReceiptData): Promise<AxiosResponse<Receipt>> => {
        return axiosClient.post('/api/receipts', data);
    },

    update: (id: number, data: UpdateReceiptData): Promise<AxiosResponse<Receipt>> => {
        return axiosClient.patch(`/api/receipts/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/receipts/${id}`);
    },
};
