import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';

// =====================
// Type Definitions
// =====================
export interface Table {
    id: number;
    name: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    device_code?: string | null;
    device_type?: string | null;
    device_os?: string | null;
    device_id?: string | null;
    device_app_version?: string | null;
    device_ip?: string | null;
    device_mac?: string | null;
    device_activated_at?: string | null;
    camera_main_stream?: string | null;
    camera_sub_stream?: string | null;
}

export interface Area {
    id: number;
    name: string;
    description?: string | null;
    table_count: number;
    tables?: Table[];
}

export interface AreaListItem {
    id: number;
    name: string;
    description?: string | null;
    table_count: number;
    actual_table_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface AreaCreate {
    name: string;
    description?: string;
    table_count: number;
}

export type AreaUpdate = Partial<AreaCreate>;

export interface TablePositionUpdate {
    id: number;
    x: number;
    y: number;
}

export interface TableUpdate {
    name?: string;
    device_code?: string;
    camera_main_stream?: string;
    camera_sub_stream?: string;
}

// =====================
// API Methods
// =====================
export const areaAPI = {
    // ---- Areas ----
    getAll: (params?: { skip?: number; limit?: number }): Promise<AxiosResponse<AreaListItem[]>> => {
        return axiosClient.get('/api/areas', { params });
    },

    getById: (id: number): Promise<AxiosResponse<Area>> => {
        return axiosClient.get(`/api/areas/${id}`);
    },

    create: (data: AreaCreate): Promise<AxiosResponse<Area>> => {
        return axiosClient.post('/api/areas', data);
    },

    update: (id: number, data: AreaUpdate): Promise<AxiosResponse<Area>> => {
        return axiosClient.put(`/api/areas/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/areas/${id}`);
    },

    // ---- Tables/Layout ----
    updateLayout: (areaId: number, layoutData: TablePositionUpdate[]): Promise<AxiosResponse<Area>> => {
        return axiosClient.put(`/api/areas/${areaId}/update_tables_layout`, layoutData);
    },

    updateTable: (areaId: number, tableId: number, data: TableUpdate): Promise<AxiosResponse<Table>> => {
        return axiosClient.put(`/api/areas/${areaId}/tables/${tableId}`, data);
    },

    deleteTable: (areaId: number, tableId: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/areas/${areaId}/tables/${tableId}`);
    },
};
