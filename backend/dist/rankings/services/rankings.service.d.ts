import { Repository } from 'typeorm';
import { PoolArenaUserEntity } from '../../pool-arena/entities';
export declare class RankingsService {
    private readonly repo;
    constructor(repo: Repository<PoolArenaUserEntity>);
    getRankings(page?: number, limit?: number, rankId?: string, gender?: string, sort?: string): Promise<{
        data: {
            id: string;
            points: number;
            rank_id: string;
            rank_name: string;
            player: {
                id: string;
                name: string;
                avatar_url: string;
            };
        }[];
        meta: {
            current_page: number;
            total_pages: number;
            total: number;
            per_page: number;
        };
    }>;
}
