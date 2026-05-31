import axiosClient from './axiosClient';

export interface SwitchItem {
    id: number;
    name: string;
    switch_type: string;
    description: string | null;
    device_code: string | null;
    ip_address: string | null;
    port: number | null;
    area_name: string | null;
    is_active: boolean;
    sort_order: number;
    schedule_on: string | null;
    schedule_off: string | null;
    created_at: string;
}

export interface CreateSwitchRequest {
    name: string;
    switch_type: string;
    description?: string;
    device_code?: string | null;
    port?: number;
    area_name?: string;
    sort_order?: number;
    schedule_on?: string | null;
    schedule_off?: string | null;
}

export interface UpdateSwitchRequest {
    name?: string;
    switch_type?: string;
    description?: string;
    device_code?: string | null;
    port?: number;
    area_name?: string;
    is_active?: boolean;
    sort_order?: number;
    schedule_on?: string | null;
    schedule_off?: string | null;
}

export const switchAPI = {
    // Lấy danh sách công tắc
    getAll: () => axiosClient.get<SwitchItem[]>('/api/switches'),

    // Tạo công tắc mới
    create: (data: CreateSwitchRequest) =>
        axiosClient.post<SwitchItem>('/api/switches', data),

    // Cập nhật công tắc
    update: (switchId: number, data: UpdateSwitchRequest) =>
        axiosClient.put<SwitchItem>(`/api/switches/${switchId}`, data),

    // Xóa công tắc
    delete: (switchId: number) =>
        axiosClient.delete(`/api/switches/${switchId}`),
};
