/**
 * Winners Bracket Tab — manages round 1 & 2 of the winners bracket.
 * Simplified table view with match management dialog.
 * Auto-saves individual matches when the dialog is closed.
 */
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import {
    type MatchVM,
    createEmptyMatch, toVM, resolveWinner,
    getRaceToNumber, getRaceToInfo, handleMatchChange, validateMatchTimes
} from '../utils/bracketUtils';
import { useAllTables } from '../hooks/useAllTables';
import MatchManagementDialog from './MatchManagementDialog';
import TableAssignModal from './TableAssignModal';

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
    // null = all tables enabled; string[] = only these in auto-assign pool
    enabledTables?: string[] | null;
    onTablePoolChange?: (names: string[]) => void;
    priorityTables?: string[];
    onPriorityTablesChange?: (names: string[]) => void;
}

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
    pending: { color: '#C6010B', label: 'Chưa diễn ra' },
    upcoming: { color: '#FAC600', label: 'Sắp diễn ra' },
    ongoing: { color: '#00B814', label: 'Đang diễn ra' },
    completed: { color: '#575E70', label: 'Đã kết thúc' },
};

const TournamentWinnersBracketTab = ({ numberOfPlayers, players, matches, tournament, bracketLoading, onUpsertMatch, onDirty, onClean, visibleRounds = [1, 2], enabledTables, onTablePoolChange, priorityTables = [], onPriorityTablesChange }: Props) => {
    const { tables } = useAllTables();
    // size tier: 16, 32, or 64
    const size: 16 | 32 | 64 = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
    const dirtyRef = useRef(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const priorityDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showPriorityDropdown) return;
        const handler = (e: MouseEvent) => {
            if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(e.target as Node))
                setShowPriorityDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPriorityDropdown]);

    // Tracks WR2 matches already saved-with-players to avoid duplicate auto-saves
    const prevR2FilledRef = useRef<Set<number>>(new Set());
    // Tracks if a table swap happened: stores match_no of the other (non-edited) match
    const pendingSwapRef = useRef<number | null>(null);

    const round1Nos = useMemo(() => {
        const count = size === 64 ? 32 : size === 32 ? 16 : 8;
        return Array.from({ length: count }, (_, i) => 1 + i);
    }, [size]);
    const round2Nos = useMemo(() => {
        // 16p: WR2 starts at 13  (4 matches)
        // 32p: WR2 starts at 25  (8 matches)
        // 64p: WR2 starts at 49  (16 matches)
        const start = size === 64 ? 49 : size === 32 ? 25 : 13;
        const count = size === 64 ? 16 : size === 32 ? 8 : 4;
        return Array.from({ length: count }, (_, i) => start + i);
    }, [size]);

    const [round1, setRound1] = useState<MatchVM[]>(() => round1Nos.map(n => toVM(createEmptyMatch(n, 'winners', 1))));
    const [round2, setRound2] = useState<MatchVM[]>(() => round2Nos.map(n => toVM(createEmptyMatch(n, 'winners', 2))));

    // Dialog state
    const [editingMatch, setEditingMatch] = useState<{ round: 1 | 2; idx: number } | null>(null);
    const [assigningRound, setAssigningRound] = useState<1 | 2 | null>(null);

    useEffect(() => {
        setRound1(round1Nos.map(n => toVM(createEmptyMatch(n, 'winners', 1))));
        setRound2(round2Nos.map(n => toVM(createEmptyMatch(n, 'winners', 2))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    useEffect(() => {
        const map = new Map(matches.map(m => [m.match_no, m]));
        setRound1(round1Nos.map(no => toVM(map.get(no) ?? createEmptyMatch(no, 'winners', 1))));
        setRound2(round2Nos.map(no => toVM(map.get(no) ?? createEmptyMatch(no, 'winners', 2))));
    }, [matches, round1Nos, round2Nos]);

    // Initialize prevR2FilledRef from DB on mount so existing matches aren't auto-saved again
    useEffect(() => {
        round2Nos.forEach(no => {
            const m = matches.find(x => x.match_no === no);
            if (m?.player1_id && m?.player2_id) prevR2FilledRef.current.add(no);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Propagate winners R1 → R2
    useEffect(() => {
        if (round2.length !== round2Nos.length) return;
        const next = [...round2];
        let changed = false;
        for (let i = 0; i < round2Nos.length; i++) {
            const w1 = round1[i * 2]?.winner_id || '';
            const w2 = round1[i * 2 + 1]?.winner_id || '';
            let item = next[i];
            // Track if a slot is being cleared because R1 has no winner yet.
            // In that case we must also clear stale winner_id/status — even on completed matches —
            // because R2 cannot have a legitimate result without both R1 feeders decided.
            let slotCleared = false;
            if (item.player1_id !== w1) { if (w1 === '') slotCleared = true; item = { ...item, player1_id: w1 }; changed = true; }
            if (item.player2_id !== w2) { if (w2 === '') slotCleared = true; item = { ...item, player2_id: w2 }; changed = true; }
            const winner = resolveWinner(item, getRaceToNumber(item.player1_id, item.player2_id, players, tournament));
            // winner_id set but a player slot is empty = inconsistent state (e.g. DB has stale winner
            // from when both players existed, but now one feeder R1 match has no winner).
            const inconsistentWinner = !!item.winner_id && (!item.player1_id || !item.player2_id);
            // Don't clear winner_id for completed matches when resolveWinner can't compute one
            // (e.g. walkover/absent matches or players without ranks) — UNLESS a feeder slot was cleared
            // or the state is inconsistent (winner_id set with missing player).
            const shouldUpdate = item.winner_id !== winner && (winner !== '' || item.status !== 'completed' || slotCleared || inconsistentWinner);
            if (shouldUpdate) {
                item = { ...item, winner_id: winner };
                if ((slotCleared || inconsistentWinner) && winner === '') item = { ...item, status: 'pending' };
                changed = true;
            }
            next[i] = item;
        }
        if (changed) setRound2(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round1]);


    // Auto-save WR2 when propagation newly fills both player slots
    // This allows TournamentDetail's auto-assign to detect the match and assign a free table
    useEffect(() => {
        for (const m of round2) {
            if (!m.player1_id || !m.player2_id) continue;
            if (prevR2FilledRef.current.has(m.match_no)) continue;
            prevR2FilledRef.current.add(m.match_no);
            onUpsertMatch(m.match_no, {
                bracket: 'winners',
                round: 2,
                player1_id: parseInt(m.player1_id, 10),
                player2_id: parseInt(m.player2_id, 10),
                player1_score: parseInt(m.player1_score, 10) || 0,
                player2_score: parseInt(m.player2_score, 10) || 0,
                table_no: m.table_no || null,
                match_time: m.match_time || null,
                status: m.status,
                player1_check_in: m.player1_check_in || 'unconfirmed',
                player2_check_in: m.player2_check_in || 'unconfirmed',
                winner_id: m.winner_id ? parseInt(m.winner_id, 10) : null,
            }).catch(() => {
                prevR2FilledRef.current.delete(m.match_no);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round2]);

    const onChange = (round: 1 | 2, idx: number, field: keyof MatchVM, value: string) => {
        dirtyRef.current = true;
        onDirty?.();

        if (field === 'table_no' && value) {
            const currentMatch = round === 1 ? round1[idx] : round2[idx];
            const currentTable = currentMatch?.table_no;
            // Find another upcoming match in this bracket with the same table
            const conflict = [...round1, ...round2].find(
                m => m.table_no === value && m.match_no !== currentMatch?.match_no && m.status === 'upcoming'
            );
            if (conflict && currentTable) {
                // Atomic swap: update both matches at once without calling handleMatchChange
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

    // Auto-save when player is assigned directly from dropdown (not via dialog)
    const onPlayerChange = useCallback((round: 1 | 2, idx: number, field: 'player1_id' | 'player2_id', value: string) => {
        dirtyRef.current = true;
        onDirty?.();
        const arr = round === 1 ? round1 : round2;
        const match = arr[idx];
        if (!match) return;

        const p1Id = field === 'player1_id' ? value : match.player1_id;
        const p2Id = field === 'player2_id' ? value : match.player2_id;
        const info = getRaceToInfo(p1Id, p2Id, players, tournament);
        let p1Score = '0', p2Score = '0';
        if (info.handicap > 0) {
            if (info.handicappedPlayerId === p1Id) p1Score = String(info.handicap);
            if (info.handicappedPlayerId === p2Id) p2Score = String(info.handicap);
        }

        handleMatchChange(round, idx, field, value, round1, round2, setRound1, setRound2, players, tournament);

        onUpsertMatch(match.match_no, {
            bracket: 'winners',
            round,
            player1_id: p1Id ? parseInt(p1Id, 10) : null,
            player2_id: p2Id ? parseInt(p2Id, 10) : null,
            player1_score: parseInt(p1Score, 10) || 0,
            player2_score: parseInt(p2Score, 10) || 0,
            table_no: match.table_no || null,
            match_time: match.match_time || null,
            status: 'pending',
            player1_check_in: match.player1_check_in || 'unconfirmed',
            player2_check_in: match.player2_check_in || 'unconfirmed',
            winner_id: null,
        }).then(() => onClean?.()).catch(() => toast.error('Không thể lưu trận đấu'));
    }, [round1, round2, players, tournament, onUpsertMatch, onDirty, onClean]);

    // Save single match
    const saveMatch = useCallback(async (round?: 1 | 2, idx?: number) => {
        const target = round !== undefined && idx !== undefined
            ? { round, idx }
            : editingMatch;
        if (!target) return;
        const match = target.round === 1 ? round1[target.idx] : round2[target.idx];
        if (!match) return;
        const errorMsg = validateMatchTimes([match], tournament.start_date);
        if (errorMsg) { toast.error(errorMsg); throw new Error(errorMsg); }

        await onUpsertMatch(match.match_no, {
            bracket: 'winners',
            round: target.round,
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
        });
        toast.success(`Đã lưu trận ${match.match_no}`);
        dirtyRef.current = false; // prevent double-save when called explicitly via Save button
        onClean?.();
    }, [editingMatch, round1, round2, tournament, onUpsertMatch, onClean]);

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
                            bracket: 'winners', round: swappedRound,
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

    const assignTables = useCallback(async (round: 1 | 2, tableNames: string[]) => {
        const arr = round === 1 ? round1 : round2;
        const setter = round === 1 ? setRound1 : setRound2;

        // Update table pool first so future auto-assign respects this selection
        onTablePoolChange?.(tableNames);

        // Exclude tables already assigned to other matches so we don't create duplicates
        const usedTables = new Set(arr.map(m => m.table_no).filter(Boolean));
        const available = tableNames.filter(t => !usedTables.has(t));
        // Put priority tables first if configured
        const freeTables = priorityTables.length > 0
            ? [...available.filter(t => priorityTables.includes(t)), ...available.filter(t => !priorityTables.includes(t))]
            : available;

        let tableIdx = 0;
        const updated = arr.map((m) => {
            // Never overwrite a match that is already active or already has a table assigned
            if (m.status === 'ongoing' || m.status === 'upcoming' || m.table_no) return m;
            if (tableIdx >= freeTables.length) return m;
            return { ...m, table_no: freeTables[tableIdx++] };
        });
        setter(updated);

        // Only save matches whose table_no actually changed
        const saves = updated
            .filter((m, i) => m.table_no !== arr[i].table_no)
            .map((m) =>
                onUpsertMatch(m.match_no, {
                    bracket: 'winners',
                    round,
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
                })
            );

        if (saves.length === 0) {
            toast('Tất cả trận đã có bàn. Chỉnh sửa từng trận để thay đổi.', { icon: 'ℹ️' });
            return;
        }

        try {
            await Promise.all(saves);
            toast.success(`Đã xếp bàn cho ${saves.length} trận`);
            onClean?.();
        } catch {
            toast.error('Không thể lưu một số trận đấu');
        }
    }, [round1, round2, onUpsertMatch, onClean, onTablePoolChange]);

    const selectedPlayerIds = round1.flatMap(m => [m.player1_id, m.player2_id]).filter(Boolean);

    const getPlayerName = (id: string) => players.find(p => p.id === parseInt(id, 10))?.full_name;

    const currentMatch = editingMatch
        ? (editingMatch.round === 1 ? round1[editingMatch.idx] : round2[editingMatch.idx])
        : null;

    const renderRound = (round: 1 | 2, matchesVM: MatchVM[], title: string) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
                <h4 className="text-md font-bold text-gray-800 dark:text-white uppercase">{title}</h4>
                <span className="text-xs text-gray-400">({matchesVM.length} trận đấu)</span>
                {round === 1 && (
                    <>
                        <button
                            className="ml-2 inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => setAssigningRound(round)}
                        >
                            <Icon icon="solar:billiards-outline" className="text-sm" />
                            Xếp bàn
                        </button>
                        <div className="relative ml-1" ref={priorityDropdownRef}>
                            <button
                                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors ${priorityTables.length > 0 ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-900' : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                onClick={() => setShowPriorityDropdown(v => !v)}
                            >
                                <Icon icon={priorityTables.length > 0 ? 'solar:star-bold' : 'solar:star-outline'} className="text-sm" />
                                {priorityTables.length === 0
                                    ? 'Bàn ưu tiên'
                                    : priorityTables.length === 1
                                        ? `Ưu tiên: ${priorityTables[0]}`
                                        : `Ưu tiên: ${priorityTables.length} bàn`}
                            </button>
                            {showPriorityDropdown && (
                                <div className="absolute left-0 top-full mt-1 z-30 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    {priorityTables.length > 0 && (
                                        <>
                                            <button
                                                className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-t-lg"
                                                onClick={() => onPriorityTablesChange?.([])}
                                            >
                                                <Icon icon="solar:close-circle-outline" className="text-sm" />
                                                Bỏ tất cả ưu tiên
                                            </button>
                                            <div className="border-t border-gray-100 dark:border-gray-700" />
                                        </>
                                    )}
                                    <div className="max-h-48 overflow-y-auto py-1">
                                        {tables.map(t => {
                                            const active = priorityTables.includes(t.name);
                                            return (
                                                <button
                                                    key={t.id}
                                                    className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs ${active ? 'bg-yellow-50 font-semibold text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                                    onClick={() => {
                                                        const next = active
                                                            ? priorityTables.filter(n => n !== t.name)
                                                            : [...priorityTables, t.name];
                                                        onPriorityTablesChange?.(next);
                                                    }}
                                                >
                                                    <Icon icon={active ? 'solar:star-bold' : 'solar:star-outline'} className={`text-sm ${active ? 'text-yellow-500' : 'text-gray-400'}`} />
                                                    {t.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
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
                                        {round === 1 ? (() => {
                                            if (match.winner_id) {
                                                const isP1Winner = match.winner_id === match.player1_id;
                                                return (
                                                    <span className={'text-gray-800 dark:text-gray-200'} style={isP1Winner ? { fontWeight: 700 } : undefined}>
                                                        {getPlayerName(match.player1_id) || (!match.player1_id ? <span className="text-gray-400 italic font-semibold text-xs">bye</span> : '—')}
                                                    </span>
                                                );
                                            }
                                            const available = players.filter(p => !selectedPlayerIds.includes(p.id.toString()) || match.player1_id === p.id.toString());
                                            if (!match.player1_id && available.length === 0) {
                                                return <span className="text-gray-400 italic font-semibold text-xs">bye</span>;
                                            }
                                            return (
                                                <select
                                                    className="match-table-player-select"
                                                    onClick={e => e.stopPropagation()}
                                                    value={match.player1_id}
                                                    onChange={e => onPlayerChange(round, idx, 'player1_id', e.target.value)}
                                                >
                                                    <option value="">Chọn người chơi</option>
                                                    {available.map(p => <option key={p.id} value={p.id}>{p.full_name} {p.rank ? `(${p.rank})` : ''}</option>)}
                                                </select>
                                            );
                                        })() : (
                                            <span className={'text-gray-800 dark:text-gray-200'} style={match.winner_id === match.player1_id && match.winner_id ? { fontWeight: 700, ...(round === 2 ? { color: '#91d913' } : {}) } : undefined}>
                                                {getPlayerName(match.player1_id) || <span className="text-gray-400 italic text-xs">Thắng trận {round1[idx * 2]?.match_no}</span>}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                        {(() => {
                                            const scoreLeft: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'right' };
                                            const scoreRight: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'left' };
                                            const isBye = !!match.winner_id && (!match.player1_id || !match.player2_id);
                                            if (isBye) {
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
                                        {round === 1 ? (() => {
                                            if (match.winner_id) {
                                                const isP2Winner = match.winner_id === match.player2_id;
                                                return (
                                                    <span className={'text-gray-800 dark:text-gray-200'} style={isP2Winner ? { fontWeight: 700 } : undefined}>
                                                        {getPlayerName(match.player2_id) || (!match.player2_id ? <span className="text-gray-400 italic font-semibold text-xs">bye</span> : '—')}
                                                    </span>
                                                );
                                            }
                                            const available = players.filter(p => !selectedPlayerIds.includes(p.id.toString()) || match.player2_id === p.id.toString());
                                            if (!match.player2_id && available.length === 0) {
                                                return <span className="text-gray-400 italic font-semibold text-xs">bye</span>;
                                            }
                                            return (
                                                <select
                                                    className="match-table-player-select"
                                                    onClick={e => e.stopPropagation()}
                                                    value={match.player2_id}
                                                    onChange={e => onPlayerChange(round, idx, 'player2_id', e.target.value)}
                                                >
                                                    <option value="">Chọn người chơi</option>
                                                    {available.map(p => <option key={p.id} value={p.id}>{p.full_name} {p.rank ? `(${p.rank})` : ''}</option>)}
                                                </select>
                                            );
                                        })() : (
                                            <span className={'text-gray-800 dark:text-gray-200'} style={match.winner_id === match.player2_id && match.winner_id ? { fontWeight: 700, ...(round === 2 ? { color: '#91d913' } : {}) } : undefined}>
                                                {getPlayerName(match.player2_id) || <span className="text-gray-400 italic text-xs">Thắng trận {round1[idx * 2 + 1]?.match_no}</span>}
                                            </span>
                                        )}
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

    if (bracketLoading) return <div className="flex justify-center p-12"><Spinner /></div>;

    const r1Label = 'Vòng 1';
    const r2Label = 'Vòng 2 nhánh thắng';

    return (
        <div className="mt-4 space-y-12 pb-10">
            {visibleRounds.includes(1) && renderRound(1, round1, r1Label)}

            {visibleRounds.includes(2) && (
                <div>
                    {renderRound(2, round2, r2Label)}
                </div>
            )}

            {/* Match Management Dialog */}
            <MatchManagementDialog
                isOpen={!!editingMatch}
                onClose={handleDialogClose}
                match={currentMatch}
                players={players}
                tables={tables}
                tournament={tournament}
                onChange={(field, value) => editingMatch && onChange(editingMatch.round, editingMatch.idx, field, value)}
                onSave={saveMatch}
                isPlayerSelectable={editingMatch?.round === 1}
                availablePlayers={players}
                selectedIds={selectedPlayerIds}
            />

            {/* Table Assignment Modal */}
            <TableAssignModal
                isOpen={assigningRound !== null}
                onClose={() => setAssigningRound(null)}
                tables={tables}
                matchCount={assigningRound === 1 ? round1.length : round2.length}
                roundTitle={assigningRound === 1 ? r1Label : r2Label}
                initialSelected={enabledTables ?? tables.map(t => t.name)}
                onApply={(tableNames) => assigningRound && assignTables(assigningRound, tableNames)}
            />
        </div>
    );
};

export default TournamentWinnersBracketTab;
