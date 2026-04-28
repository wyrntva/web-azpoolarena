import { Repository } from 'typeorm';
import { PoolArenaUserEntity } from '../../pool-arena/entities';
import { TournamentEntity } from '../../tournaments/entities';
import { StoreSettingsEntity } from '../../store-settings/entities';
export declare class UploadsService {
    private userRepo;
    private tourRepo;
    private settingsRepo;
    constructor(userRepo: Repository<PoolArenaUserEntity>, tourRepo: Repository<TournamentEntity>, settingsRepo: Repository<StoreSettingsEntity>);
    private extractUrls;
    collectUsedUploadUrls(): Promise<Set<string>>;
    listUploadFiles(): string[];
    getOrphans(deleteOrphans: boolean): Promise<{
        total_files: number;
        used_files: number;
        orphan_files: number;
        deleted: number;
        orphans: string[];
    }>;
}
