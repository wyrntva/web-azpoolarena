import { RankingsService } from '../services/rankings.service';
export declare class RankingsController {
    private readonly service;
    constructor(service: RankingsService);
    getRankings(pageStr?: string, limitStr?: string, rankId?: string, gender?: string, sort?: string): Promise<{
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
