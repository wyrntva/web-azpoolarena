import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, Tabs, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { tournamentAPI, type Tournament, type TournamentMatch, type TournamentMatchUpsert, type TournamentRegisteredPlayer } from '../../api/tournament.api';
import toast from 'react-hot-toast';
import TournamentRegistrationsTab from './components/TournamentRegistrationsTab';
import TournamentQualificationTab from './components/TournamentQualificationTab';
import TournamentKnockoutTab from './components/TournamentKnockoutTab';
import { getTournamentTypeLabel } from '../../constants/shared';
import { useAllTables } from './hooks/useAllTables';

// When duplicates exist (same match_no), keep the best row:
// completed > others, winner set, both players present, higher total score, lower id
const dedupeMatches = (matches: TournamentMatch[]): TournamentMatch[] => {
    const map = new Map<number, TournamentMatch>();
    const statusRank = (s: string) => s === 'completed' ? 0 : s === 'ongoing' ? 1 : s === 'upcoming' ? 2 : 3;
    for (const m of matches) {
        const existing = map.get(m.match_no);
        if (!existing) { map.set(m.match_no, m); continue; }
        const score = (x: TournamentMatch) =>
            statusRank(x.status) * -100 +
            (x.winner_id ? 10 : 0) +
            (x.player1_id && x.player2_id ? 5 : 0) +
            (x.player1_score + x.player2_score);
        if (score(m) > score(existing)) map.set(m.match_no, m);
    }
    return Array.from(map.values()).sort((a, b) => a.match_no - b.match_no);
};

const TournamentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('registrations');

    const [bracketMatches, setBracketMatches] = useState<TournamentMatch[]>([]);
    const [bracketLoading, setBracketLoading] = useState(false);

    const [registeredPlayers, setRegisteredPlayers] = useState<TournamentRegisteredPlayer[]>([]);
    const [playersLoading, setPlayersLoading] = useState(false);

    // Dirty flag: when user has unsaved local changes, skip polling to prevent overwrite
    const dirtyRef = useRef(false);
    const markDirty = useCallback(() => { dirtyRef.current = true; }, []);
    const markClean = useCallback(() => { dirtyRef.current = false; }, []);

    // Enabled tables for auto-assign pool — null means all tables enabled.
    // Persisted per tournament in localStorage so it survives page refreshes.
    const [enabledTables, setEnabledTables] = useState<string[] | null>(() => {
        if (!id) return null;
        try {
            const raw = localStorage.getItem(`tournament-${id}-enabled-tables`);
            return raw ? JSON.parse(raw) as string[] : null;
        } catch { return null; }
    });

    const handleTablePoolChange = useCallback((names: string[]) => {
        setEnabledTables(names);
        try { localStorage.setItem(`tournament-${id}-enabled-tables`, JSON.stringify(names)); } catch { /* noop */ }
    }, [id]);

    const [priorityTables, setPriorityTables] = useState<string[]>(() => {
        if (!id) return [];
        try {
            const raw = localStorage.getItem(`tournament-${id}-priority-tables`);
            return raw ? JSON.parse(raw) as string[] : [];
        } catch { return []; }
    });

    const handlePriorityTablesChange = useCallback((names: string[]) => {
        setPriorityTables(names);
        try { localStorage.setItem(`tournament-${id}-priority-tables`, JSON.stringify(names)); } catch { /* noop */ }
    }, [id]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (id) {
            interval = setInterval(() => {
                // Only fetch bracket silently and update if activeTab is not registrations
                // (we don't need bracket refresh inside registrations tab)
                pollBracket(parseInt(id));
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [id, activeTab]);

    const pollBracket = async (tournamentId: number) => {
        if (dirtyRef.current) return; // Skip poll when user has unsaved changes
        try {
            const res = await tournamentAPI.getBracket(tournamentId);
            if (!dirtyRef.current) { // Double-check after async call
                setBracketMatches(Array.isArray(res.data) ? dedupeMatches(res.data) : []);
            }
        } catch {
            /* silent error on poll */
        }
    };

    useEffect(() => {
        if (id) {
            fetchTournament();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchTournament = async () => {
        try {
            setLoading(true);
            const response = await tournamentAPI.getTournament(parseInt(id!));
            setTournament(response.data);
            // Set default tab based on tournament type
            if (response.data.tournament_type === 'double_elimination') {
                setActiveTab('registrations');
            } else if (response.data.tournament_type === 'knockout') {
                setActiveTab('registrations');
            }

            await Promise.all([fetchRegisteredPlayers(response.data.id), fetchBracket(response.data.id)]);
        } catch (_error) {
            toast.error('Không thể tải thông tin giải đấu');
        } finally {
            setLoading(false);
        }
    };

    const fetchRegisteredPlayers = async (tournamentId: number) => {
        try {
            setPlayersLoading(true);
            const res = await tournamentAPI.getRegistrations(tournamentId);
            setRegisteredPlayers(Array.isArray(res.data) ? res.data : []);
        } catch (_error) {
            toast.error('Không thể tải danh sách đăng kí');
            setRegisteredPlayers([]);
        } finally {
            setPlayersLoading(false);
        }
    };

    const fetchBracket = async (tournamentId: number) => {
        try {
            setBracketLoading(true);
            const res = await tournamentAPI.getBracket(tournamentId);
            setBracketMatches(Array.isArray(res.data) ? dedupeMatches(res.data) : []);
        } catch (_error) {
            toast.error('Không thể tải bảng đấu');
            setBracketMatches([]);
        } finally {
            setBracketLoading(false);
        }
    };

    const upsertMatch = async (tournamentId: number, matchNo: number, data: TournamentMatchUpsert) => {
        const res = await tournamentAPI.upsertMatch(tournamentId, matchNo, data);
        const saved = res.data;
        setBracketMatches((prev) => {
            const idx = prev.findIndex((m) => m.match_no === saved.match_no);
            if (idx === -1) return [...prev, saved].sort((a, b) => a.match_no - b.match_no);
            const next = [...prev];
            next[idx] = saved;
            return next;
        });
        // Silently refetch all matches so backend-propagated changes (next-round player seeding)
        // are visible immediately instead of waiting for the next 5-second poll
        tournamentAPI.getBracket(tournamentId)
            .then(r => { if (Array.isArray(r.data) && !dirtyRef.current) setBracketMatches(dedupeMatches(r.data)); })
            .catch(() => {});
        return saved;
    };

    // --- Auto-complete matches when a player is marked "absent" ---
    // Track which match_nos have already been auto-completed to prevent duplicates
    const autoCompletedRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!tournament || bracketMatches.length === 0) return;

        const matchesToAutoComplete = bracketMatches.filter((m) => {
            // Skip if already completed or already auto-processed
            if (m.status === 'completed') return false;
            if (autoCompletedRef.current.has(m.match_no)) return false;

            // Only treat as absent if the player is actually assigned — prevents false WO
            // for slots still waiting on winner of a previous match (player_id is null)
            const p1Absent = m.player1_check_in === 'absent' && !!m.player1_id;
            const p2Absent = m.player2_check_in === 'absent' && !!m.player2_id;

            return p1Absent || p2Absent;
        });

        if (matchesToAutoComplete.length === 0) return;

        // Process each match
        matchesToAutoComplete.forEach((m) => {
            autoCompletedRef.current.add(m.match_no);

            const p1Absent = m.player1_check_in === 'absent' && !!m.player1_id;
            const p2Absent = m.player2_check_in === 'absent' && !!m.player2_id;

            let winnerId: number | null = null;
            if (p1Absent && !p2Absent && m.player2_id) {
                winnerId = m.player2_id;   // Player 1 vắng → Player 2 thắng
            } else if (p2Absent && !p1Absent && m.player1_id) {
                winnerId = m.player1_id;   // Player 2 vắng → Player 1 thắng
            }
            // Cả hai vắng → completed, no winner




            upsertMatch(tournament.id, m.match_no, {
                bracket: m.bracket,
                round: m.round,
                player1_id: m.player1_id,
                player2_id: m.player2_id,
                player1_score: m.player1_score,
                player2_score: m.player2_score,
                table_no: m.table_no,
                match_time: m.match_time,
                status: 'completed',
                player1_check_in: m.player1_check_in || 'unconfirmed',
                player2_check_in: m.player2_check_in || 'unconfirmed',
                winner_id: winnerId,
            }).then(() => {
                const absentName = p1Absent ? 'Player 1' : 'Player 2';
                toast.success(`Trận ${m.match_no}: ${absentName} vắng mặt → tự động kết thúc`);
            }).catch(() => {
                // Remove from set so it can retry on next poll
                autoCompletedRef.current.delete(m.match_no);
            });
        });
    }, [bracketMatches, tournament]);


    // --- Auto-assign free table when LR1 / WR2 / LR2 gets both players ---
    const { tables } = useAllTables();
    const autoTableAssignedRef = useRef<Set<number>>(new Set());
    // null = not yet initialized; initialized on first bracketMatches load
    const prevBothFilledRef = useRef<Set<number> | null>(null);

    useEffect(() => {
        if (!tournament || bracketMatches.length === 0 || tables.length === 0) return;

        const numPlayers = tournament.number_of_players;
        const size = numPlayers > 32 ? 64 : numPlayers > 16 ? 32 : 16;

        // Match number ranges for the 3 auto-assign rounds (LR1, WR2, LR2)
        const [rangeStart, rangeEnd] = size === 64 ? [33, 80] : size === 32 ? [17, 40] : [9, 20];
        const inRange = (no: number) => no >= rangeStart && no <= rangeEnd;

        // First run: mark existing both-filled matches as "already known" — don't auto-assign retroactively
        if (prevBothFilledRef.current === null) {
            prevBothFilledRef.current = new Set(
                bracketMatches
                    .filter(m => inRange(m.match_no) && m.player1_id && m.player2_id)
                    .map(m => m.match_no)
            );
            return;
        }

        // Tables busy with ongoing or upcoming matches
        const busyTables = new Set(
            bracketMatches
                .filter(m => (m.status === 'ongoing' || m.status === 'upcoming') && m.table_no)
                .map(m => m.table_no!)
        );
        // Respect the enabled-tables pool; null = all tables enabled
        const poolNames = enabledTables ?? tables.map(t => t.name);
        const available = poolNames.filter(n => !busyTables.has(n));
        // Put priority tables first if they're free
        const freeTables = priorityTables.length > 0
            ? [...available.filter(n => priorityTables.includes(n)), ...available.filter(n => !priorityTables.includes(n))]
            : available;
        let freeIdx = 0;

        // Sort ascending by match_no guarantees priority: LR1 → WR2 → LR2 (their ranges don't overlap)
        const sorted = [...bracketMatches].sort((a, b) => a.match_no - b.match_no);
        for (const match of sorted) {
            if (!inRange(match.match_no)) continue;
            if (!match.player1_id || !match.player2_id) continue;
            if (match.table_no) continue;
            if (match.status === 'completed') continue;
            if (autoTableAssignedRef.current.has(match.match_no)) continue;
            if (prevBothFilledRef.current.has(match.match_no)) continue;

            if (freeIdx >= freeTables.length) break;
            const tableNo = freeTables[freeIdx++];
            autoTableAssignedRef.current.add(match.match_no);

            const matchTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();
            upsertMatch(tournament.id, match.match_no, {
                bracket: match.bracket,
                round: match.round,
                player1_id: match.player1_id,
                player2_id: match.player2_id,
                player1_score: match.player1_score,
                player2_score: match.player2_score,
                table_no: tableNo,
                match_time: matchTime,
                status: 'upcoming',
                player1_check_in: match.player1_check_in || 'unconfirmed',
                player2_check_in: match.player2_check_in || 'unconfirmed',
                winner_id: match.winner_id,
            }).then(() => {
                toast.success(`Trận ${match.match_no}: tự động xếp ${tableNo}`);
            }).catch(() => {
                autoTableAssignedRef.current.delete(match.match_no);
            });
        }

        // Update snapshot for next comparison
        bracketMatches.forEach(m => {
            if (inRange(m.match_no) && m.player1_id && m.player2_id) {
                prevBothFilledRef.current!.add(m.match_no);
            }
        });
    }, [bracketMatches, tournament, tables, enabledTables]);

    // Auto-update match status được xử lý bởi backend cron job (TournamentSchedulerService)
    // chạy mỗi 30 giây. Frontend chỉ cần poll bracket để hiển thị trạng thái mới nhất.

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen">
                <Spinner size="xl" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-center py-8 text-gray-500">
                        Không tìm thấy giải đấu
                    </div>
                </Card>
            </div>
        );
    }

    const isDoubleElimination = tournament.tournament_type === 'double_elimination';
    const isKnockout = tournament.tournament_type === 'knockout';

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center">
                        <Button
                            color="gray"
                            size="sm"
                            onClick={() => navigate('/tournaments')}
                        >
                            <Icon icon="solar:arrow-left-outline" className="mr-2" />
                            Quay lại trang giải đấu
                        </Button>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {tournament.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {getTournamentTypeLabel(tournament.tournament_type || '')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Card>
                <Tabs aria-label="Tournament detail tabs" variant="underline">
                    {/* Danh sách đăng kí - Always shown */}
                    <Tabs.Item
                        active={activeTab === 'registrations'}
                        title="Danh sách đăng kí"
                        onClick={() => setActiveTab('registrations')}
                    >
                        <TournamentRegistrationsTab
                            tournamentId={tournament.id}
                            numberOfPlayers={tournament.number_of_players}
                            onBracketRefresh={() => {
                                fetchBracket(tournament.id);
                                fetchRegisteredPlayers(tournament.id);
                            }}
                        />
                    </Tabs.Item>

                    {/* Vòng loại - Only for double_elimination */}
                    {isDoubleElimination && (
                        <Tabs.Item
                            active={activeTab === 'qualification'}
                            title="Vòng loại"
                            onClick={() => setActiveTab('qualification')}
                        >
                            <TournamentQualificationTab
                                tournamentId={tournament.id}
                                numberOfPlayers={tournament.number_of_players}
                                players={registeredPlayers}
                                matches={bracketMatches}
                                tournament={tournament}
                                bracketLoading={bracketLoading || playersLoading}
                                onUpsertMatch={(matchNo, data) => upsertMatch(tournament.id, matchNo, data)}
                                onDirty={markDirty}
                                onClean={markClean}
                                enabledTables={enabledTables}
                                onTablePoolChange={handleTablePoolChange}
                                priorityTables={priorityTables}
                                onPriorityTablesChange={handlePriorityTablesChange}
                            />
                        </Tabs.Item>
                    )}

                    {/* Loại trực tiếp - For both types */}
                    {(isDoubleElimination || isKnockout) && (
                        <Tabs.Item
                            active={activeTab === 'knockout'}
                            title="Loại trực tiếp"
                            onClick={() => setActiveTab('knockout')}
                        >
                            <TournamentKnockoutTab
                                tournamentId={tournament.id}
                                numberOfPlayers={tournament.number_of_players}
                                players={registeredPlayers}
                                matches={bracketMatches}
                                tournament={tournament}
                                bracketLoading={bracketLoading || playersLoading}
                                onUpsertMatch={(matchNo, data) => upsertMatch(tournament.id, matchNo, data)}
                                onDirty={markDirty}
                                onClean={markClean}
                            />
                        </Tabs.Item>
                    )}
                </Tabs>
            </Card>
        </div>
    );
};

export default TournamentDetail;
