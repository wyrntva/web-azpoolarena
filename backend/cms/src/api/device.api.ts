import axiosClient from './axiosClient';

export interface DeviceListItem {
    id: number;
    device_name: string;
    device_code: string;
    device_type: string;
    is_activated: boolean;
    activated_at: string | null;
    device_os: string | null;
    device_app_version: string | null;
    created_at: string;
}

export interface CreateDeviceCodeRequest {
    deviceName: string;
}

export interface CreateDeviceCodeResponse {
    success: boolean;
    deviceCode: string;
    deviceName: string;
    deviceId: number;
}

export const deviceAPI = {
    // Lấy danh sách thiết bị POS
    getAll: () => axiosClient.get<DeviceListItem[]>('/api/devices'),

    // Tạo mã thiết bị mới
    createDeviceCode: (data: CreateDeviceCodeRequest) =>
        axiosClient.post<CreateDeviceCodeResponse>('/api/devices/create-code', data),

    // Xóa thiết bị
    delete: (deviceId: number) =>
        axiosClient.delete(`/api/devices/${deviceId}`)
};
