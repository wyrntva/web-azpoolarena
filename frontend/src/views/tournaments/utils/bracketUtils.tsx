/* eslint-disable react-refresh/only-export-components */
/**
 * Bracket Utilities — shared logic for Winners & Losers bracket tabs.
 *
 * Contains: MatchVM type, toVM, createEmptyMatch, resolveWinner,
 *           race-to / handicap calculations, score clamping, table rendering.
 */
import { Card, Select, TextInput } from 'flowbite-react';
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';

// ============================================
// TYPES
// ============================================

export interface MatchVM {
    match_no: number;
    table_no: string;
    match_time: string;
    player1_id: string;
    player2_id: string;
    player1_score: string;
    player2_score: string;
    race_to: string;
    status: 'pending' | 'upcoming' | 'ongoing' | 'completed';
    player1_check_in: string;
    player2_check_in: string;
    winner_id: string;
}

export type BracketType = 'winners' | 'losers';

export interface RaceToInfo {
    raceTo: number;
    handicap: 0 | 1 | 2;
    handicappedPlayerId: string;
}

export const getMinDatetimeLocal = (dateString?: string | null): string | undefined => {
    if (!dateString) return undefined;
    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return undefined;
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    } catch {
        return undefined;
    }
};

// ============================================
// MATCH FACTORIES
// ============================================

export const createEmptyMatch = (matchNo: number, bracket: BracketType, round: number): TournamentMatch => ({
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

const toDatetimeLocal = (iso: string): string => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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
});

// ============================================
// WINNER / LOSER RESOLUTION
// ============================================

export const resolveWinner = (vm: MatchVM, raceTo: number): string => {
    if (!vm.player1_id || !vm.player2_id) return '';
    if (!raceTo) return ''; // raceTo=0 means not configured — can't determine winner from scores
    const s1 = parseInt(vm.player1_score, 10) || 0;
    const s2 = parseInt(vm.player2_score, 10) || 0;
    if (s1 === raceTo && s2 !== raceTo) return vm.player1_id;
    if (s2 === raceTo && s1 !== raceTo) return vm.player2_id;
    return '';
};

export const getLoserFromMatch = (m?: TournamentMatch): string => {
    if (!m || !m.player1_id || !m.player2_id || !m.winner_id) return '';
    if (m.winner_id === m.player1_id) return String(m.player2_id);
    if (m.winner_id === m.player2_id) return String(m.player1_id);
    return '';
};

export const getWinnerFromMatch = (m?: TournamentMatch): string => {
    if (!m || !m.winner_id) return '';
    return String(m.winner_id);
};

// ============================================
// RANK & RACE-TO CALCULATIONS
// ============================================

