/**
 * Losers Bracket Tab — manages round 1 & 2 of the losers bracket.
 * Simplified table view with match management dialog.
 * Auto-saves individual matches when the dialog is closed.
 */
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Spinner } from 'flowbite-react';
import toast from 'react-hot-toast';
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import {
    type MatchVM,
    createEmptyMatch, toVM, resolveWinner,
    getLoserFromMatch, getWinnerFromMatch,
    getRaceToNumber, handleMatchChange, validateMatchTimes
} from '../utils/bracketUtils';
import { useAllTables } from '../hooks/useAllTables';
import MatchManagementDialog from './MatchManagementDialog';

interface Props {
    tournamentId: number;
    numberOfPlayers: number;
    players: TournamentRegisteredPlayer[];
    matches: TournamentMatch[];
    tournament: Tournament;
    bracketLoading?: boolean;
    onUpsertMatch: (matchNo: number, data: TournamentMatchUpsert) => Promise<TournamentMatch>;
    onDirty?: () => void;
    onClean?: () => void;
    visibleRounds?: number[];
}

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
    pending: { color: '#C6010B', label: 'Chưa diễn ra' },
    upcoming: { color: '#FAC600', label: 'Sắp diễn ra' },
    ongoing: { color: '#00B814', label: 'Đang diễn ra' },
    completed: { color: '#575E70', label: 'Đã kết thúc' },
};

