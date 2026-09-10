import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';

export interface PosOrderItem {
    id: string | number;
    product_id: number;
    qty: number;
    price: number;
    isTimeBased?: boolean;
    startTime?: string | null;
    endTime?: string | null;
    note?: string;
    product?: {
        id: number;
        name: string;
        price?: number;
        sell_price?: number;
        unit?: string;
        category_id?: number;
        type?: string;
        hourly_price?: number;
        timeIntervalValue?: number;
        timeIntervalUnit?: string;
    } | null;
}

export interface PosOrder {
    id: number;
    tableId?: number;
    areaId?: number;
    tableName?: string;
    tableNumber?: number;
    status: string;
    orderType: string;
    customerCount: number;
    paymentInfo?: string;
    totalAmount: number;
    createdAt: string;
    completedAt?: string | null;
    items: PosOrderItem[];
}

export interface PosOrderQueryParams {
    order_type?: string;
    table_id?: number;
    area_id?: number;
}

export const posOrderAPI = {
    getAll: (params?: PosOrderQueryParams): Promise<AxiosResponse<PosOrder[]>> => {
        return axiosClient.get('/api/pos/orders', { params });
    },
    getById: (id: number): Promise<AxiosResponse<PosOrder>> => {
        return axiosClient.get(`/api/pos/orders/${id}`);
    },
};
