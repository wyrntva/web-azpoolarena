import { TournamentsService } from '../services/tournaments.service';
import { CreateMatchDto, UpdateMatchDto } from '../dto/tournaments.dto';
export declare class TournamentsController {
    private readonly service;
    constructor(service: TournamentsService);
    findAll(skipStr?: string, limitStr?: string): Promise<{
        data: import("../entities").TournamentEntity[];
        meta: {
            total: number;
            skip: number;
            limit: number;
        };
    }>;
    findOne(id: number): Promise<import("../entities").TournamentEntity>;
    findBySlug(slug: string): Promise<import("../entities").TournamentEntity>;
    getMatches(id: number): Promise<import("../entities").TournamentMatchEntity[]>;
    updateMatch(id: number, dto: UpdateMatchDto): Promise<import("../entities").TournamentMatchEntity>;
    generateMatches(id: number, body: {
        matches: CreateMatchDto[];
    }): Promise<import("../entities").TournamentMatchEntity[]>;
    getRegistrations(id: number): Promise<import("../entities").TournamentRegistrationEntity[]>;
    getActiveMatch(tableName: string): Promise<{
        id: number;
        tournament_id: number;
        tournament_name: string;
        banner: string;
        sponsor_logos: string;
        match_no: number;
        round: number;
        status: string;
        player1_id: number | null;
        player1_name: string;
        player1_avatar: string;
        player1_score: number;
        player1_check_in: string;
        player2_id: number | null;
        player2_name: string;
        player2_avatar: string;
        player2_score: number;
        player2_check_in: string;
        winner_id: number | null;
    } | null>;
    updateDeviceMatchScore(id: number, dto: any): Promise<{
        success: boolean;
    }>;
    updateDeviceMatchCheckIn(id: number, dto: any): Promise<{
        success: boolean;
    }>;
}
