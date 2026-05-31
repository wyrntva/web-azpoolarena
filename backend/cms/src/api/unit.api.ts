import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Unit } from '../types/api';
import type { PaginatedResponse } from '../types/pagination';

interface CreateUnitData {
    name: string;
    abbreviation?: string;
}

type UpdateUnitData = Partial<CreateUnitData>;

export const unitAPI = {
    getAll: (params?: { skip?: number; limit?: number }): Promise<AxiosResponse<PaginatedResponse<Unit>>> => {
        return axiosClient.get('/api/units', { params });
    },

    getById: (id: number): Promise<AxiosResponse<Unit>> => {
        return axiosClient.get(`/api/units/${id}`);
    },

    create: (data: CreateUnitData): Promise<AxiosResponse<Unit>> => {
        return axiosClient.post('/api/units', data);
    },

    update: (id: number, data: UpdateUnitData): Promise<AxiosResponse<Unit>> => {
        return axiosClient.put(`/api/units/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/units/${id}`);
    },
};
