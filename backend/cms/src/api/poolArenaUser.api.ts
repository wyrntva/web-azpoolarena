import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { PoolArenaUser } from '../types/api';

interface PoolArenaUserQueryParams {
    skip?: number;
    limit?: number;
    search?: string;
    rank?: string;
    gender?: string;
}

interface PoolArenaUserListResponse {
    data: PoolArenaUser[];
    total: number;
    meta: { total: number; skip: number; limit: number };
}

interface PoolArenaUserUpdateData {
    full_name?: string;
    gender?: string | null;
    birthday?: string | null;
    address?: string | null;
    rank?: string | null;
    phone_number?: string;
    email?: string | null;
    avatar_url?: string | null;
    role?: string;
    is_active?: boolean;
    points?: number;
    tiktok_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    is_phone_verified?: boolean;
    is_email_verified?: boolean;
}

export const poolArenaUserAPI = {
    getUsers: (params?: PoolArenaUserQueryParams): Promise<AxiosResponse<PoolArenaUserListResponse>> => {
        return axiosClient.get('/api/pool-arena/users', { params });
    },

    updateUser: (id: number, data: PoolArenaUserUpdateData): Promise<AxiosResponse<PoolArenaUser>> => {
        return axiosClient.patch(`/api/pool-arena/users/${id}`, data);
    },

    deleteUser: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/pool-arena/users/${id}`);
    },

    uploadAvatar: (id: number, file: File): Promise<AxiosResponse<{ avatar_url: string }>> => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient.post(`/api/pool-arena/users/${id}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteAvatar: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/pool-arena/users/${id}/avatar`);
    },

    resetPassword: (id: number): Promise<AxiosResponse<{ message: string; default_password: string }>> => {
        return axiosClient.post(`/api/pool-arena/users/${id}/reset-password`);
    },
};
