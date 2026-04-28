import { StoreSettingsService } from '../services/store-settings.service';
import { UpdateStoreSettingsDto } from '../dto/store-settings.dto';
export declare class StoreSettingsController {
    private readonly service;
    constructor(service: StoreSettingsService);
    getSettings(): Promise<import("../entities").StoreSettingsEntity>;
    getPublicSettings(): Promise<import("../entities").StoreSettingsEntity>;
    updateSettings(dto: UpdateStoreSettingsDto): Promise<import("../entities").StoreSettingsEntity>;
    putSettings(dto: UpdateStoreSettingsDto): Promise<import("../entities").StoreSettingsEntity>;
    uploadBanner(type: string, file: Express.Multer.File): Promise<import("../entities").StoreSettingsEntity>;
    deleteMultiBanner(type: string, index: string): Promise<import("../entities").StoreSettingsEntity>;
    deleteSingleBanner(type: string): Promise<import("../entities").StoreSettingsEntity>;
}
