import { Repository } from 'typeorm';
import { StoreSettingsEntity } from '../entities';
import { UpdateStoreSettingsDto } from '../dto/store-settings.dto';
export declare class StoreSettingsService {
    private readonly repo;
    constructor(repo: Repository<StoreSettingsEntity>);
    getSettings(): Promise<StoreSettingsEntity>;
    updateSettings(dto: UpdateStoreSettingsDto): Promise<StoreSettingsEntity>;
    addBanner(type: string, url: string): Promise<StoreSettingsEntity>;
    removeBanner(type: string, index: number): Promise<StoreSettingsEntity>;
    removeSingleBanner(type: string): Promise<StoreSettingsEntity>;
}
