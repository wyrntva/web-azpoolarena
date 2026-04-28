export declare class UpdateTournamentDto {
    name?: string;
    status?: string;
    display?: string;
    banner?: string;
    match_bracket?: string;
}
export declare class CreateMatchDto {
    match_no: number;
    bracket: string;
    round: number;
    player1_id?: number | null;
    player2_id?: number | null;
    match_time?: string;
}
export declare class UpdateMatchDto {
    player1_id?: number | null;
    player2_id?: number | null;
    player1_score?: number;
    player2_score?: number;
    table_no?: string;
    status?: string;
    winner_id?: number | null;
    match_time?: string;
    player1_check_in?: string;
    player2_check_in?: string;
}