const TournamentLosersBracketTab = ({ numberOfPlayers, players, matches, tournament, bracketLoading, onUpsertMatch, onDirty, onClean, visibleRounds = [1, 2] }: Props) => {
    const { tables } = useAllTables();
    // size tier: 16, 32, or 64
    const size: 16 | 32 | 64 = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
    const dirtyRef = useRef(false);
    const byeAutoSavedRef = useRef<Set<number>>(new Set());

    // LR1: 16p → 9–12 (4), 32p → 17–24 (8), 64p → 33–48 (16)
    const round1Nos = useMemo(() => {
        const config = { 16: { start: 9, count: 4 }, 32: { start: 17, count: 8 }, 64: { start: 33, count: 16 } };
        const { start, count } = config[size];
        return Array.from({ length: count }, (_, i) => start + i);
    }, [size]);

    // LR2: 16p → 17–20 (4), 32p → 33–40 (8), 64p → 65–80 (16)
    const round2Nos = useMemo(() => {
        const config = { 16: { start: 17, count: 4 }, 32: { start: 33, count: 8 }, 64: { start: 65, count: 16 } };
        const { start, count } = config[size];
        return Array.from({ length: count }, (_, i) => start + i);
    }, [size]);

    const [round1, setRound1] = useState<MatchVM[]>(() => round1Nos.map(n => toVM(createEmptyMatch(n, 'losers', 1))));
    const [round2, setRound2] = useState<MatchVM[]>(() => round2Nos.map(n => toVM(createEmptyMatch(n, 'losers', 2))));

    // Dialog state
    const [editingMatch, setEditingMatch] = useState<{ round: 1 | 2; idx: number } | null>(null);

    useEffect(() => {
        setRound1(round1Nos.map(n => toVM(createEmptyMatch(n, 'losers', 1))));
        setRound2(round2Nos.map(n => toVM(createEmptyMatch(n, 'losers', 2))));
    }, [round1Nos.join(','), round2Nos.join(',')]);

    const matchMap = useMemo(() => new Map(matches.map(m => [m.match_no, m])), [matches]);

    const losersRound1Seed = useMemo(() => {
        // WR1 count: 16p → 8, 32p → 16, 64p → 32
        const wr1Count = size === 64 ? 32 : size === 32 ? 16 : 8;
        const losers = Array.from({ length: wr1Count }, (_, i) => getLoserFromMatch(matchMap.get(1 + i)));
        const seed: Record<number, [string, string]> = {};
        for (let i = 0; i < losers.length / 2; i++) {
            seed[round1Nos[i]] = [losers[i * 2] || '', losers[i * 2 + 1] || ''];
        }
        return seed;
    }, [size, matchMap, round1Nos]);

    const losersRound2Seed = useMemo(() => {
        const seed: Record<number, [string, string]> = {};
        if (size === 16) {
            // 16-player: p1 = winner of LR1 [9..12], p2 = loser of WR2 [16,15,14,13]
            const lr1Sources = [9, 10, 11, 12];
            const wr2Sources = [16, 15, 14, 13];
            for (let i = 0; i < 4; i++) {
                seed[17 + i] = [
                    getWinnerFromMatch(matchMap.get(lr1Sources[i])) || '',
                    getLoserFromMatch(matchMap.get(wr2Sources[i])) || '',
                ];
            }
        } else if (size === 32) {
            // 32-player: p1 = winner of LR1 [17..24], p2 = loser of WR2 [32..25]
            for (let i = 0; i < 8; i++) {
                seed[33 + i] = [
                    getWinnerFromMatch(matchMap.get(17 + i)) || '',
                    getLoserFromMatch(matchMap.get(32 - i)) || '',
                ];
            }
        } else {
            // 64-player: p1 = winner of LR1 [33..48], p2 = loser of WR2 [64..49]
            for (let i = 0; i < 16; i++) {
                seed[65 + i] = [
                    getWinnerFromMatch(matchMap.get(33 + i)) || '',
                    getLoserFromMatch(matchMap.get(64 - i)) || '',
                ];
            }
        }
        return seed;
    }, [size, matchMap]);

    useEffect(() => {
        const syncRound = (nos: number[], roundNum: number, seed: Record<number, [string, string]>) =>
            nos.map((no) => {
                const stored = matchMap.get(no);
                const base = stored ? toVM(stored) : toVM(createEmptyMatch(no, 'losers', roundNum));
                const seeded = seed[no] ?? ['', ''];
                const next: MatchVM = { ...base, match_no: no, player1_id: seeded[0] || '', player2_id: seeded[1] || '' };
                const w = resolveWinner(next, getRaceToNumber(next.player1_id, next.player2_id, players, tournament));
                if (next.winner_id !== w) next.winner_id = w;
                return next;
            });
        setRound1(syncRound(round1Nos, 1, losersRound1Seed));
        setRound2(syncRound(round2Nos, 2, losersRound2Seed));
    }, [matchMap, losersRound1Seed, losersRound2Seed, round1Nos, round2Nos]);

    // Helper: check if a WR1 match feeding a LR1 slot is a BYE
    // (has exactly one player assigned, other is null → no loser to send)
    const isWR1SourceBye = useCallback((lr1Idx: number, slot: 1 | 2): boolean => {
        // LR1[i].player1 comes from loser of WR1 match (1 + i*2)
        // LR1[i].player2 comes from loser of WR1 match (1 + i*2 + 1)
        const wr1No = slot === 1 ? (1 + lr1Idx * 2) : (1 + lr1Idx * 2 + 1);
        const wr1Match = matchMap.get(wr1No);
        if (!wr1Match) return false;
        return (!!wr1Match.player1_id !== !!wr1Match.player2_id); // exactly one player
    }, [matchMap]);

    // Auto-complete BYE matches in Losers Round 1
    // When a WR1 match was a BYE (only one player, auto-wins), there is no loser to send to LR1.
    // The corresponding LR1 match will have only one player and should auto-complete as BYE.
    // Also auto-saves to backend so LR2 can pick up the winner.
    useEffect(() => {
        // Only relevant when there are fewer players than bracket slots (BYE scenario)
        if (players.length >= size) return;

        let changed = false;
        const next = [...round1];
        for (let i = 0; i < next.length; i++) {
            const m = next[i];
            if (m.winner_id) continue; // Already resolved

            const hasP1 = !!m.player1_id;
            const hasP2 = !!m.player2_id;
            if (hasP1 === hasP2) continue; // Both filled or both empty → not a BYE scenario

            // Check if the WR1 match feeding the empty slot is a BYE
            const emptySlot: 1 | 2 = hasP1 ? 2 : 1;
            if (isWR1SourceBye(i, emptySlot)) {
                const winnerId = hasP1 ? m.player1_id : m.player2_id;
                next[i] = { ...m, status: 'completed', winner_id: winnerId };
                changed = true;

                // Auto-save to backend so LR2 picks up the winner (prevent duplicates with ref)
                if (!byeAutoSavedRef.current.has(m.match_no)) {
                    byeAutoSavedRef.current.add(m.match_no);
                    onUpsertMatch(m.match_no, {
                        bracket: 'losers',
                        round: 1,
                        player1_id: next[i].player1_id ? parseInt(next[i].player1_id, 10) : null,
                        player2_id: next[i].player2_id ? parseInt(next[i].player2_id, 10) : null,
                        player1_score: 0,
                        player2_score: 0,
                        table_no: null,
                        match_time: null,
                        status: 'completed',
                        winner_id: parseInt(winnerId, 10),
                    }).catch(() => {
                        // If save fails, allow retry on next cycle
                        byeAutoSavedRef.current.delete(m.match_no);
                    });
                }
            }
        }
        if (changed) setRound1(next);
    }, [round1, matchMap, players.length, size, isWR1SourceBye]);

    const onChange = (round: 1 | 2, idx: number, field: keyof MatchVM, value: string) => {
        dirtyRef.current = true;
        onDirty?.();
        handleMatchChange(round, idx, field, value, round1, round2, setRound1, setRound2, players, tournament);
    };

    const saveMatch = useCallback(async () => {
        if (!editingMatch) return;
        const match = editingMatch.round === 1 ? round1[editingMatch.idx] : round2[editingMatch.idx];
        if (!match) return;
        const errorMsg = validateMatchTimes([match], tournament.start_date);
        if (errorMsg) { toast.error(errorMsg); throw new Error(errorMsg); }
        await onUpsertMatch(match.match_no, {
            bracket: 'losers',
            round: editingMatch.round,
            player1_id: match.player1_id ? parseInt(match.player1_id, 10) : null,
            player2_id: match.player2_id ? parseInt(match.player2_id, 10) : null,
            player1_score: parseInt(match.player1_score, 10) || 0,
            player2_score: parseInt(match.player2_score, 10) || 0,
            table_no: match.table_no || null,
            match_time: match.match_time || null,
            status: match.status,
            winner_id: match.winner_id ? parseInt(match.winner_id, 10) : null,
        });
        toast.success(`Đã lưu trận ${match.match_no}`);
        onClean?.();
    }, [editingMatch, round1, round2, tournament, onUpsertMatch, onClean]);

    // Auto-save when dialog closes
    const handleDialogClose = useCallback(async () => {
        if (editingMatch && dirtyRef.current) {
            try {
                await saveMatch();
            } catch { /* validation error already shown */ }
            dirtyRef.current = false;
        }
        setEditingMatch(null);
    }, [editingMatch, saveMatch]);

    const getPlayerName = (id: string) => players.find(p => p.id === parseInt(id, 10))?.full_name;

    const currentMatch = editingMatch
        ? (editingMatch.round === 1 ? round1[editingMatch.idx] : round2[editingMatch.idx])
        : null;

    /**
     * Compute descriptive source labels for each player slot in a round.
     * Returns an array of [player1Label, player2Label] per match.
     */
    const getSourceLabels = (round: 1 | 2): Array<[string, string]> => {
        if (round === 1) {
            // LR1 players come from losers of WR1
            return round1Nos.map((_, i) => {
                const wr1Match1 = 1 + i * 2;
                const wr1Match2 = 1 + i * 2 + 1;
                return [`Thua trận ${wr1Match1}`, `Thua trận ${wr1Match2}`] as [string, string];
            });
        }
        // Round 2
        if (size === 16) {
            const lr1Sources = [9, 10, 11, 12];
            const wr2Sources = [16, 15, 14, 13];
            return round2Nos.map((_, i) => [
                `Thắng trận ${lr1Sources[i]}`,
                `Thua trận ${wr2Sources[i]}`,
            ] as [string, string]);
        }
        if (size === 32) {
            return round2Nos.map((_, i) => [
                `Thắng trận ${17 + i}`,
                `Thua trận ${32 - i}`,
            ] as [string, string]);
        }
        // 64-player: p1 = winner of LR1 [33..48], p2 = loser of WR2 [64..49]
        return round2Nos.map((_, i) => [
            `Thắng trận ${33 + i}`,
            `Thua trận ${64 - i}`,
        ] as [string, string]);
    };

    const renderRound = (round: 1 | 2, matchesVM: MatchVM[], title: string) => {
        const sourceLabels = getSourceLabels(round);
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                    <h4 className="text-md font-bold text-gray-800 dark:text-white uppercase">{title}</h4>
                    <span className="text-xs text-gray-400">({matchesVM.length} trận đấu)</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="min-w-full text-sm table-fixed">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '4%' }}>Trận</th>
                                <th className="p-3 text-left text-xs uppercase text-gray-500" style={{ width: '30%' }}>Người chơi 1</th>
                                <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '14%' }}>Tỉ số</th>
                                <th className="p-3 text-left text-xs uppercase text-gray-500" style={{ width: '30%' }}>Người chơi 2</th>
                                <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '6%' }}>Bàn</th>
                                <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '16%' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {matchesVM.map((match, idx) => {
                                const badge = STATUS_BADGE[match.status] || STATUS_BADGE.pending;
                                return (
                                    <tr key={match.match_no} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer" onClick={() => setEditingMatch({ round, idx })}>
                                        <td className="p-3 text-center font-bold text-gray-400">{match.match_no}</td>
                                        <td className="p-3">
                                            <span className={'text-gray-800 dark:text-gray-200'} style={match.winner_id === match.player1_id && match.winner_id ? { fontWeight: 700, ...(round === 2 && match.player2_id ? { color: '#91d913' } : {}) } : undefined}>
                                                {getPlayerName(match.player1_id) || (
                                                    (match.winner_id && !match.player1_id) || (round === 1 && !match.player1_id && match.player2_id && isWR1SourceBye(idx, 1))
                                                        ? <span className="text-gray-400 italic font-semibold text-xs">bye</span>
                                                        : <span className="text-gray-400 italic text-xs">{sourceLabels[idx]?.[0] ?? 'Chờ...'}</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                            {(() => {
                                                const scoreLeft: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'right' };
                                                const scoreRight: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'left' };
                                                const isByeAutoComplete = !!match.winner_id && (!match.player1_id || !match.player2_id);
                                                const isByeFromSource = round === 1 && (match.player1_id !== '' || match.player2_id !== '') && (
                                                    (!match.player1_id && match.player2_id && isWR1SourceBye(idx, 1)) ||
                                                    (match.player1_id && !match.player2_id && isWR1SourceBye(idx, 2))
                                                );
                                                if (isByeAutoComplete || isByeFromSource) {
                                                    return (
                                                        <>
                                                            <span style={{ ...scoreLeft, color: match.player1_id ? '#ED1C1F' : '#ACB3C3', fontWeight: 700 }}>{match.player1_id ? 'WO' : '-'}</span>
                                                            <span className="mx-3">vs</span>
                                                            <span style={{ ...scoreRight, color: match.player2_id ? '#ED1C1F' : '#ACB3C3', fontWeight: 700 }}>{match.player2_id ? 'WO' : '-'}</span>
                                                        </>
                                                    );
                                                }
                                                const p1Absent = match.player1_check_in === 'absent';
                                                const p2Absent = match.player2_check_in === 'absent';
                                                if (p1Absent || p2Absent) {
                                                    return (
                                                        <>
                                                            <span style={{ ...scoreLeft, color: p1Absent ? '#ACB3C3' : '#ED1C1F', fontWeight: 700 }}>{p1Absent ? 'NS' : '-'}</span>
                                                            <span className="mx-3">vs</span>
                                                            <span style={{ ...scoreRight, color: p2Absent ? '#ACB3C3' : '#ED1C1F', fontWeight: 700 }}>{p2Absent ? 'NS' : '-'}</span>
                                                        </>
                                                    );
                                                }
                                                return <><span style={scoreLeft}>{match.player1_score}</span><span className="mx-3">vs</span><span style={scoreRight}>{match.player2_score}</span></>;
                                            })()}
                                        </td>
                                        <td className="p-3">
                                            <span className={'text-gray-800 dark:text-gray-200'} style={match.winner_id === match.player2_id && match.winner_id ? { fontWeight: 700, ...(round === 2 && match.player1_id ? { color: '#91d913' } : {}) } : undefined}>
                                                {getPlayerName(match.player2_id) || (
                                                    (match.winner_id && !match.player2_id) || (round === 1 && !match.player2_id && match.player1_id && isWR1SourceBye(idx, 2))
                                                        ? <span className="text-gray-400 italic font-semibold text-xs">bye</span>
                                                        : <span className="text-gray-400 italic text-xs">{sourceLabels[idx]?.[1] ?? 'Chờ...'}</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-xs text-gray-600 dark:text-gray-300">
                                            {match.table_no || <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="inline-flex items-center gap-1.5 text-xs">
                                                <span className="w-2 h-2 rounded-full" style={{ background: badge.color }} />
                                                {badge.label}
                                            </span>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (bracketLoading) return <div className="flex justify-center p-12"><Spinner /></div>;

    const r1Label = 'Vòng 1: Nhánh thua';
    const r2Label = 'Vòng 2: Nhánh thua';

    return (
        <div className="mt-4 space-y-12 pb-10">
            {visibleRounds.includes(1) && renderRound(1, round1, r1Label)}

            {visibleRounds.includes(2) && (
                <div>
                    {renderRound(2, round2, r2Label)}
                </div>
            )}

            <MatchManagementDialog
                isOpen={!!editingMatch}
                onClose={handleDialogClose}
                match={currentMatch}
                players={players}
                tables={tables}
                tournament={tournament}
                onChange={(field, value) => editingMatch && onChange(editingMatch.round, editingMatch.idx, field, value)}
                onSave={saveMatch}
            />
        </div>
    );
};

export default TournamentLosersBracketTab;
