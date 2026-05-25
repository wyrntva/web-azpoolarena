/**
 * Winners Bracket Tab — manages round 1 & 2 of the winners bracket.
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

const TournamentWinnersBracketTab = ({ numberOfPlayers, players, matches, tournament, bracketLoading, onUpsertMatch, onDirty, onClean, visibleRounds = [1, 2] }: Props) => {
    const { tables } = useAllTables();
    // size tier: 16, 32, or 64
    const size: 16 | 32 | 64 = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
    const dirtyRef = useRef(false);
    const byeAutoSavedRef = useRef<Set<number>>(new Set());

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

    // Propagate winners R1 → R2
    useEffect(() => {
        if (round2.length !== round2Nos.length) return;
        const next = [...round2];
        let changed = false;
        for (let i = 0; i < round2Nos.length; i++) {
            const w1 = round1[i * 2]?.winner_id || '';
            const w2 = round1[i * 2 + 1]?.winner_id || '';
            if (next[i].player1_id !== w1) { next[i] = { ...next[i], player1_id: w1 }; changed = true; }
            if (next[i].player2_id !== w2) { next[i] = { ...next[i], player2_id: w2 }; changed = true; }
            const winner = resolveWinner(next[i], getRaceToNumber(next[i].player1_id, next[i].player2_id, players, tournament));
            if (next[i].winner_id !== winner) { next[i] = { ...next[i], winner_id: winner }; changed = true; }
        }
        if (changed) setRound2(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round1]);

    // Auto-complete BYE matches when all available players have been assigned
    // Also auto-saves to backend so Losers bracket can detect them.
    useEffect(() => {
        const totalR1Slots = round1.length * 2;
        if (players.length >= totalR1Slots) return;
        const assignedCount = round1.flatMap(m => [m.player1_id, m.player2_id]).filter(Boolean).length;
        if (assignedCount < players.length) return;
        let changed = false;
        const next = [...round1];
        for (let i = 0; i < next.length; i++) {
            const m = next[i];
            if (m.winner_id) continue;
            if (m.player1_id && !m.player2_id) {
                next[i] = { ...m, status: 'completed', winner_id: m.player1_id };
                changed = true;
            } else if (m.player2_id && !m.player1_id) {
                next[i] = { ...m, status: 'completed', winner_id: m.player2_id };
                changed = true;
            }
            // Auto-save BYE match to backend
            if (changed && next[i].winner_id && (!next[i].player1_id || !next[i].player2_id) && !byeAutoSavedRef.current.has(next[i].match_no)) {
                const byeMatch = next[i];
                byeAutoSavedRef.current.add(byeMatch.match_no);
                onUpsertMatch(byeMatch.match_no, {
                    bracket: 'winners',
                    round: 1,
                    player1_id: byeMatch.player1_id ? parseInt(byeMatch.player1_id, 10) : null,
                    player2_id: byeMatch.player2_id ? parseInt(byeMatch.player2_id, 10) : null,
                    player1_score: 0,
                    player2_score: 0,
                    table_no: null,
                    match_time: null,
                    status: 'completed',
                    winner_id: parseInt(byeMatch.winner_id, 10),
                }).catch(() => {
                    byeAutoSavedRef.current.delete(byeMatch.match_no);
                });
            }
        }
        if (changed) setRound1(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round1, players.length]);

    const onChange = (round: 1 | 2, idx: number, field: keyof MatchVM, value: string) => {
        dirtyRef.current = true;
        onDirty?.();
        handleMatchChange(round, idx, field, value, round1, round2, setRound1, setRound2, players, tournament);
    };

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
                                                    onChange={e => onChange(round, idx, 'player1_id', e.target.value)}
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
                                            return <><span style={scoreLeft}>{match.player1_score}</span><span className="mx-3">vs</span><span style={scoreRight}>{match.player2_score}</span></>;
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
                                                    onChange={e => onChange(round, idx, 'player2_id', e.target.value)}
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
    const r2Label = 'Vòng 2';

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
        </div>
    );
};

export default TournamentWinnersBracketTab;
