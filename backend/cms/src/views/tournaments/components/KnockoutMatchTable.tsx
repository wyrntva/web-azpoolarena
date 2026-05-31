import React, { useState, useRef, useCallback } from 'react';
import type { Tournament, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import { MatchVM } from './knockoutHelpers';
import MatchManagementDialog from './MatchManagementDialog';

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
    pending: { color: '#C6010B', label: 'Chưa diễn ra' },
    upcoming: { color: '#FAC600', label: 'Sắp diễn ra' },
    ongoing: { color: '#00B814', label: 'Đang diễn ra' },
    completed: { color: '#575E70', label: 'Đã kết thúc' },
};

interface KnockoutMatchTableProps {
    matches: MatchVM[];
    players: TournamentRegisteredPlayer[];
    title: string;
    matchRange: string;
    matchCount: number;
    isPlayerSelectable?: boolean;
    availablePlayers?: TournamentRegisteredPlayer[];
    selectedIds?: string[];
    selectDisabled?: boolean;
    player1Placeholder?: (idx: number) => string;
    player2Placeholder?: (idx: number) => string;
    onChange: (index: number, field: keyof MatchVM, value: string) => void;
    onSaveMatch?: (idx: number) => Promise<void>;
    showTableNo?: boolean;
    showMatchTime?: boolean;
    tablesList?: { id: number; name: string }[];
    tournament?: Tournament;
}

