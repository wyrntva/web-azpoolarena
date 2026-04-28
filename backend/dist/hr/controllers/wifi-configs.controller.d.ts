import { WifiConfigsService } from '../services/wifi-configs.service';
import { CreateWiFiConfigDto, UpdateWiFiConfigDto } from '../dto/hr.dto';
export declare class WifiConfigsController {
    private readonly wifiService;
    constructor(wifiService: WifiConfigsService);
    create(dto: CreateWiFiConfigDto): Promise<import("../entities").WiFiConfigEntity>;
    findAll(isActiveStr?: string): Promise<import("../entities").WiFiConfigEntity[]>;
    findApproved(): Promise<{
        id: number;
        ssid: string;
        description: string;
    }[]>;
    findOne(id: number): Promise<import("../entities").WiFiConfigEntity>;
    update(id: number, dto: UpdateWiFiConfigDto): Promise<import("../entities").WiFiConfigEntity>;
    remove(id: number): Promise<null>;
}
