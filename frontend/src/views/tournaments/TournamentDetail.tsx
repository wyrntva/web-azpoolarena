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
                setBracketMatches(Array.isArray(res.data) ? res.data : []);
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
            setBracketMatches(Array.isArray(res.data) ? res.data : []);
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
            .then(r => { if (Array.isArray(r.data) && !dirtyRef.current) setBracketMatches(r.data); })
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

            const p1Absent = m.player1_check_in === 'absent';
            const p2Absent = m.player2_check_in === 'absent';

            // At least one player must be absent
            return (p1Absent || p2Absent) && (m.player1_id || m.player2_id);
        });

        if (matchesToAutoComplete.length === 0) return;

        // Process each match
        matchesToAutoComplete.forEach((m) => {
            autoCompletedRef.current.add(m.match_no);

            const p1Absent = m.player1_check_in === 'absent';
            const p2Absent = m.player2_check_in === 'absent';

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
