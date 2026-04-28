import { Repository } from 'typeorm';
import { AreaEntity, TableEntity } from '../entities/area.entity';
import { CreateAreaDto, UpdateAreaDto, TablePositionUpdateDto, UpdateTableDto, DeviceActivationRequestDto, DeviceStatusRequestDto } from '../dto/area.dto';
export declare class AreasService {
    private readonly areaRepo;
    private readonly tableRepo;
    private readonly logger;
    constructor(areaRepo: Repository<AreaEntity>, tableRepo: Repository<TableEntity>);
    findAll(): Promise<{
        id: number;
        name: string;
        description: string;
        table_count: number;
        created_at: Date;
        updated_at: Date;
        actual_table_count: number;
        tables: TableEntity[];
    }[]>;
    findOne(id: number): Promise<AreaEntity | null>;
    create(dto: CreateAreaDto): Promise<AreaEntity | null>;
    update(id: number, dto: UpdateAreaDto): Promise<AreaEntity | null>;
    remove(id: number): Promise<{
        status: string;
    }>;
    updateTablePositions(areaId: number, positions: TablePositionUpdateDto[]): Promise<AreaEntity | null>;
    updateTable(areaId: number, tableId: number, dto: UpdateTableDto): Promise<TableEntity>;
    deleteTable(areaId: number, tableId: number): Promise<{
        status: string;
    }>;
    verifyDevice(dto: DeviceActivationRequestDto): Promise<{
        success: boolean;
        message: string;
        table_id?: undefined;
        table_name?: undefined;
        area_id?: undefined;
        area_name?: undefined;
        camera_main_stream?: undefined;
        camera_sub_stream?: undefined;
    } | {
        success: boolean;
        table_id: number;
        table_name: string;
        area_id: number | null;
        area_name: string | null;
        message: string;
        camera_main_stream: string;
        camera_sub_stream: string;
    }>;
    checkDeviceStatus(dto: DeviceStatusRequestDto): Promise<{
        connected: boolean;
        message: string;
        table_id?: undefined;
        table_name?: undefined;
        area_id?: undefined;
        area_name?: undefined;
        camera_main_stream?: undefined;
        camera_sub_stream?: undefined;
    } | {
        connected: boolean;
        table_id: number;
        table_name: string;
        area_id: number | null;
        area_name: string | null;
        message: string;
        camera_main_stream: string;
        camera_sub_stream: string;
    }>;
}
