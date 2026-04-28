import { Repository } from 'typeorm';
import { WiFiConfigEntity } from '../entities';
import { CreateWiFiConfigDto, UpdateWiFiConfigDto } from '../dto/hr.dto';
export declare class WifiConfigsService {
    private readonly wifiRepo;
    constructor(wifiRepo: Repository<WiFiConfigEntity>);
    create(dto: CreateWiFiConfigDto): Promise<WiFiConfigEntity>;
    findAll(isActive?: boolean): Promise<WiFiConfigEntity[]>;
    findApproved(): Promise<{
        id: number;
        ssid: string;
        description: string;
    }[]>;
    findOne(id: number): Promise<WiFiConfigEntity>;
    update(id: number, dto: UpdateWiFiConfigDto): Promise<WiFiConfigEntity>;
    remove(id: number): Promise<null>;
}
