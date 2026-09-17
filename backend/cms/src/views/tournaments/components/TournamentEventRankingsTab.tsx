import React, { useMemo } from 'react';
import type { Tournament, TournamentMatch, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import { formatLevel } from '../../../utils/formatters';

interface TournamentEventRankingsTabProps {
    tournamentId: number;
    tournament: Tournament;
    players: TournamentRegisteredPlayer[];
    matches: TournamentMatch[];
}

interface PlayerStanding {
    player: TournamentRegisteredPlayer;
    played: number;
    won: number;
    lost: number;
    winRate: number;
    points: number;
}

const TournamentEventRankingsTab: React.FC<TournamentEventRankingsTabProps> = ({
    tournament,
    players,
    matches,
}) => {
    const standings = useMemo<PlayerStanding[]>(() => {
        // Helper to determine win points based on match handicap configuration
        const getMatchWinPoints = (m: TournamentMatch): number => {
            const desc = (m.handicap_desc || '').toLowerCase();
            if (desc.includes('chấp 2') || desc.includes('13') || m.race_to === 13) {
                return parseInt(tournament.handicap_2_touch || '7', 10) || 7;
            }
            if (desc.includes('chấp 1')) {
                return parseInt(tournament.handicap_1_touch || '5', 10) || 5;
            }
            if (desc.includes('11') || m.race_to === 11) {
                return parseInt(tournament.draw_touch_11 || '7', 10) || 7;
            }
            return parseInt(tournament.draw_touch || '5', 10) || 5;
        };

        const getMatchLosePoints = (m: any): number => {
            const desc = (m.handicap_desc || '').toLowerCase();
            if (desc.includes('chấp 2') || desc.includes('13') || m.race_to === 13) {
                return 2;
            }
            if (desc.includes('11') || m.race_to === 11) {
                return 2;
            }
            // Đồng cơ chạm 9 hoặc Chạm 8 chấp 1
            return 1;
        };

        // Calculate stats from matches for each player
        const map = new Map<number, { played: number; won: number; lost: number; points: number }>();
        const seenPairs = new Set<string>();
        const bonusVal = parseInt(tournament.bonus || '0', 10) || 0;

        // Sort matches chronologically to track encounters in proper order
        const sortedMatches = [...matches].sort((a, b) => (a.match_no || 0) - (b.match_no || 0) || (a.id || 0) - (b.id || 0));

        for (const m of sortedMatches) {
            const p1Id = m.player1_id;
            const p2Id = m.player2_id;
            const winnerId = m.winner_id;

            if (p1Id) {
                if (!map.has(p1Id)) map.set(p1Id, { played: 0, won: 0, lost: 0, points: 0 });
                const stats = map.get(p1Id)!;
                if (m.status === 'completed' || m.status === 'ongoing') {
                    stats.played += 1;
                }
            }

            if (p2Id) {
                if (!map.has(p2Id)) map.set(p2Id, { played: 0, won: 0, lost: 0, points: 0 });
                const stats = map.get(p2Id)!;
                if (m.status === 'completed' || m.status === 'ongoing') {
                    stats.played += 1;
                }
            }

            if (m.status === 'completed') {
                let matchBonus = 0;
                if (p1Id && p2Id && bonusVal > 0) {
                    const pairKey = [Math.min(p1Id, p2Id), Math.max(p1Id, p2Id)].join('_');
                    if (!seenPairs.has(pairKey)) {
                        seenPairs.add(pairKey);
                        matchBonus = bonusVal;
                    }
                }

                const baseWinPts = getMatchWinPoints(m);
                const baseLosePts = getMatchLosePoints(m);

                if (p1Id && map.has(p1Id)) {
                    const stats = map.get(p1Id)!;
                    if (winnerId && winnerId === p1Id) {
                        stats.won += 1;
                        const pts = m.player1_points !== undefined && m.player1_points !== null
                            ? Number(m.player1_points)
                            : (baseWinPts + matchBonus);
                        stats.points += pts;
                    } else if (winnerId && winnerId !== p1Id) {
                        stats.lost += 1;
                        const pts = m.player1_points !== undefined && m.player1_points !== null
                            ? Number(m.player1_points)
                            : (baseLosePts + matchBonus);
                        stats.points += pts;
                    }
                }

                if (p2Id && map.has(p2Id)) {
                    const stats = map.get(p2Id)!;
                    if (winnerId && winnerId === p2Id) {
                        stats.won += 1;
                        const pts = m.player2_points !== undefined && m.player2_points !== null
                            ? Number(m.player2_points)
                            : (baseWinPts + matchBonus);
                        stats.points += pts;
                    } else if (winnerId && winnerId !== p2Id) {
                        stats.lost += 1;
                        const pts = m.player2_points !== undefined && m.player2_points !== null
                            ? Number(m.player2_points)
                            : (baseLosePts + matchBonus);
                        stats.points += pts;
                    }
                }
            }
        }

        const list: PlayerStanding[] = players.map((p) => {
            const stats = map.get(p.id) || { played: 0, won: 0, lost: 0, points: 0 };
            const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
            // For events, points are strictly tournament points earned from won matches (or fallback to registration points if set)
            const points = stats.points;
            return {
                player: p,
                played: stats.played,
                won: stats.won,
                lost: stats.lost,
                winRate,
                points,
            };
        });

        // Sort primarily by points DESC, then won DESC, then winRate DESC, then name
        return list.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.won !== a.won) return b.won - a.won;
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return a.player.full_name.localeCompare(b.player.full_name);
        });
    }, [players, matches, tournament]);

    const getRankBadge = (rankIdx: number) => {
        if (rankIdx === 1) {
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs shadow-sm">
                    🥇 1
                </span>
            );
        }
        if (rankIdx === 2) {
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs shadow-sm">
                    🥈 2
                </span>
            );
        }
        if (rankIdx === 3) {
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shadow-sm">
                    🥉 3
                </span>
            );
        }
        return (
            <span className="font-bold text-gray-400 text-xs">
                #{rankIdx}
            </span>
        );
    };

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
                <table className="min-w-full text-sm table-fixed">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '8%' }}>
                                Hạng
                            </th>
                            <th className="p-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '32%' }}>
                                Người chơi
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '12%' }}>
                                Level
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '10%' }}>
                                Số trận
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '10%' }}>
                                Thắng
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '10%' }}>
                                Thua
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '10%' }}>
                                Tỉ lệ thắng
                            </th>
                            <th className="p-3 text-center text-xs uppercase text-gray-500 dark:text-gray-400" style={{ width: '8%' }}>
                                Điểm
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {standings.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                                    Chưa có cơ thủ nào trong bảng xếp hạng.
                                </td>
                            </tr>
                        ) : (
                            standings.map((item, idx) => {
                                const rankNum = idx + 1;
                                return (
                                    <tr
                                        key={`standing_${item.player.id}`}
                                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                    >
                                        {/* Hạng */}
                                        <td className="p-3 text-center">
                                            {getRankBadge(rankNum)}
                                        </td>

                                        {/* Người chơi */}
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {item.player.full_name}
                                                </span>
                                                {item.player.phone_number && (
                                                    <span className="text-xs text-gray-400">
                                                        {item.player.phone_number}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Level */}
                                        <td className="p-3 text-center">
                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                {formatLevel(item.player.rank)}
                                            </span>
                                        </td>

                                        {/* Số trận */}
                                        <td className="p-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                            {item.played}
                                        </td>

                                        {/* Thắng */}
                                        <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                            {item.won}
                                        </td>

                                        {/* Thua */}
                                        <td className="p-3 text-center font-medium text-red-500 dark:text-red-400">
                                            {item.lost}
                                        </td>

                                        {/* Tỉ lệ thắng */}
                                        <td className="p-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                            {item.played > 0 ? `${item.winRate}%` : '—'}
                                        </td>

                                        {/* Điểm */}
                                        <td className="p-3 text-center font-bold text-gray-900 dark:text-white">
                                            {item.points}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TournamentEventRankingsTab;
