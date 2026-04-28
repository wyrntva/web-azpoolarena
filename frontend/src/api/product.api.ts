import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';

export interface ProductApiResponse {
    id: number;
    name: string;
    categoryId: number | null;
    type: string;
    code?: string | null;
    sellPrice?: number | null;
    costPrice?: number | null;
    unit?: string | null;
    color?: string | null;
    image?: string | null;
    description?: string | null;
    channels?: string[] | null;
    inventoryLinked?: boolean | null;
    inventoryId?: number | null;
    hourlyPrice?: number | null;
    timeIntervalValue?: number | null;
    timeIntervalUnit?: string | null;
    firstHourEnabled?: boolean | null;
    specialHourEnabled?: boolean | null;
    showOnScoreboard?: boolean | null;
    createdAt?: string | null;
}

export interface CreateProductData {
    name: string;
    categoryId?: number | null;
    type?: string;
    code?: string | null;
    sellPrice?: number | null;
    costPrice?: number | null;
    unit?: string | null;
    color?: string | null;
    image?: string | null;
    description?: string | null;
    channels?: string[] | null;
    inventoryLinked?: boolean | null;
    inventoryId?: number | null;
    hourlyPrice?: number | null;
    timeIntervalValue?: number | null;
    timeIntervalUnit?: string | null;
    firstHourEnabled?: boolean | null;
    specialHourEnabled?: boolean | null;
    showOnScoreboard?: boolean | null;
}

export interface UpdateProductData extends Partial<CreateProductData> { }

export const productAPI = {
    getAll: (): Promise<AxiosResponse<ProductApiResponse[]>> => {
        return axiosClient.get('/api/products');
    },

    getById: (id: number): Promise<AxiosResponse<ProductApiResponse>> => {
        return axiosClient.get(`/api/products/${id}`);
    },

    create: (data: CreateProductData): Promise<AxiosResponse<ProductApiResponse>> => {
        return axiosClient.post('/api/products', data);
    },

    update: (id: number, data: UpdateProductData): Promise<AxiosResponse<ProductApiResponse>> => {
        return axiosClient.put(`/api/products/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/products/${id}`);
    },
};
