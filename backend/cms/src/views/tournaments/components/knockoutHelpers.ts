import type { TournamentMatch } from '../../../api/tournament.api';
import { toDatetimeLocal } from '../utils/bracketUtils';

export type PlayerIdStr = string;
export type Status = 'pending' | 'upcoming' | 'ongoing' | 'completed';
export type Bracket = 'knockout';

export interface MatchVM {
    match_no: number;
    table_no: string;
    match_time: string;
    player1_id: PlayerIdStr;
    player2_id: PlayerIdStr;
    player1_score: string;
    player2_score: string;
    race_to: string;
    status: Status;
    player1_check_in: string;
    player2_check_in: string;
    winner_id: PlayerIdStr;
    player1_points?: string;
    player2_points?: string;
}

export const createEmptyMatch = (matchNo: number, bracket: Bracket, round: number): TournamentMatch => ({
    id: 0,
    tournament_id: 0,
    match_no: matchNo,
    bracket,
    round,
    player1_id: null,
    player2_id: null,
    player1_score: 0,
    player2_score: 0,
    status: 'pending',
    winner_id: null,
    created_at: null,
    updated_at: null,
});

export const toVM = (m: TournamentMatch): MatchVM => ({
    match_no: m.match_no,
    table_no: m.table_no || '',
    match_time: m.match_time ? toDatetimeLocal(m.match_time) : '',
    player1_id: m.player1_id ? String(m.player1_id) : '',
    player2_id: m.player2_id ? String(m.player2_id) : '',
    player1_score: String(m.player1_score ?? 0),
    player2_score: String(m.player2_score ?? 0),
    race_to: '',
    status: m.status,
    player1_check_in: m.player1_check_in || 'unconfirmed',
    player2_check_in: m.player2_check_in || 'unconfirmed',
    winner_id: m.winner_id ? String(m.winner_id) : '',
    player1_points: m.player1_points !== undefined && m.player1_points !== null ? String(m.player1_points) : '',
    player2_points: m.player2_points !== undefined && m.player2_points !== null ? String(m.player2_points) : '',
});

export const resolveWinner = (vm: MatchVM, raceTo: number): PlayerIdStr => {
    if (!vm.player1_id || !vm.player2_id) {
        if (vm.status === 'completed' && vm.winner_id) return vm.winner_id;
        return '';
    }

    const s1 = parseInt(vm.player1_score, 10) || 0;
    const s2 = parseInt(vm.player2_score, 10) || 0;

    if (s1 === raceTo && s2 !== raceTo) return vm.player1_id;
    if (s2 === raceTo && s1 !== raceTo) return vm.player2_id;
    return '';
};
