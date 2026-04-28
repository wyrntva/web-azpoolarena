import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Category } from '../types/api';
import type { PaginatedResponse } from '../types/pagination';

interface CreateCategoryData {
    name: string;
    description?: string;
    parent_id?: number;
}

interface UpdateCategoryData extends Partial<CreateCategoryData> { }

export const categoryAPI = {
    getAll: (params?: { skip?: number; limit?: number; is_active?: boolean }): Promise<AxiosResponse<PaginatedResponse<Category>>> => {
        return axiosClient.get('/api/categories', { params });
    },

    getById: (id: number): Promise<AxiosResponse<Category>> => {
        return axiosClient.get(`/api/categories/${id}`);
    },

    create: (data: CreateCategoryData): Promise<AxiosResponse<Category>> => {
        return axiosClient.post('/api/categories', data);
    },

    update: (id: number, data: UpdateCategoryData): Promise<AxiosResponse<Category>> => {
        return axiosClient.put(`/api/categories/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/categories/${id}`);
    },
};
