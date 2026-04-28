import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { User } from '../types/api';

interface UserQueryParams {
    is_active?: boolean;
    role_id?: number;
    page?: number;
    page_size?: number;
}

interface CreateUserData {
    username: string;
    password: string;
    full_name: string;
    email?: string;
    role_id: number;
    is_active?: boolean;
    salary_type?: 'hourly' | 'fixed';
    hourly_rate?: number;
    fixed_salary?: number;
}

interface UpdateUserData extends Partial<CreateUserData> {
    password?: string;
}

interface UserDisplayOrder {
    user_id: number;
    display_order: number;
}

export const userAPI = {
    getUsers: (params?: UserQueryParams): Promise<AxiosResponse<User[]>> => {
        return axiosClient.get('/api/users', { params });
    },

    getAll: (params?: UserQueryParams): Promise<AxiosResponse<User[]>> => {
        return axiosClient.get('/api/users', { params });
    },

    getUser: (id: number): Promise<AxiosResponse<User>> => {
        return axiosClient.get(`/api/users/${id}`);
    },

    createUser: (data: CreateUserData): Promise<AxiosResponse<User>> => {
        return axiosClient.post('/api/users', data);
    },

    updateUser: (id: number, data: UpdateUserData): Promise<AxiosResponse<User>> => {
        return axiosClient.patch(`/api/users/${id}`, data);
    },

    deleteUser: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/users/${id}`);
    },

    updateDisplayOrder: (userOrders: UserDisplayOrder[]): Promise<AxiosResponse<void>> => {
        return axiosClient.post('/api/users/update-display-order', {
            user_orders: userOrders
        });
    },
};
