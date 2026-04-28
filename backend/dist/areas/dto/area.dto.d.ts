export declare class CreateAreaDto {
    name: string;
    description?: string;
    table_count: number;
}
export declare class UpdateAreaDto {
    name?: string;
    description?: string;
    table_count?: number;
}
export declare class TablePositionUpdateDto {
    id: number;
    x: number;
    y: number;
}
export declare class UpdateTableDto {
    name?: string;
    x?: number;
    y?: number;
    device_code?: string | null;
    device_type?: string | null;
    device_os?: string | null;
    device_id?: string | null;
    device_app_version?: string | null;
    device_ip?: string | null;
    device_mac?: string | null;
    camera_main_stream?: string | null;
    camera_sub_stream?: string | null;
}
export declare class DeviceActivationRequestDto {
    device_code: string;
    device_type?: string;
    device_os?: string;
    device_id?: string;
    device_app_version?: string;
    device_ip?: string;
    device_mac?: string;
}
export declare class DeviceStatusRequestDto {
    device_code: string;
    device_id: string;
    device_ip?: string;
    device_mac?: string;
    device_app_version?: string;
}
