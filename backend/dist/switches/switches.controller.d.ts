import { SwitchesService } from './switches.service';
export declare class SwitchesController {
    private readonly switchesService;
    constructor(switchesService: SwitchesService);
    findAll(): Promise<import("./entities/switch.entity").SwitchEntity[]>;
    create(dto: any): Promise<import("./entities/switch.entity").SwitchEntity>;
    update(id: number, dto: any): Promise<import("./entities/switch.entity").SwitchEntity>;
    remove(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getEspStatus(code: string, ip?: string): Promise<{
        relays: {
            channel: number;
            active: boolean;
            name: string;
        }[];
    }>;
    handleScoreboardReport(data: {
        table_name: string;
        is_active: boolean;
    }): Promise<void>;
    handleDeviceDiscovery(data: {
        name: string;
        switch_type: string;
        is_active?: boolean;
    }): Promise<void>;
}
