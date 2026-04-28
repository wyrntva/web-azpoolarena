import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Role } from '../types/api';

interface CreateRoleData {
    name: string;
    permissions: string[];
    requires_timekeeping?: boolean;
}

interface UpdateRoleData extends Partial<CreateRoleData> { }

export const roleAPI = {
    getRoles: (params?: Record<string, any>): Promise<AxiosResponse<Role[]>> => {
        return axiosClient.get('/api/roles', { params });
    },

    getRole: (id: number): Promise<AxiosResponse<Role>> => {
        return axiosClient.get(`/api/roles/${id}`);
    },

    createRole: (data: CreateRoleData): Promise<AxiosResponse<Role>> => {
        return axiosClient.post('/api/roles', data);
    },

    updateRole: (id: number, data: UpdateRoleData): Promise<AxiosResponse<Role>> => {
        return axiosClient.patch(`/api/roles/${id}`, data);
    },

    deleteRole: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/roles/${id}`);
    },
};
