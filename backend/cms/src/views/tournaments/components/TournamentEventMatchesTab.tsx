import React, { useState, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import type {
    Tournament,
    TournamentMatch,
    TournamentMatchUpsert,
    TournamentRegisteredPlayer
} from '../../../api/tournament.api';
import { MatchVM, toVM } from './knockoutHelpers';
import MatchManagementDialog from './MatchManagementDialog';
import { useAllTables } from '../hooks/useAllTables';

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
    pending: { color: '#C6010B', label: 'Chưa diễn ra' },
    upcoming: { color: '#FAC600', label: 'Sắp diễn ra' },
    ongoing: { color: '#00B814', label: 'Đang diễn ra' },
    completed: { color: '#575E70', label: 'Đã kết thúc' },
};

interface TournamentEventMatchesTabProps {
    tournamentId: number;
    tournament: Tournament;
    matches: TournamentMatch[];
    players: TournamentRegisteredPlayer[];
    bracketLoading?: boolean;
    onUpsertMatch: (matchNo: number, data: TournamentMatchUpsert) => Promise<TournamentMatch>;
    onRefresh?: () => void;
}

const TournamentEventMatchesTab: React.FC<TournamentEventMatchesTabProps> = ({
    tournament,
    matches,
    players,
    onUpsertMatch,
}) => {
    const { tables } = useAllTables();
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const dirtyRef = useRef(false);

    // Event matches: sort ascending by match_no
    const eventMatches = useMemo(() => {
        return matches
            .filter((m) => m.bracket === 'event' || tournament.category === 'event')
            .sort((a, b) => a.match_no - b.match_no);
    }, [matches, tournament]);

    // Convert to MatchVM list for compatibility with MatchManagementDialog
    const [vmList, setVmList] = useState<MatchVM[]>([]);

    React.useEffect(() => {
        if (!dirtyRef.current) {
            setVmList(eventMatches.map(toVM));
        }
    }, [eventMatches]);

    const currentMatch = editingIdx !== null && vmList[editingIdx] ? vmList[editingIdx] : null;

    const getPlayerName = (playerId: string | number | null | undefined, matchPlayerObj?: any) => {
        if (matchPlayerObj?.full_name) return matchPlayerObj.full_name;
        if (!playerId) return '';
        const p = players.find((x) => String(x.id) === String(playerId));
        return p?.full_name || `Cơ thủ #${playerId}`;
    };

    const handleChange = (index: number, field: keyof MatchVM, value: string) => {
        setVmList((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleSaveMatch = async (idx: number) => {
        const vm = vmList[idx];
        if (!vm) return;
        const targetMatch = eventMatches[idx];
        await onUpsertMatch(vm.match_no, {
            bracket: targetMatch?.bracket || 'event',
            round: targetMatch?.round || 1,
            player1_id: vm.player1_id ? parseInt(vm.player1_id, 10) : null,
            player2_id: vm.player2_id ? parseInt(vm.player2_id, 10) : null,
            player1_score: parseInt(vm.player1_score, 10) || 0,
            player2_score: parseInt(vm.player2_score, 10) || 0,
            table_no: vm.table_no || null,
            match_time: vm.match_time || null,
            match_end_time: vm.match_end_time || null,
            status: vm.status,
            player1_check_in: vm.player1_check_in || 'confirmed',
            player2_check_in: vm.player2_check_in || 'confirmed',
            winner_id: vm.winner_id ? parseInt(vm.winner_id, 10) : null,
            player1_points: vm.player1_points !== undefined && vm.player1_points !== '' ? parseInt(vm.player1_points, 10) : null,
            player2_points: vm.player2_points !== undefined && vm.player2_points !== '' ? parseInt(vm.player2_points, 10) : null,
            race_to: targetMatch?.race_to || null,
            handicap_desc: targetMatch?.handicap_desc || null,
        });
    };

    const handleDialogClose = useCallback(async () => {
        if (editingIdx !== null && dirtyRef.current) {
            try {
                await handleSaveMatch(editingIdx);
            } catch {
                /* handled */
            }
            dirtyRef.current = false;
        }
        setEditingIdx(null);
    }, [editingIdx, vmList, eventMatches]);

    const scoreLeft: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'right' };
    const scoreRight: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'left' };

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
                <table className="min-w-full text-sm table-fixed">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '6%' }}>
                                Trận
                            </th>
                            <th className="p-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '30%' }}>
                                Người chơi 1
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '14%' }}>
                                Tỉ số
                            </th>
                            <th className="p-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '30%' }}>
                                Người chơi 2
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '8%' }}>
                                Bàn
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '12%' }}>
                                Trạng thái
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {eventMatches.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                    Chưa có trận đấu nào được tạo. Khi người chơi ghép trận tại Scoreboard, trận đấu sẽ tự động hiển thị tại đây.
                                </td>
                            </tr>
                        ) : (
                            eventMatches.map((match, idx) => {
                                const vm = vmList[idx] || toVM(match);
                                const badge = STATUS_BADGE[vm.status] || STATUS_BADGE.pending;
                                const p1Name = getPlayerName(vm.player1_id, match.player1);
                                const p2Name = getPlayerName(vm.player2_id, match.player2);
                                const isP1Winner = vm.winner_id && vm.winner_id === vm.player1_id;
                                const isP2Winner = vm.winner_id && vm.winner_id === vm.player2_id;

                                return (
                                    <tr
                                        key={`event_match_${match.match_no}_${match.id}`}
                                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                                        onClick={() => setEditingIdx(idx)}
                                    >
                                        {/* Trận */}
                                        <td className="p-3 text-center font-bold text-gray-400">
                                            {match.match_no}
                                        </td>

                                        {/* Người chơi 1 */}
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <span
                                                    className="text-gray-800 dark:text-gray-200 truncate"
                                                    style={isP1Winner ? { fontWeight: 700 } : undefined}
                                                >
                                                    {p1Name || <span className="text-gray-400 italic text-xs">Chưa có</span>}
                                                </span>
                                                {p1Name && <span className="text-gray-400 text-xs ml-1">∨</span>}
                                            </div>
                                        </td>

                                        {/* Tỉ số */}
                                        <td className="p-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                            <span style={scoreLeft}>{vm.player1_score}</span>
                                            <span className="mx-2 text-gray-400 text-xs">vs</span>
                                            <span style={scoreRight}>{vm.player2_score}</span>
                                        </td>

                                        {/* Người chơi 2 */}
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <span
                                                    className="text-gray-800 dark:text-gray-200 truncate"
                                                    style={isP2Winner ? { fontWeight: 700 } : undefined}
                                                >
                                                    {p2Name || <span className="text-gray-400 italic text-xs">Chưa có</span>}
                                                </span>
                                                {p2Name && <span className="text-gray-400 text-xs ml-1">∨</span>}
                                            </div>
                                        </td>

                                        {/* Bàn */}
                                        <td className="p-3 text-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            {vm.table_no || <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* Trạng thái */}
                                        <td className="p-3 text-center">
                                            <span className="inline-flex items-center gap-1.5 text-xs">
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: badge.color }}
                                                />
                                                {badge.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {tournament && (
                <MatchManagementDialog
                    isOpen={editingIdx !== null}
                    onClose={handleDialogClose}
                    match={currentMatch}
                    players={players}
                    tables={tables}
                    tournament={tournament}
                    matches={matches}
                    onChange={(field, value) => {
                        if (editingIdx !== null) {
                            dirtyRef.current = true;
                            handleChange(editingIdx, field, value);
                        }
                    }}
                    onSave={async () => {
                        if (editingIdx !== null) {
                            await handleSaveMatch(editingIdx);
                            dirtyRef.current = false;
                            flushSync(() => setEditingIdx(null));
                        }
                    }}
                    isPlayerSelectable={true}
                    availablePlayers={players}
                    selectedIds={[]}
                />
            )}
        </div>
    );
};

export default TournamentEventMatchesTab;
