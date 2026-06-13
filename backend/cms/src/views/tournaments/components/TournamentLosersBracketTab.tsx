/**
 * Losers Bracket Tab — manages round 1 & 2 of the losers bracket.
 * Simplified table view with match management dialog.
 * Auto-saves individual matches when the dialog is closed.
 */
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Spinner } from 'flowbite-react';
import toast from 'react-hot-toast';
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import {
    type MatchVM,
    createEmptyMatch, toVM, resolveWinner,
    getLoserFromMatch, getWinnerFromMatch,
    getRaceToNumber, getRaceToInfo, handleMatchChange, validateMatchTimes
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

    const isRegistrationClosed = tournament.registration_end_date
        ? new Date() > new Date(tournament.registration_end_date)
        : false;
    const fallbackText = isRegistrationClosed ? 'bye' : 'Chờ đăng ký';

    const byeAutoSavedRef = useRef<Set<number>>(new Set());
    const pendingSwapRef = useRef<number | null>(null);
    const prevLR1FilledRef = useRef<Set<number>>(new Set());
    const prevLR2FilledRef = useRef<Set<number>>(new Set());

    // LR1: 16p → 9–12 (4), 32p → 17–24 (8), 64p → 33–48 (16), 24p → 17–24 (8)
    const round1Nos = useMemo(() => {
        if (numberOfPlayers === 24) {
            return Array.from({ length: 8 }, (_, i) => 17 + i);
        }
        const config = { 16: { start: 9, count: 4 }, 32: { start: 17, count: 8 }, 64: { start: 33, count: 16 } };
        const { start, count } = config[size];
        return Array.from({ length: count }, (_, i) => start + i);
    }, [size, numberOfPlayers]);

    // LR2: 16p → 17–20 (4), 32p → 33–40 (8), 64p → 65–80 (16), 24p → [] (0)
    const round2Nos = useMemo(() => {
        if (numberOfPlayers === 24) {
            return [];
        }
        const config = { 16: { start: 17, count: 4 }, 32: { start: 33, count: 8 }, 64: { start: 65, count: 16 } };
        const { start, count } = config[size];
        return Array.from({ length: count }, (_, i) => start + i);
    }, [size, numberOfPlayers]);

    const [round1, setRound1] = useState<MatchVM[]>(() => round1Nos.map(n => toVM(createEmptyMatch(n, 'losers', 1))));
    const [round2, setRound2] = useState<MatchVM[]>(() => round2Nos.map(n => toVM(createEmptyMatch(n, 'losers', 2))));

    // Dialog state
    const [editingMatch, setEditingMatch] = useState<{ round: 1 | 2; idx: number } | null>(null);

    useEffect(() => {
        setRound1(round1Nos.map(n => toVM(createEmptyMatch(n, 'losers', 1))));
        setRound2(round2Nos.map(n => toVM(createEmptyMatch(n, 'losers', 2))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round1Nos.join(','), round2Nos.join(',')]);

    const matchMap = useMemo(() => new Map(matches.map(m => [m.match_no, m])), [matches]);

    // Initialize filled-refs from DB on mount so existing matches aren't auto-saved again.
    // Only initialize refs for the rounds this instance is responsible for (visibleRounds).
    useEffect(() => {
        if (visibleRounds.includes(1))
            round1Nos.forEach(no => { const m = matchMap.get(no); if (m?.player1_id && m?.player2_id) prevLR1FilledRef.current.add(no); });
        if (visibleRounds.includes(2))
            round2Nos.forEach(no => { const m = matchMap.get(no); if (m?.player1_id && m?.player2_id) prevLR2FilledRef.current.add(no); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const losersRound1Seed = useMemo(() => {
        if (numberOfPlayers === 24) {
            const seed: Record<number, [string, string]> = {};
            for (let i = 0; i < 8; i++) {
                const wr2No = 16 - i;
                const wr1No = 1 + i;
                seed[17 + i] = [
                    getLoserFromMatch(matchMap.get(wr2No)) || '',
                    getLoserFromMatch(matchMap.get(wr1No)) || '',
                ];
            }
            return seed;
        }
        // WR1 count: 16p → 8, 32p → 16, 64p → 32
        const wr1Count = size === 64 ? 32 : size === 32 ? 16 : 8;
        const losers = Array.from({ length: wr1Count }, (_, i) => getLoserFromMatch(matchMap.get(1 + i)));
        const seed: Record<number, [string, string]> = {};
        for (let i = 0; i < losers.length / 2; i++) {
            seed[round1Nos[i]] = [losers[i * 2] || '', losers[i * 2 + 1] || ''];
        }
        return seed;
    }, [size, numberOfPlayers, matchMap, round1Nos]);

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
                // Preserve DB player if seed source not yet resolved (prevents wiping players on polling lag)
                const next: MatchVM = { ...base, match_no: no, player1_id: seeded[0] || base.player1_id || '', player2_id: seeded[1] || base.player2_id || '' };
                const w = resolveWinner(next, getRaceToNumber(next.player1_id, next.player2_id, players, tournament));
                if (next.winner_id !== w && (w !== '' || next.status !== 'completed')) next.winner_id = w;
                return next;
            });
        setRound1(syncRound(round1Nos, 1, losersRound1Seed));
        setRound2(syncRound(round2Nos, 2, losersRound2Seed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchMap, losersRound1Seed, losersRound2Seed, round1Nos, round2Nos]);

    // Auto-save LR1/LR2 when both player slots are newly filled.
    // Guarded by visibleRounds so each instance only owns the rounds it renders,
    // preventing duplicate saves when two instances coexist in TournamentQualificationTab.
    useEffect(() => {
        if (!visibleRounds.includes(1)) return;
        for (const m of round1) {
            if (!m.player1_id || !m.player2_id) continue;
            if (prevLR1FilledRef.current.has(m.match_no)) continue;
            prevLR1FilledRef.current.add(m.match_no);
            onUpsertMatch(m.match_no, {
                bracket: 'losers', round: 1,
                player1_id: parseInt(m.player1_id, 10), player2_id: parseInt(m.player2_id, 10),
                player1_score: parseInt(m.player1_score, 10) || 0, player2_score: parseInt(m.player2_score, 10) || 0,
                table_no: m.table_no || null, match_time: m.match_time || null,
                status: m.status,
                player1_check_in: m.player1_check_in || 'unconfirmed', player2_check_in: m.player2_check_in || 'unconfirmed',
                winner_id: m.winner_id ? parseInt(m.winner_id, 10) : null,
                player1_points: m.player1_points !== undefined && m.player1_points !== '' ? parseInt(m.player1_points, 10) : null,
                player2_points: m.player2_points !== undefined && m.player2_points !== '' ? parseInt(m.player2_points, 10) : null,
            }).catch(() => { prevLR1FilledRef.current.delete(m.match_no); });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round1]);

    useEffect(() => {
        if (!visibleRounds.includes(2)) return;
        for (const m of round2) {
            if (!m.player1_id || !m.player2_id) continue;
            if (prevLR2FilledRef.current.has(m.match_no)) continue;
            prevLR2FilledRef.current.add(m.match_no);
            onUpsertMatch(m.match_no, {
                bracket: 'losers', round: 2,
                player1_id: parseInt(m.player1_id, 10), player2_id: parseInt(m.player2_id, 10),
                player1_score: parseInt(m.player1_score, 10) || 0, player2_score: parseInt(m.player2_score, 10) || 0,
                table_no: m.table_no || null, match_time: m.match_time || null,
                status: m.status,
                player1_check_in: m.player1_check_in || 'unconfirmed', player2_check_in: m.player2_check_in || 'unconfirmed',
                winner_id: m.winner_id ? parseInt(m.winner_id, 10) : null,
                player1_points: m.player1_points !== undefined && m.player1_points !== '' ? parseInt(m.player1_points, 10) : null,
                player2_points: m.player2_points !== undefined && m.player2_points !== '' ? parseInt(m.player2_points, 10) : null,
            }).catch(() => { prevLR2FilledRef.current.delete(m.match_no); });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round2]);

    // Helper: check if a source match feeding a LR1 slot is a BYE
    // (has exactly one player assigned, other is null → no loser to send)
    const isWR1SourceBye = useCallback((lr1Idx: number, slot: 1 | 2): boolean => {
        let sourceMatchNo = 0;
        if (numberOfPlayers === 24) {
            sourceMatchNo = slot === 1 ? (16 - lr1Idx) : (1 + lr1Idx);
        } else {
            sourceMatchNo = slot === 1 ? (1 + lr1Idx * 2) : (1 + lr1Idx * 2 + 1);
        }
        const sourceMatch = matchMap.get(sourceMatchNo);
        if (!sourceMatch) return false;
        // A match with exactly one player is only a BYE when it already has a winner.
        // If winner_id is null, the empty slot is waiting for propagation — not a BYE.
        if (!sourceMatch.winner_id) return false;
        return (!!sourceMatch.player1_id !== !!sourceMatch.player2_id);
    }, [matchMap, numberOfPlayers]);

    // Auto-complete BYE matches in Losers Round 1
    // When a WR1 match was a BYE (only one player, auto-wins), there is no loser to send to LR1.
    // The corresponding LR1 match will have only one player and should auto-complete as BYE.
    // Also auto-saves to backend so LR2 can pick up the winner.
    useEffect(() => {
        // Only the instance rendering LR1 handles BYE auto-complete to avoid duplicate saves
        if (!visibleRounds.includes(1)) return;
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
                        player1_points: next[i].player1_points !== undefined && next[i].player1_points !== '' ? parseInt(next[i].player1_points, 10) : null,
                        player2_points: next[i].player2_points !== undefined && next[i].player2_points !== '' ? parseInt(next[i].player2_points, 10) : null,
                    }).catch(() => {
                        // If save fails, allow retry on next cycle
                        byeAutoSavedRef.current.delete(m.match_no);
                    });
                }
            }
        }
        if (changed) setRound1(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round1, matchMap, players.length, size, isWR1SourceBye]);

    const onChange = (round: 1 | 2, idx: number, field: keyof MatchVM, value: string) => {
        dirtyRef.current = true;
        onDirty?.();

        if (field === 'table_no' && value) {
            const currentMatch = round === 1 ? round1[idx] : round2[idx];
            const currentTable = currentMatch?.table_no;
            const conflict = [...round1, ...round2].find(
                m => m.table_no === value && m.match_no !== currentMatch?.match_no && m.status === 'upcoming'
            );
            if (conflict && currentTable) {
                const r1ConflIdx = round1.findIndex(m => m.match_no === conflict.match_no);
                const r2ConflIdx = round2.findIndex(m => m.match_no === conflict.match_no);
                setRound1(round1.map((m, i) => {
                    if (round === 1 && i === idx) return { ...m, table_no: value };
                    if (i === r1ConflIdx) return { ...m, table_no: currentTable };
                    return m;
                }));
                setRound2(round2.map((m, i) => {
                    if (round === 2 && i === idx) return { ...m, table_no: value };
                    if (i === r2ConflIdx) return { ...m, table_no: currentTable };
                    return m;
                }));
                pendingSwapRef.current = conflict.match_no;
                return;
            }
        }

        pendingSwapRef.current = null;
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
            player1_check_in: match.player1_check_in || 'unconfirmed',
            player2_check_in: match.player2_check_in || 'unconfirmed',
            winner_id: match.winner_id ? parseInt(match.winner_id, 10) : null,
            player1_points: match.player1_points !== undefined && match.player1_points !== '' ? parseInt(match.player1_points, 10) : null,
            player2_points: match.player2_points !== undefined && match.player2_points !== '' ? parseInt(match.player2_points, 10) : null,
        });
        toast.success(`Đã lưu trận ${match.match_no}`);
        dirtyRef.current = false; // prevent double-save when called explicitly via Save button
        onClean?.();
    }, [editingMatch, round1, round2, tournament, onUpsertMatch, onClean]);

    // Wrapper: save and close dialog (only close on success, throw on error so dialog stays open)
    const handleDialogSave = useCallback(async () => {
        await saveMatch();
        flushSync(() => setEditingMatch(null));
    }, [saveMatch]);

    // Auto-save when dialog closes; also saves the other match if a table swap happened
    const handleDialogClose = useCallback(async () => {
        if (editingMatch && dirtyRef.current) {
            try {
                await saveMatch();
                const swappedNo = pendingSwapRef.current;
                if (swappedNo !== null) {
                    const swapped = round1.find(m => m.match_no === swappedNo) ?? round2.find(m => m.match_no === swappedNo);
                    const swappedRound: 1 | 2 = round1.some(m => m.match_no === swappedNo) ? 1 : 2;
                    if (swapped) {
                        await onUpsertMatch(swappedNo, {
                            bracket: 'losers', round: swappedRound,
                            player1_id: swapped.player1_id ? parseInt(swapped.player1_id, 10) : null,
                            player2_id: swapped.player2_id ? parseInt(swapped.player2_id, 10) : null,
                            player1_score: parseInt(swapped.player1_score, 10) || 0,
                            player2_score: parseInt(swapped.player2_score, 10) || 0,
                            table_no: swapped.table_no || null,
                            match_time: swapped.match_time || null,
                            status: swapped.status,
                            player1_check_in: swapped.player1_check_in || 'unconfirmed',
                            player2_check_in: swapped.player2_check_in || 'unconfirmed',
                            winner_id: swapped.winner_id ? parseInt(swapped.winner_id, 10) : null,
                            player1_points: swapped.player1_points !== undefined && swapped.player1_points !== '' ? parseInt(swapped.player1_points, 10) : null,
                            player2_points: swapped.player2_points !== undefined && swapped.player2_points !== '' ? parseInt(swapped.player2_points, 10) : null,
                        });
                        toast.success(`Trận ${swappedNo} → ${swapped.table_no || '—'}`);
                    }
                    pendingSwapRef.current = null;
                }
            } catch { /* validation error already shown */ }
            dirtyRef.current = false;
        }
        setEditingMatch(null);
    }, [editingMatch, saveMatch, round1, round2, onUpsertMatch]);

    const getPlayerName = (id: string) => players.find(p => p.id === parseInt(id, 10))?.full_name;

    const currentMatch = editingMatch
        ? (editingMatch.round === 1 ? round1[editingMatch.idx] : round2[editingMatch.idx])
        : null;

    /**
     * Compute descriptive source labels for each player slot in a round.
     * Returns an array of [player1Label, player2Label] per match.
     */
    const getSourceLabels = (round: 1 | 2): Array<[string, string]> => {
        if (numberOfPlayers === 24) {
            if (round === 1) {
                // For 24 players, LR1 player1 = loser of WR2 (reversed: 16 - i), player2 = loser of WR1 (direct: 1 + i)
                return round1Nos.map((_, i) => {
                    const wr2No = 16 - i;
                    const wr1No = 1 + i;
                    return [`Thua trận ${wr2No}`, `Thua trận ${wr1No}`] as [string, string];
                });
            }
            return [];
        }
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
                                                        ? <span className="text-gray-400 italic font-semibold text-xs">{fallbackText}</span>
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
                                                let p1Score = match.player1_score;
                                                let p2Score = match.player2_score;
                                                if (match.player1_id && match.player2_id) {
                                                    const info = getRaceToInfo(match.player1_id, match.player2_id, players, tournament);
                                                    const noScoresYet = parseInt(match.player1_score, 10) === 0 && parseInt(match.player2_score, 10) === 0;
                                                    if (info.handicap > 0 && (match.status === 'pending' || match.status === 'upcoming' || (match.status === 'ongoing' && noScoresYet))) {
                                                        p1Score = info.handicappedPlayerId === match.player1_id ? String(info.handicap) : '0';
                                                        p2Score = info.handicappedPlayerId === match.player2_id ? String(info.handicap) : '0';
                                                    }
                                                }
                                                return <><span style={scoreLeft}>{p1Score}</span><span className="mx-3">vs</span><span style={scoreRight}>{p2Score}</span></>;
                                            })()}
                                        </td>
                                        <td className="p-3">
                                            <span className={'text-gray-800 dark:text-gray-200'} style={match.winner_id === match.player2_id && match.winner_id ? { fontWeight: 700, ...(round === 2 && match.player1_id ? { color: '#91d913' } : {}) } : undefined}>
                                                {getPlayerName(match.player2_id) || (
                                                    (match.winner_id && !match.player2_id) || (round === 1 && !match.player2_id && match.player1_id && isWR1SourceBye(idx, 2))
                                                        ? <span className="text-gray-400 italic font-semibold text-xs">{fallbackText}</span>
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

    const r1Label = numberOfPlayers === 24 ? 'Vòng 2: Nhánh thua' : 'Vòng 1: Nhánh thua';
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
                onSave={handleDialogSave}
            />


        </div>
    );
};

export default TournamentLosersBracketTab;