const KnockoutMatchTable: React.FC<KnockoutMatchTableProps> = ({
    matches, players, title, matchRange, matchCount,
    isPlayerSelectable = false, availablePlayers = [], selectedIds = [], selectDisabled = false,
    player1Placeholder = () => 'Chờ...', player2Placeholder = () => 'Chờ...',
    onChange, onSaveMatch,
    tablesList = [], tournament,
}) => {
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const dirtyRef = useRef(false);

    const getPlayerName = (id: string) => players.find(p => p.id === parseInt(id, 10))?.full_name;

    const currentMatch = editingIdx !== null ? matches[editingIdx] : null;

    const handleDialogClose = useCallback(async () => {
        if (editingIdx !== null && dirtyRef.current && onSaveMatch) {
            try { await onSaveMatch(editingIdx); }
            catch { /* lỗi đã được xử lý ở parent */ }
            dirtyRef.current = false;
        }
        setEditingIdx(null);
    }, [editingIdx, onSaveMatch]);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
                <h4 className="text-md font-bold text-gray-800 dark:text-white uppercase">
                    {title} ({matchRange})
                </h4>
                <span className="text-xs text-gray-400">({matchCount} trận đấu)</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm table-fixed">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                            <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '4%' }}>Trận</th>
                            <th className="p-3 text-left text-xs uppercase text-gray-500" style={{ width: '30%' }}>Người chơi 1</th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '14%' }}>Tỉ số</th>
                            <th className="p-3 text-left text-xs uppercase text-gray-500" style={{ width: '30%' }}>Người chơi 2</th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '8%' }}>Bàn</th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500" style={{ width: '14%' }}>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {matches.map((match, idx) => {
                            const badge = STATUS_BADGE[match.status] || STATUS_BADGE.pending;
                            const p1Name = getPlayerName(match.player1_id);
                            const p2Name = getPlayerName(match.player2_id);
                            const isBye = !!match.winner_id && (!match.player1_id || !match.player2_id);
                            const p1Absent = match.player1_check_in === 'absent';
                            const p2Absent = match.player2_check_in === 'absent';
                            const scoreLeft: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'right' };
                            const scoreRight: React.CSSProperties = { display: 'inline-block', minWidth: '2rem', textAlign: 'left' };
                            return (
                                <tr key={`match_${match.match_no}`} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer" onClick={() => setEditingIdx(idx)}>
                                    <td className="p-3 text-center font-bold text-gray-400">{match.match_no}</td>
                                    {/* Người chơi 1 */}
                                    <td className="p-3">
                                        {isPlayerSelectable && !match.winner_id ? (
                                            <div className="flex items-center gap-1">
                                                <select
                                                    className="match-table-player-select flex-1"
                                                    disabled={selectDisabled}
                                                    onClick={e => e.stopPropagation()}
                                                    value={match.player1_id}
                                                    onChange={e => onChange(idx, 'player1_id', e.target.value)}
                                                >
                                                    <option value="">Chọn người chơi</option>
                                                    {availablePlayers
                                                        .filter(p => !selectedIds.includes(String(p.id)) || match.player1_id === String(p.id))
                                                        .map(p => <option key={p.id} value={p.id}>{p.full_name}{p.rank ? ` (${p.rank})` : ''}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-800 dark:text-gray-200 truncate" style={match.winner_id === match.player1_id && match.winner_id ? { fontWeight: 700 } : undefined}>
                                                    {p1Name || (
                                                        match.winner_id && !match.player1_id
                                                            ? <span className="text-gray-400 italic font-semibold text-xs">bye</span>
                                                            : <span className="text-gray-400 italic text-xs">{player1Placeholder(idx)}</span>
                                                    )}
                                                </span>
                                                {p1Name && <span className="text-gray-400 text-xs ml-1">∨</span>}
                                            </div>
                                        )}
                                    </td>
                                    {/* Tỉ số */}
                                    <td className="p-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                        {isBye ? (
                                            <>
                                                <span style={{ ...scoreLeft, color: match.player1_id ? '#ED1C1F' : '#ACB3C3', fontWeight: 700 }}>{match.player1_id ? 'WO' : '-'}</span>
                                                <span className="mx-2 text-gray-400 text-xs">vs</span>
                                                <span style={{ ...scoreRight, color: match.player2_id ? '#ED1C1F' : '#ACB3C3', fontWeight: 700 }}>{match.player2_id ? 'WO' : '-'}</span>
                                            </>
                                        ) : (p1Absent || p2Absent) ? (
                                            <>
                                                <span style={{ ...scoreLeft, color: p1Absent ? '#ACB3C3' : '#ED1C1F', fontWeight: 700 }}>{p1Absent ? 'NS' : '-'}</span>
                                                <span className="mx-2 text-gray-400 text-xs">vs</span>
                                                <span style={{ ...scoreRight, color: p2Absent ? '#ACB3C3' : '#ED1C1F', fontWeight: 700 }}>{p2Absent ? 'NS' : '-'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span style={scoreLeft}>{match.player1_score}</span>
                                                <span className="mx-2 text-gray-400 text-xs">vs</span>
                                                <span style={scoreRight}>{match.player2_score}</span>
                                            </>
                                        )}
                                    </td>
                                    {/* Người chơi 2 */}
                                    <td className="p-3">
                                        {isPlayerSelectable && !match.winner_id ? (
                                            <div className="flex items-center gap-1">
                                                <select
                                                    className="match-table-player-select flex-1"
                                                    disabled={selectDisabled}
                                                    onClick={e => e.stopPropagation()}
                                                    value={match.player2_id}
                                                    onChange={e => onChange(idx, 'player2_id', e.target.value)}
                                                >
                                                    <option value="">Chọn người chơi</option>
                                                    {availablePlayers
                                                        .filter(p => !selectedIds.includes(String(p.id)) || match.player2_id === String(p.id))
                                                        .map(p => <option key={p.id} value={p.id}>{p.full_name}{p.rank ? ` (${p.rank})` : ''}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-800 dark:text-gray-200 truncate" style={match.winner_id === match.player2_id && match.winner_id ? { fontWeight: 700 } : undefined}>
                                                    {p2Name || (
                                                        match.winner_id && !match.player2_id
                                                            ? <span className="text-gray-400 italic font-semibold text-xs">bye</span>
                                                            : <span className="text-gray-400 italic text-xs">{player2Placeholder(idx)}</span>
                                                    )}
                                                </span>
                                                {p2Name && <span className="text-gray-400 text-xs ml-1">∨</span>}
                                            </div>
                                        )}
                                    </td>
                                    {/* Bàn */}
                                    <td className="p-3 text-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        {match.table_no || <span className="text-gray-300">—</span>}
                                    </td>
                                    {/* Trạng thái */}
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

            {tournament && (
                <MatchManagementDialog
                    isOpen={editingIdx !== null}
                    onClose={handleDialogClose}
                    match={currentMatch}
                    players={players}
                    tables={tablesList}
                    tournament={tournament}
                    onChange={(field, value) => {
                        if (editingIdx !== null) {
                            dirtyRef.current = true;
                            onChange(editingIdx, field, value);
                        }
                    }}
                    onSave={async () => {
                        if (editingIdx !== null && onSaveMatch) {
                            await onSaveMatch(editingIdx);
                            dirtyRef.current = false;
                        }
                    }}
                    isPlayerSelectable={isPlayerSelectable}
                    availablePlayers={availablePlayers}
                    selectedIds={selectedIds}
                />
            )}
        </div>
    );
};

export default KnockoutMatchTable;
