import { Repository } from 'typeorm';
import { TournamentEntity, TournamentMatchEntity, TournamentRegistrationEntity } from '../entities';
import { CreateMatchDto, UpdateMatchDto } from '../dto/tournaments.dto';
export declare class TournamentsService {
    private readonly tourRepo;
    private readonly matchRepo;
    private readonly regRepo;
    constructor(tourRepo: Repository<TournamentEntity>, matchRepo: Repository<TournamentMatchEntity>, regRepo: Repository<TournamentRegistrationEntity>);
    findAll(skip?: number, limit?: number): Promise<[TournamentEntity[], number]>;
    findOne(id: number): Promise<TournamentEntity>;
    findBySlug(slug: string): Promise<TournamentEntity>;
    getMatches(tournamentId: number): Promise<TournamentMatchEntity[]>;
    updateMatch(matchId: number, dto: UpdateMatchDto): Promise<TournamentMatchEntity>;
    generateMatches(tournamentId: number, matchList: CreateMatchDto[]): Promise<TournamentMatchEntity[]>;
    getRegistrations(tournamentId: number): Promise<TournamentRegistrationEntity[]>;
    getActiveMatchForDevice(tableName: string): Promise<{
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
    updateDeviceMatchScore(matchId: number, dto: any): Promise<{
        success: boolean;
    }>;
    updateDeviceMatchCheckIn(matchId: number, dto: any): Promise<{
        success: boolean;
    }>;
}
