import { Repository } from 'typeorm';
import { SwitchEntity } from './entities/switch.entity';
import { AreaEntity, TableEntity } from '../areas/entities/area.entity';
export declare class SwitchesService {
    private readonly switchRepo;
    private readonly tableRepo;
    private readonly areaRepo;
    private readonly logger;
    private mqttClient;
    constructor(switchRepo: Repository<SwitchEntity>, tableRepo: Repository<TableEntity>, areaRepo: Repository<AreaEntity>);
    findAll(): Promise<SwitchEntity[]>;
    create(dto: Partial<SwitchEntity>): Promise<SwitchEntity>;
    update(id: number, dto: Partial<SwitchEntity>): Promise<SwitchEntity>;
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
    updateStatusByReport(tableName: string, isActive: boolean): Promise<void>;
    handleDiscovery(data: {
        name: string;
        switch_type: string;
        is_active?: boolean;
    }): Promise<void>;
    private sendEspCommand;
}
