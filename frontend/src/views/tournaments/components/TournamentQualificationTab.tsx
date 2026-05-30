/**
 * Qualification Tab — combines Winners Bracket and Losers Bracket into a single "Vòng loại" tab.
 * Each section is rendered independently with its own save functionality.
 */
import { useState, useCallback } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import { getRaceToNumber } from '../utils/bracketUtils';
import { useAllTables } from '../hooks/useAllTables';
import TournamentWinnersBracketTab from './TournamentWinnersBracketTab';
import TournamentLosersBracketTab from './TournamentLosersBracketTab';

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
    // null = all tables enabled (default); string[] = only these tables available for auto-assign
    enabledTables?: string[] | null;
    onTablePoolChange?: (names: string[]) => void;
    priorityTables?: string[];
    onPriorityTablesChange?: (names: string[]) => void;
}

const mkRange = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

const getNextRoundNos = (size: 16 | 32 | 64) => {
    if (size === 64) return {
        lr1: mkRange(33, 48),
        wr2: mkRange(49, 64),
        lr2: mkRange(65, 80),
    };
    if (size === 32) return {
        lr1: mkRange(17, 24),
        wr2: mkRange(25, 32),
        lr2: mkRange(33, 40),
    };
    return {
        lr1: mkRange(9, 12),
        wr2: mkRange(13, 16),
        lr2: mkRange(17, 20),
    };
};

const TournamentQualificationTab = ({
    tournamentId,
    numberOfPlayers,
    players,
    matches,
    tournament,
    bracketLoading,
    onUpsertMatch,
    onDirty,
    onClean,
    enabledTables,
    onTablePoolChange,
    priorityTables,
    onPriorityTablesChange,
}: Props) => {
    const { tables } = useAllTables();
    const [scheduling, setScheduling] = useState(false);

    const autoSchedule = useCallback(async () => {
        if (scheduling) return;
        setScheduling(true);
        try {
            const size: 16 | 32 | 64 = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
            const { lr1, wr2, lr2 } = getNextRoundNos(size);

            const matchMap = new Map(matches.map(m => [m.match_no, m]));

            // --- Xác định trạng thái các bàn ---
            // soonFree: trận đang diễn ra, 1 trong 2 người đạt (raceTo - 1) điểm
            const occupiedTables = new Set<string>();
            const soonFreeTables = new Set<string>();

            for (const m of matches) {
                if (!m.table_no) continue;
                if (m.status === 'upcoming') {
                    occupiedTables.add(m.table_no);
                } else if (m.status === 'ongoing') {
                    occupiedTables.add(m.table_no);
                    if (m.player1_id && m.player2_id) {
                        const raceTo = getRaceToNumber(
                            String(m.player1_id), String(m.player2_id), players, tournament,
                        );
                        if (raceTo > 0 && (m.player1_score >= raceTo - 1 || m.player2_score >= raceTo - 1)) {
                            soonFreeTables.add(m.table_no);
                        }
                    }
                }
            }

            // Respect enabled-tables pool; null = all tables enabled
            const poolNames = enabledTables ?? tables.map(t => t.name);

            // Bàn trống hoàn toàn → ưu tiên trước; bàn sắp trống → xếp sau
            const freeTables: Array<{ name: string; soonFree: boolean }> = [];
            for (const name of poolNames) {
                if (!occupiedTables.has(name)) {
                    freeTables.push({ name, soonFree: false });
                } else if (soonFreeTables.has(name)) {
                    freeTables.push({ name, soonFree: true });
                }
            }
            // Sắp xếp: bàn trống hẳn lên trước
            freeTables.sort((a, b) => Number(a.soonFree) - Number(b.soonFree));

            if (freeTables.length === 0) {
                toast.error('Không có bàn nào trống để xếp lịch');
                return;
            }

            // Thứ tự ưu tiên: LR1 → WR2 → LR2
            const priorityNos = [...lr1, ...wr2, ...lr2];
            const toSchedule = priorityNos
                .map(no => matchMap.get(no))
                .filter((m): m is TournamentMatch =>
                    !!m &&
                    !m.table_no &&
                    m.status !== 'completed' &&
                    !!(m.player1_id || m.player2_id),
                );

            if (toSchedule.length === 0) {
                toast('Tất cả các trận đã có bàn hoặc chưa sẵn sàng', { icon: 'ℹ️' });
                return;
            }

            const now = new Date();
            let tableIdx = 0;
            let scheduled = 0;

            for (const m of toSchedule) {
                if (tableIdx >= freeTables.length) break;
                const { name: tableName, soonFree } = freeTables[tableIdx++];

                // Bàn sắp trống → đẩy giờ ra ~10 phút để chờ trận hiện tại kết thúc
                const matchTime = soonFree
                    ? new Date(now.getTime() + 10 * 60 * 1000).toISOString()
                    : now.toISOString();

                await onUpsertMatch(m.match_no, {
                    bracket: m.bracket,
                    round: m.round,
                    player1_id: m.player1_id,
                    player2_id: m.player2_id,
                    player1_score: m.player1_score,
                    player2_score: m.player2_score,
                    table_no: tableName,
                    match_time: matchTime,
                    status: m.status,
                    player1_check_in: m.player1_check_in || 'unconfirmed',
                    player2_check_in: m.player2_check_in || 'unconfirmed',
                    winner_id: m.winner_id,
                });
                scheduled++;
            }

            const soonFreeCount = freeTables.filter(t => t.soonFree).length;
            if (scheduled > 0) {
                const parts = [`Đã xếp bàn cho ${scheduled} trận`];
                if (soonFreeCount > 0) parts.push(`(${soonFreeCount} bàn sắp trống)`);
                toast.success(parts.join(' '));
            } else {
                toast('Không có trận nào cần xếp lịch', { icon: 'ℹ️' });
            }
        } catch {
            toast.error('Lỗi khi tự động xếp lịch');
        } finally {
            setScheduling(false);
        }
    }, [scheduling, numberOfPlayers, matches, players, tournament, tables, enabledTables, onUpsertMatch]);

    const commonProps = {
        tournamentId,
        numberOfPlayers,
        players,
        matches,
        tournament,
        bracketLoading,
        onUpsertMatch,
        onDirty,
        onClean,
    };

    return (
        <div className="space-y-12">
            {/* Auto-schedule action */}
            <div className="flex items-center justify-end">
                <Button
                    size="sm"
                    color="blue"
                    disabled={scheduling}
                    onClick={autoSchedule}
                >
                    {scheduling
                        ? <><Spinner size="sm" className="mr-2" />Đang xếp lịch...</>
                        : <><Icon icon="solar:sort-by-time-bold" className="mr-2 text-base" />Tự động xếp bàn & giờ (vòng tiếp theo)</>
                    }
                </Button>
            </div>

            {/* Vòng 1 (Winners) */}
            <TournamentWinnersBracketTab
                {...commonProps}
                visibleRounds={[1]}
                enabledTables={enabledTables}
                onTablePoolChange={onTablePoolChange}
                priorityTables={priorityTables}
                onPriorityTablesChange={onPriorityTablesChange}
            />

            {/* Vòng 1: Nhánh thua (Losers) */}
            <TournamentLosersBracketTab {...commonProps} visibleRounds={[1]} />

            {/* Vòng 2 nhánh thắng (Winners) */}
            <TournamentWinnersBracketTab {...commonProps} visibleRounds={[2]} />

            {/* Vòng 2: Nhánh thua (Losers) */}
            <TournamentLosersBracketTab {...commonProps} visibleRounds={[2]} />
        </div>
    );
};

export default TournamentQualificationTab;
