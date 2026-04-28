import { AreasService } from '../services/areas.service';
import { CreateAreaDto, UpdateAreaDto, TablePositionUpdateDto, UpdateTableDto, DeviceActivationRequestDto, DeviceStatusRequestDto } from '../dto/area.dto';
export declare class AreasController {
    private readonly areasService;
    constructor(areasService: AreasService);
    findAll(): Promise<{
        id: number;
        name: string;
        description: string;
        table_count: number;
        created_at: Date;
        updated_at: Date;
        actual_table_count: number;
        tables: import("../entities/area.entity").TableEntity[];
    }[]>;
    findOne(id: number): Promise<import("../entities/area.entity").AreaEntity | null>;
    create(dto: CreateAreaDto): Promise<import("../entities/area.entity").AreaEntity | null>;
    update(id: number, dto: UpdateAreaDto): Promise<import("../entities/area.entity").AreaEntity | null>;
    remove(id: number): Promise<{
        status: string;
    }>;
    updateTablePositions(id: number, layoutData: TablePositionUpdateDto[]): Promise<import("../entities/area.entity").AreaEntity | null>;
    updateTable(id: number, tableId: number, dto: UpdateTableDto): Promise<import("../entities/area.entity").TableEntity>;
    deleteTable(id: number, tableId: number): Promise<{
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
