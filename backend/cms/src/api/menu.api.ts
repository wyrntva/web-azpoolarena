import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';

export interface MenuApiResponse {
    id: number;
    name: string;
    icon: string;
    image?: string | null;
    productIds: number[];
    sort_order: number;
    createdAt?: string | null;
}

export interface CreateMenuData {
    name: string;
    icon: string;
    image?: string | null;
    productIds: number[];
}

export interface UpdateMenuData {
    name?: string;
    icon?: string;
    image?: string | null;
    productIds?: number[];
}

export interface ReorderMenuItem {
    id: number;
    sort_order: number;
}

export const menuAPI = {
    getAll: (): Promise<AxiosResponse<MenuApiResponse[]>> => {
        return axiosClient.get('/api/menus');
    },

    getById: (id: number): Promise<AxiosResponse<MenuApiResponse>> => {
        return axiosClient.get(`/api/menus/${id}`);
    },

    create: (data: CreateMenuData): Promise<AxiosResponse<MenuApiResponse>> => {
        return axiosClient.post('/api/menus', data);
    },

    update: (id: number, data: UpdateMenuData): Promise<AxiosResponse<MenuApiResponse>> => {
        return axiosClient.put(`/api/menus/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/menus/${id}`);
    },

    reorder: (data: ReorderMenuItem[]): Promise<AxiosResponse<MenuApiResponse[]>> => {
        return axiosClient.patch('/api/menus/reorder', data);
    },
};
