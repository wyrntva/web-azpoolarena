export declare class AreaEntity {
    id: number;
    name: string;
    description: string;
    table_count: number;
    created_at: Date;
    updated_at: Date;
    tables: TableEntity[];
}
export declare class TableEntity {
    id: number;
    name: string;
    area_id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    device_code: string;
    device_type: string;
    device_os: string;
    device_id: string;
    device_app_version: string;
    device_ip: string;
    device_mac: string;
    device_activated_at: Date;
    camera_main_stream: string;
    camera_sub_stream: string;
    created_at: Date;
    updated_at: Date;
    area: AreaEntity;
}