const RANK_ORDER = ['I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];
const DRAW_ROUND_ORDER = ['r16', 'r8', 'qf', 'sf', 'f'];

const getRankIndex = (rank?: string | null) => {
    if (!rank) return -1;
    return RANK_ORDER.indexOf(rank.toUpperCase());
};

/**
 * Trả về nhãn vòng đấu (qf/sf/f/r8/r16) của một match trong bảng KO,
 * dùng để xác định vòng có áp dụng đồng cơ không.
 */
export const getMatchRoundLabel = (
    matchNo: number,
    numberOfPlayers: number,
): 'qf' | 'sf' | 'f' | 'r8' | 'r16' | null => {
    if (numberOfPlayers > 32) {
        if (matchNo >= 81 && matchNo <= 96)  return 'r16';
        if (matchNo >= 97 && matchNo <= 104) return 'r8';
        if (matchNo >= 105 && matchNo <= 108) return 'qf';
        if (matchNo >= 109 && matchNo <= 110) return 'sf';
        if (matchNo === 111) return 'f';
    } else if (numberOfPlayers > 16) {
        if (matchNo >= 41 && matchNo <= 48) return 'r8';
        if (matchNo >= 49 && matchNo <= 52) return 'qf';
        if (matchNo >= 53 && matchNo <= 54) return 'sf';
        if (matchNo === 55) return 'f';
    } else {
        if (matchNo >= 21 && matchNo <= 24) return 'qf';
        if (matchNo >= 25 && matchNo <= 26) return 'sf';
        if (matchNo === 27) return 'f';
    }
    return null;
};

export const getRaceToInfo = (
    player1Id: string,
    player2Id: string,
    players: TournamentRegisteredPlayer[],
    tournament: Tournament,
    roundLabel?: string | null,
): RaceToInfo => {
    // Đồng cơ override: nếu vòng này nằm trong vùng đồng cơ, dùng race-to cố định, không chấp
    if (roundLabel && tournament.draw_from_round) {
        const drawFromIdx = DRAW_ROUND_ORDER.indexOf(tournament.draw_from_round);
        const roundIdx = DRAW_ROUND_ORDER.indexOf(roundLabel);
        if (drawFromIdx >= 0 && roundIdx >= 0 && roundIdx >= drawFromIdx) {
            let raceTo = 0;
            if (roundLabel === 'qf') raceTo = parseInt(tournament.quarter_final || '0', 10) || 0;
            else if (roundLabel === 'sf') raceTo = parseInt(tournament.semi_final || '0', 10) || 0;
            else if (roundLabel === 'f')  raceTo = parseInt(tournament.final || '0', 10) || 0;
            else raceTo = parseInt(tournament.draw_touch || '0', 10) || 0; // r8, r16
            if (raceTo > 0) return { raceTo, handicap: 0, handicappedPlayerId: '' };
        }
    }

    if (!player1Id || !player2Id) return { raceTo: 0, handicap: 0, handicappedPlayerId: '' };
    const p1 = players.find((p) => p.id === parseInt(player1Id, 10));
    const p2 = players.find((p) => p.id === parseInt(player2Id, 10));
    const r1 = getRankIndex(p1?.rank);
    const r2 = getRankIndex(p2?.rank);
    if (r1 < 0 || r2 < 0) return { raceTo: 0, handicap: 0, handicappedPlayerId: '' };

    const diff = Math.abs(r1 - r2);
    const handicappedPlayerId = r1 < r2 ? player1Id : player2Id;

    if (diff === 0) return { raceTo: parseInt(tournament.draw_touch || '0', 10) || 0, handicap: 0, handicappedPlayerId: '' };
    if (diff === 1) return { raceTo: parseInt(tournament.handicap_1_touch || '0', 10) || 0, handicap: 1, handicappedPlayerId };
    return { raceTo: parseInt(tournament.handicap_2_touch || '0', 10) || 0, handicap: 2, handicappedPlayerId };
};

export const getRaceToText = (
    player1Id: string,
    player2Id: string,
    players: TournamentRegisteredPlayer[],
    tournament: Tournament,
    roundLabel?: string | null,
): string => {
    const info = getRaceToInfo(player1Id, player2Id, players, tournament, roundLabel);
    if (!info.raceTo) return '';
    if (info.handicap === 0) return `Chạm ${info.raceTo}`;
    return `Chạm ${info.raceTo} chấp ${info.handicap}`;
};

export const getRaceToNumber = (
    player1Id: string,
    player2Id: string,
    players: TournamentRegisteredPlayer[],
    tournament: Tournament,
    roundLabel?: string | null,
): number => getRaceToInfo(player1Id, player2Id, players, tournament, roundLabel).raceTo;

// ============================================
// SCORE CLAMPING
// ============================================

export const clampScoreByRules = (
    m: MatchVM,
    field: 'player1_score' | 'player2_score',
    raw: string,
    players: TournamentRegisteredPlayer[],
    tournament: Tournament,
): MatchVM => {
    const info = getRaceToInfo(m.player1_id, m.player2_id, players, tournament);
    const raceTo = info.raceTo;
    if (!raceTo) return { ...m, [field]: raw } as MatchVM;

    let s1 = parseInt(m.player1_score, 10) || 0;
    let s2 = parseInt(m.player2_score, 10) || 0;
    let nextVal = parseInt(raw, 10);
    if (Number.isNaN(nextVal)) nextVal = 0;

    if (info.handicap > 0) {
        const minForHandicapped = info.handicap;
        if (field === 'player1_score' && m.player1_id === info.handicappedPlayerId) nextVal = Math.max(nextVal, minForHandicapped);
        if (field === 'player2_score' && m.player2_id === info.handicappedPlayerId) nextVal = Math.max(nextVal, minForHandicapped);
    }

    nextVal = Math.min(nextVal, raceTo);

    if (field === 'player1_score') s1 = nextVal;
    else s2 = nextVal;

    if (s1 === raceTo && s2 === raceTo) {
        if (field === 'player1_score') s2 = Math.max(0, raceTo - 1);
        else s1 = Math.max(0, raceTo - 1);
    }

    const next: MatchVM = { ...m, player1_score: String(s1), player2_score: String(s2) };
    const winner = resolveWinner(next, raceTo);
    next.winner_id = winner;
    next.status = winner ? 'completed' : next.status === 'completed' ? 'pending' : next.status;
    return next;
};

// ============================================
// HANDLE CHANGE (shared for both brackets)
// ============================================

export function handleMatchChange(
    round: 1 | 2,
    index: number,
    field: keyof MatchVM,
    value: string,
    round1: MatchVM[],
    round2: MatchVM[],
    setRound1: React.Dispatch<React.SetStateAction<MatchVM[]>>,
    setRound2: React.Dispatch<React.SetStateAction<MatchVM[]>>,
    players: TournamentRegisteredPlayer[],
    tournament: Tournament,
) {
    const [arr, setter] = round === 1 ? [round1, setRound1] : [round2, setRound2];
    const next = [...arr];
    let m = { ...next[index], [field]: value } as MatchVM;

    if (field === 'player1_score' || field === 'player2_score') {
        m = clampScoreByRules(m, field, value, players, tournament);
    } else if (field === 'player1_id' || field === 'player2_id') {
        const p1Id = field === 'player1_id' ? value : m.player1_id;
        const p2Id = field === 'player2_id' ? value : m.player2_id;
        const info = getRaceToInfo(p1Id, p2Id, players, tournament);

        let p1Score = '0';
        let p2Score = '0';
        if (info.handicap > 0) {
            if (info.handicappedPlayerId === p1Id) p1Score = String(info.handicap);
            if (info.handicappedPlayerId === p2Id) p2Score = String(info.handicap);
        }

        m = { ...m, player1_score: p1Score, player2_score: p2Score, winner_id: '', status: 'pending' };
    } else if (field === 'status') {
        // Khi thủ công reset về non-completed, xóa winner để backend không ghi đè lại
        if (value !== 'completed') {
            m = { ...m, winner_id: '' };
        }
    } else if (field === 'player1_check_in' || field === 'player2_check_in') {
        // Khi người chơi vắng mặt → tự động kết thúc trận, đối thủ thắng
        const p1ci = field === 'player1_check_in' ? value : m.player1_check_in;
        const p2ci = field === 'player2_check_in' ? value : m.player2_check_in;

        if (p1ci === 'absent' && p2ci === 'absent') {
            // Cả hai vắng mặt → kết thúc, không có người thắng
            m = { ...m, status: 'completed', winner_id: '' };
        } else if (p1ci === 'absent' && m.player2_id) {
            // Player 1 vắng → Player 2 thắng
            m = { ...m, status: 'completed', winner_id: m.player2_id };
        } else if (p2ci === 'absent' && m.player1_id) {
            // Player 2 vắng → Player 1 thắng
            m = { ...m, status: 'completed', winner_id: m.player1_id };
        }
    }

    next[index] = m;
    setter(next);
}

// ============================================
// BUILD SAVE PAYLOADS
// ============================================

export function buildSavePayloads(
    round1: MatchVM[],
    round2: MatchVM[],
    bracket: BracketType,
): Array<{ matchNo: number; data: TournamentMatchUpsert }> {
    const payloads: Array<{ matchNo: number; data: TournamentMatchUpsert }> = [];

    const addRound = (matches: MatchVM[], roundNum: number) => {
        for (const m of matches) {
            payloads.push({
                matchNo: m.match_no,
                data: {
                    bracket,
                    round: roundNum,
                    player1_id: m.player1_id ? parseInt(m.player1_id, 10) : null,
                    player2_id: m.player2_id ? parseInt(m.player2_id, 10) : null,
                    player1_score: parseInt(m.player1_score, 10) || 0,
                    player2_score: parseInt(m.player2_score, 10) || 0,
                    table_no: m.table_no || null,
                    match_time: m.match_time || null,
                    status: m.status,
                    player1_check_in: m.player1_check_in || 'unconfirmed',
                    player2_check_in: m.player2_check_in || 'unconfirmed',
                    winner_id: m.winner_id ? parseInt(m.winner_id, 10) : null,
                },
            });
        }
    };

    addRound(round1, 1);
    addRound(round2, 2);
    return payloads;
}

export function validateMatchTimes(matches: MatchVM[], tournamentStartDate: string | null): string | null {
    if (!tournamentStartDate) return null;
    const startStr = tournamentStartDate.substring(0, 16).replace(' ', 'T');
    for (const m of matches) {
        if (m.match_time) {
            const mStr = m.match_time.substring(0, 16).replace(' ', 'T');
            if (mStr < startStr) {
                return `Trận ${m.match_no} có thời gian sớm hơn thời gian bắt đầu giải đấu!`;
            }
        }
    }
    return null;
}

// ============================================
// TABLE HEADER (shared JSX)
// ============================================

export const MATCH_TABLE_COLUMNS = [
    { width: '4%', label: 'Trận', align: 'center' as const },
    { width: '21%', label: 'Người chơi 1', align: 'left' as const },
    { width: '21%', label: 'Người chơi 2', align: 'left' as const },
    { width: '5%', label: 'Tỉ số P1', align: 'center' as const, nowrap: true },
    { width: '5%', label: 'Tỉ số P2', align: 'center' as const, nowrap: true },
    { width: '10%', label: 'Race to', align: 'center' as const },
    { width: '10%', label: 'Bàn', align: 'center' as const },
    { width: '12%', label: 'Thời gian', align: 'left' as const },
    { width: '12%', label: 'Trạng thái', align: 'left' as const },
];

export const STATUS_OPTIONS = [
    { value: 'pending', label: 'Chưa diễn ra' },
    { value: 'upcoming', label: 'Sắp diễn ra' },
    { value: 'ongoing', label: 'Đang diễn ra' },
    { value: 'completed', label: 'Đã kết thúc' },
];

// ============================================
// RENDER SHARED TABLE ROW CELLS (score, race-to, table_no, match_time, status)
// ============================================

export function MatchRowCommonCells({ match, round, idx, onFieldChange, players, tournament, tablesList = [] }: {
    match: MatchVM;
    round: 1 | 2;
    idx: number;
    onFieldChange: (round: 1 | 2, index: number, field: keyof MatchVM, value: string) => void;
    players: TournamentRegisteredPlayer[];
    tournament: Tournament;
    tablesList?: { id: number; name: string }[];
}) {
    return (
        <>
            <td className="p-2">
                <TextInput type="number" min={0} value={match.player1_score}
                    onChange={(e) => onFieldChange(round, idx, 'player1_score', e.target.value)}
                    className="text-center" sizing="sm" />
            </td>
            <td className="p-2">
                <TextInput type="number" min={0} value={match.player2_score}
                    onChange={(e) => onFieldChange(round, idx, 'player2_score', e.target.value)}
                    className="text-center" sizing="sm" />
            </td>
            <td className="p-2">
                <TextInput value={getRaceToText(match.player1_id, match.player2_id, players, tournament)}
                    readOnly sizing="sm" className="w-full text-center" />
            </td>
            <td className="p-2">
                <Select
                    className="select-md tournament-select"
                    value={match.table_no}
                    onChange={(e) => onFieldChange(round, idx, 'table_no', e.target.value)}
                    sizing="sm"
                >
                    <option value="">Chọn bàn</option>
                    {tablesList.map((t) => (
                        <option key={t.id} value={t.name}>
                            {t.name}
                        </option>
                    ))}
                </Select>
            </td>
            <td className="p-2">
                <TextInput type="datetime-local" value={match.match_time}
                    color={(match.match_time && tournament?.start_date && match.match_time.substring(0, 16).replace(' ', 'T') < tournament.start_date.substring(0, 16).replace(' ', 'T')) ? 'failure' : 'gray'}
                    min={getMinDatetimeLocal(tournament.start_date)}
                    onChange={(e) => onFieldChange(round, idx, 'match_time', e.target.value)}
                    sizing="sm" className="w-full" />
            </td>
            <td className="p-2">
                <Select className="select-md tournament-select" value={match.status}
                    onChange={(e) => onFieldChange(round, idx, 'status', e.target.value)} sizing="sm">
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </Select>
            </td>
        </>
    );
}

// ============================================
// MATCH TABLE WRAPPER (colgroup + header)
// ============================================

export function MatchTableShell({ title, matchCount, borderColor, children }: {
    title: string;
    matchCount: number;
    borderColor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className={`flex items-center gap-2 px-2 border-l-4 ${borderColor}`}>
                <h4 className="text-md font-bold text-gray-800 dark:text-white uppercase">{title}</h4>
                <span className="text-xs text-gray-400">({matchCount} trận đấu)</span>
            </div>
            <Card className="overflow-visible shadow-none border-gray-100 bg-gray-50/30">
                <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full text-xs table-fixed">
                        <colgroup>
                            {MATCH_TABLE_COLUMNS.map((col, i) => (
                                <col key={i} style={{ width: col.width }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr className="bg-white">
                                {MATCH_TABLE_COLUMNS.map((col, i) => (
                                    <th key={i} className={`p-3 uppercase text-gray-600 text-${col.align} ${col.nowrap ? 'whitespace-nowrap' : ''}`}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {children}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
