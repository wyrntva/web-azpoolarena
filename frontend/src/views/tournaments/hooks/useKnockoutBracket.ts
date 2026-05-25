import { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import { MatchVM, createEmptyMatch, toVM, resolveWinner, PlayerIdStr } from '../components/knockoutHelpers';
import { validateMatchTimes } from '../utils/bracketUtils';

interface UseKnockoutBracketProps {
    numberOfPlayers: number;
    players: TournamentRegisteredPlayer[];
    matches: TournamentMatch[];
    onUpsertMatch: (matchNo: number, data: TournamentMatchUpsert) => Promise<TournamentMatch>;
    tournament: Tournament;
    onDirty?: () => void;
    onClean?: () => void;
}

interface UseKnockoutBracketReturn {
    // State
    saving: boolean;
    // KO8 state (16 players)
    ko8Round1: MatchVM[];
    ko8Round2: MatchVM[];
    ko8Final: MatchVM[];
    qualified8Players: TournamentRegisteredPlayer[];
    qualified8Count: number;
    ko8SelectedIds: string[];
    // KO16 state (32 players)
    ko16R16: MatchVM[];
    ko16QF: MatchVM[];
    ko16SF: MatchVM[];
    ko16Final: MatchVM[];
    qualifiedPlayers: TournamentRegisteredPlayer[];
    qualified16Count: number;
    ko16SelectedIds: string[];
    // KO32 state (64 players)
    ko32R32: MatchVM[];
    ko32R16: MatchVM[];
    ko32QF: MatchVM[];
    ko32SF: MatchVM[];
    ko32Final: MatchVM[];
    qualified32Players: TournamentRegisteredPlayer[];
    qualified32Count: number;
    ko32SelectedIds: string[];
    // Handlers
    handleKO8Change: (round: 1 | 2 | 3, index: number, field: keyof MatchVM, value: string) => void;
    handleKO16Change: (round: 1 | 2 | 3 | 4, index: number, field: keyof MatchVM, value: string) => void;
    handleKO32Change: (round: 1 | 2 | 3 | 4 | 5, index: number, field: keyof MatchVM, value: string) => void;
    saveAll: () => Promise<void>;
    saveKO8Match: (round: 1 | 2 | 3, idx: number) => Promise<void>;
    saveKO16Match: (round: 1 | 2 | 3 | 4, idx: number) => Promise<void>;
    saveKO32Match: (round: 1 | 2 | 3 | 4 | 5, idx: number) => Promise<void>;
    // Helpers
    getPlayerName: (playerId: string) => string | undefined;
    isKO8Mode: boolean;
    isKO32Mode: boolean;
}

// Generate match numbers for a round
const generateMatchNos = (start: number, count: number): number[] =>
    Array.from({ length: count }, (_, i) => start + i);

export const useKnockoutBracket = ({
    numberOfPlayers,
    players,
    matches,
    onUpsertMatch,
    tournament,
    onDirty,
    onClean,
}: UseKnockoutBracketProps): UseKnockoutBracketReturn => {
    const [saving, setSaving] = useState(false);
    const isKO8Mode = numberOfPlayers <= 16;
    const isKO32Mode = numberOfPlayers > 32;

    // =====================
    // KO8 Configuration (16 players)
    // =====================
    const ko8Round1Nos = useMemo(() => generateMatchNos(21, 4), []);
    const ko8Round2Nos = useMemo(() => generateMatchNos(25, 2), []);
    const ko8FinalNos = useMemo(() => [27], []);

    const [ko8Round1, setKo8Round1] = useState<MatchVM[]>(() =>
        ko8Round1Nos.map((n) => toVM(createEmptyMatch(n, 'knockout', 1)))
    );
    const [ko8Round2, setKo8Round2] = useState<MatchVM[]>(() =>
        ko8Round2Nos.map((n) => toVM(createEmptyMatch(n, 'knockout', 2)))
    );
    const [ko8Final, setKo8Final] = useState<MatchVM[]>(() =>
        ko8FinalNos.map((n) => toVM(createEmptyMatch(n, 'knockout', 3)))
    );

    // =====================
    // KO16 Configuration (32 players)
    // =====================
    const ko16R16Nos = useMemo(() => generateMatchNos(41, 8), []);
    const ko16QFNos = useMemo(() => generateMatchNos(49, 4), []);
    const ko16SFNos = useMemo(() => generateMatchNos(53, 2), []);
    const ko16FinalNos = useMemo(() => [55], []);

    const [ko16R16, setKo16R16] = useState<MatchVM[]>(() =>
        ko16R16Nos.map((n) => toVM(createEmptyMatch(n, 'knockout', 1)))
    );
    const [ko16QF, setKo16QF] = useState<MatchVM[]>(() =>
        ko16QFNos.map((n) => toVM(createEmptyMatch(n, 'knockout', 2)))
    );
    const [ko16SF, setKo16SF] = useState<MatchVM[]>(() =>
        ko16SFNos.map((n) => toVM(createEmptyMatch(n, 'knockout', 3)))
    );
    const [ko16Final, setKo16Final] = useState<MatchVM[]>(() =>
        ko16FinalNos.map((n) => toVM(createEmptyMatch(n, 'knockout', 4)))
    );

    // =====================
    // KO32 Configuration (64 players)
    // Match 81–96: R32 (16 matches)
    // Match 97–104: R16 (8 matches)
    // Match 105–108: QF (4 matches)
    // Match 109–110: SF (2 matches)
    // Match 111: Final (1 match)
    // =====================
    const ko32R32Nos = useMemo(() => generateMatchNos(81, 16), []);
    const ko32R16Nos = useMemo(() => generateMatchNos(97, 8), []);
    const ko32QFNos = useMemo(() => generateMatchNos(105, 4), []);
    const ko32SFNos = useMemo(() => generateMatchNos(109, 2), []);
    const ko32FinalNos = useMemo(() => [111], []);

    const [ko32R32, setKo32R32] = useState<MatchVM[]>(() =>
        ko32R32Nos.map((n) => toVM(createEmptyMatch(n, 'knockout', 1)))
    );
    const [ko32R16, setKo32R16] = useState<MatchVM[]>(() =>
        ko32R16Nos.map((n) => toVM(createEmptyMatch(n, 'knockout', 2)))
    );
    const [ko32QF, setKo32QF] = useState<MatchVM[]>(() =>
        ko32QFNos.map((n) => toVM(createEmptyMatch(n, 'knockout', 3)))
    );
    const [ko32SF, setKo32SF] = useState<MatchVM[]>(() =>
        ko32SFNos.map((n) => toVM(createEmptyMatch(n, 'knockout', 4)))
    );
    const [ko32Final, setKo32Final] = useState<MatchVM[]>(() =>
        ko32FinalNos.map((n) => toVM(createEmptyMatch(n, 'knockout', 5)))
    );

    // Helper: get winner from match number
    const winnerOf = useCallback(
        (matchNo: number): PlayerIdStr => {
            const m = matches.find((x) => x.match_no === matchNo);
            return m?.winner_id ? String(m.winner_id) : '';
        },
        [matches]
    );

    // Helper: get player name
    const getPlayerName = useCallback(
        (playerId: string): string | undefined => {
            return players.find((p) => p.id === parseInt(playerId, 10))?.full_name;
        },
        [players]
    );

    // =====================
    // KO8 Qualified Players
    // =====================
    const qualified8Ids = useMemo(() => {
        if (!isKO8Mode) return [] as string[];
        const seedIds = [
            winnerOf(13), winnerOf(14), winnerOf(15), winnerOf(16),
            winnerOf(17), winnerOf(18), winnerOf(19), winnerOf(20),
        ].filter(Boolean) as string[];
        return Array.from(new Set(seedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matches, isKO8Mode, winnerOf]);

    const qualified8Players = useMemo(() => {
        const set = new Set(qualified8Ids.map((x) => parseInt(x, 10)));
        return players.filter((p) => set.has(p.id));
    }, [players, qualified8Ids]);

    const ko8SelectedIds = useMemo(() => {
        if (!isKO8Mode) return [];
        return ko8Round1.flatMap((m) => [m.player1_id, m.player2_id]).filter(Boolean);
    }, [ko8Round1, isKO8Mode]);

    // =====================
    // KO16 Qualified Players
    // =====================
    const qualified16Ids = useMemo(() => {
        if (isKO8Mode) return [] as string[];
        const ids: string[] = [];
        // Winners WR2 (25-32)
        for (let m = 25; m <= 32; m++) {
            const w = winnerOf(m);
            if (w) ids.push(w);
        }
        // Winners LR2 (33-40)
        for (let m = 33; m <= 40; m++) {
            const w = winnerOf(m);
            if (w) ids.push(w);
        }
        return Array.from(new Set(ids));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matches, isKO8Mode, winnerOf]);

    const qualifiedPlayers = useMemo(() => {
        const set = new Set(qualified16Ids.map((x) => parseInt(x, 10)));
        return players.filter((p) => set.has(p.id));
    }, [players, qualified16Ids]);

    const ko16SelectedIds = useMemo(() => {
        if (isKO8Mode || isKO32Mode) return [];
        return ko16R16.flatMap((m) => [m.player1_id, m.player2_id]).filter(Boolean);
    }, [ko16R16, isKO8Mode, isKO32Mode]);

    // =====================
    // KO32 Qualified Players (64 players)
    // =====================
    const qualified32Ids = useMemo(() => {
        if (!isKO32Mode) return [] as string[];
        const ids: string[] = [];
        // Winners WR2 (49-64)
        for (let m = 49; m <= 64; m++) {
            const w = winnerOf(m);
            if (w) ids.push(w);
        }
        // Winners LR2 (65-80)
        for (let m = 65; m <= 80; m++) {
            const w = winnerOf(m);
            if (w) ids.push(w);
        }
        return Array.from(new Set(ids));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matches, isKO32Mode, winnerOf]);

    const qualified32Players = useMemo(() => {
        const set = new Set(qualified32Ids.map((x) => parseInt(x, 10)));
        return players.filter((p) => set.has(p.id));
    }, [players, qualified32Ids]);

    const ko32SelectedIds = useMemo(() => {
        if (!isKO32Mode) return [];
        return ko32R32.flatMap((m) => [m.player1_id, m.player2_id]).filter(Boolean);
    }, [ko32R32, isKO32Mode]);

    // =====================
    // Sync from backend matches
    // =====================
    useEffect(() => {
        if (!isKO8Mode) return;
        const map = new Map(matches.map((m) => [m.match_no, m]));

        setKo8Round1((prev) =>
            ko8Round1Nos.map((no, idx) => {
                const stored = map.get(no);
                if (!stored) return prev[idx] ?? toVM(createEmptyMatch(no, 'knockout', 1));
                const vm = toVM(stored);
                return { ...prev[idx], ...vm };
            })
        );
        setKo8Round2(ko8Round2Nos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 2))));
        setKo8Final(ko8FinalNos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 3))));
    }, [matches, ko8Round1Nos, ko8Round2Nos, ko8FinalNos, isKO8Mode]);

    useEffect(() => {
        if (isKO8Mode || isKO32Mode) return;
        const map = new Map(matches.map((m) => [m.match_no, m]));
        setKo16R16(ko16R16Nos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 1))));
        setKo16QF(ko16QFNos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 2))));
        setKo16SF(ko16SFNos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 3))));
        setKo16Final(ko16FinalNos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 4))));
    }, [matches, ko16R16Nos, ko16QFNos, ko16SFNos, ko16FinalNos, isKO8Mode, isKO32Mode]);

    // KO32 sync
    useEffect(() => {
        if (!isKO32Mode) return;
        const map = new Map(matches.map((m) => [m.match_no, m]));

        setKo32R32((prev) =>
            ko32R32Nos.map((no, idx) => {
                const stored = map.get(no);
                if (!stored) return prev[idx] ?? toVM(createEmptyMatch(no, 'knockout', 1));
                const vm = toVM(stored);
                return { ...prev[idx], ...vm };
            })
        );
        setKo32R16(ko32R16Nos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 2))));
        setKo32QF(ko32QFNos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 3))));
        setKo32SF(ko32SFNos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 4))));
        setKo32Final(ko32FinalNos.map((no) => toVM(map.get(no) ?? createEmptyMatch(no, 'knockout', 5))));
    }, [matches, ko32R32Nos, ko32R16Nos, ko32QFNos, ko32SFNos, ko32FinalNos, isKO32Mode]);

    // =====================
    // Propagate winners to next rounds
    // =====================
    const propagateWinners = useCallback(
        (
            sourceRound: MatchVM[],
            targetRound: MatchVM[],
            setter: React.Dispatch<React.SetStateAction<MatchVM[]>>,
            pairsPerMatch: number = 2
        ) => {
            if (targetRound.length === 0) return;
            const next = [...targetRound];
            let changed = false;

            for (let i = 0; i < next.length; i++) {
                const w1 = sourceRound[i * pairsPerMatch]?.winner_id || '';
                const w2 = sourceRound[i * pairsPerMatch + 1]?.winner_id || '';

                if (next[i].player1_id !== w1) {
                    next[i] = { ...next[i], player1_id: w1 };
                    changed = true;
                }
                if (next[i].player2_id !== w2) {
                    next[i] = { ...next[i], player2_id: w2 };
                    changed = true;
                }

                const w = resolveWinner(next[i], parseInt(next[i].race_to, 10) || 0);
                if (next[i].winner_id !== w) {
                    next[i] = { ...next[i], winner_id: w };
                    changed = true;
                }
            }

            if (changed) setter(next);
        },
        []
    );

    // KO8 propagation
    useEffect(() => {
        if (!isKO8Mode || ko8Round2.length !== 2) return;
        propagateWinners(ko8Round1, ko8Round2, setKo8Round2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko8Round1, isKO8Mode, propagateWinners]);

    useEffect(() => {
        if (!isKO8Mode || ko8Final.length !== 1) return;
        propagateWinners(ko8Round2, ko8Final, setKo8Final);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko8Round2, isKO8Mode, propagateWinners]);

    // KO16 propagation
    useEffect(() => {
        if (isKO8Mode || isKO32Mode || ko16QF.length !== 4) return;
        propagateWinners(ko16R16, ko16QF, setKo16QF);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko16R16, isKO8Mode, isKO32Mode, propagateWinners]);

    useEffect(() => {
        if (isKO8Mode || isKO32Mode || ko16SF.length !== 2) return;
        propagateWinners(ko16QF, ko16SF, setKo16SF);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko16QF, isKO8Mode, isKO32Mode, propagateWinners]);

    useEffect(() => {
        if (isKO8Mode || isKO32Mode || ko16Final.length !== 1) return;
        propagateWinners(ko16SF, ko16Final, setKo16Final);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko16SF, isKO8Mode, isKO32Mode, propagateWinners]);

    // KO32 propagation
    useEffect(() => {
        if (!isKO32Mode || ko32R16.length !== 8) return;
        propagateWinners(ko32R32, ko32R16, setKo32R16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko32R32, isKO32Mode, propagateWinners]);

    useEffect(() => {
        if (!isKO32Mode || ko32QF.length !== 4) return;
        propagateWinners(ko32R16, ko32QF, setKo32QF);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko32R16, isKO32Mode, propagateWinners]);

    useEffect(() => {
        if (!isKO32Mode || ko32SF.length !== 2) return;
        propagateWinners(ko32QF, ko32SF, setKo32SF);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko32QF, isKO32Mode, propagateWinners]);

    useEffect(() => {
        if (!isKO32Mode || ko32Final.length !== 1) return;
        propagateWinners(ko32SF, ko32Final, setKo32Final);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ko32SF, isKO32Mode, propagateWinners]);

    // =====================
    // Handlers
    // =====================
    const handleKO8Change = useCallback(
        (round: 1 | 2 | 3, index: number, field: keyof MatchVM, value: string) => {
            onDirty?.();
            const [arr, setter] =
                round === 1
                    ? [ko8Round1, setKo8Round1]
                    : round === 2
                        ? [ko8Round2, setKo8Round2]
                        : [ko8Final, setKo8Final];

            const next = [...arr];
            const m = { ...next[index], [field]: value } as MatchVM;

            if (['player1_score', 'player2_score', 'status'].includes(field)) {
                m.winner_id = resolveWinner(m, parseInt(m.race_to, 10) || 0);
            }

            next[index] = m;
            setter(next);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ko8Round1, ko8Round2, ko8Final]
    );

    const handleKO16Change = useCallback(
        (round: 1 | 2 | 3 | 4, index: number, field: keyof MatchVM, value: string) => {
            onDirty?.();
            const [arr, setter] =
                round === 1
                    ? [ko16R16, setKo16R16]
                    : round === 2
                        ? [ko16QF, setKo16QF]
                        : round === 3
                            ? [ko16SF, setKo16SF]
                            : [ko16Final, setKo16Final];

            // Only R16 allows manual player selection
            if (round !== 1 && ['player1_id', 'player2_id'].includes(field)) {
                return;
            }

            const next = [...arr];
            const m = { ...next[index], [field]: value } as MatchVM;

            if (['player1_score', 'player2_score', 'status'].includes(field)) {
                m.winner_id = resolveWinner(m, parseInt(m.race_to, 10) || 0);
            }

            next[index] = m;
            setter(next);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ko16R16, ko16QF, ko16SF, ko16Final]
    );

    const handleKO32Change = useCallback(
        (round: 1 | 2 | 3 | 4 | 5, index: number, field: keyof MatchVM, value: string) => {
            onDirty?.();
            const [arr, setter] =
                round === 1
                    ? [ko32R32, setKo32R32]
                    : round === 2
                        ? [ko32R16, setKo32R16]
                        : round === 3
                            ? [ko32QF, setKo32QF]
                            : round === 4
                                ? [ko32SF, setKo32SF]
                                : [ko32Final, setKo32Final];

            // Only R32 allows manual player selection
            if (round !== 1 && ['player1_id', 'player2_id'].includes(field)) {
                return;
            }

            const next = [...arr];
            const m = { ...next[index], [field]: value } as MatchVM;

            if (['player1_score', 'player2_score', 'status'].includes(field)) {
                m.winner_id = resolveWinner(m, parseInt(m.race_to, 10) || 0);
            }

            next[index] = m;
            setter(next);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ko32R32, ko32R16, ko32QF, ko32SF, ko32Final]
    );

    // =====================
    // Save All
    // =====================
    const buildPayload = (m: MatchVM, round: number): { matchNo: number; data: TournamentMatchUpsert } => ({
        matchNo: m.match_no,
        data: {
            bracket: 'knockout',
            round,
            player1_id: m.player1_id ? parseInt(m.player1_id, 10) : null,
            player2_id: m.player2_id ? parseInt(m.player2_id, 10) : null,
            player1_score: parseInt(m.player1_score, 10) || 0,
            player2_score: parseInt(m.player2_score, 10) || 0,
            table_no: m.table_no || null,
            match_time: m.match_time || null,
            status: m.status,
            winner_id: m.winner_id ? parseInt(m.winner_id, 10) : null,
        },
    });

    const saveAll = useCallback(async () => {
        setSaving(true);
        try {
            const payloads: Array<{ matchNo: number; data: TournamentMatchUpsert }> = [];

            if (isKO8Mode) {
                const errorMsg = validateMatchTimes([...ko8Round1, ...ko8Round2, ...ko8Final], tournament.start_date);
                if (errorMsg) {
                    toast.error(errorMsg);
                    setSaving(false);
                    return;
                }

                ko8Round1.forEach((m) => payloads.push(buildPayload(m, 1)));
                ko8Round2.forEach((m) => payloads.push(buildPayload(m, 2)));
                ko8Final.forEach((m) => payloads.push(buildPayload(m, 3)));
            } else if (isKO32Mode) {
                const errorMsg = validateMatchTimes([...ko32R32, ...ko32R16, ...ko32QF, ...ko32SF, ...ko32Final], tournament.start_date);
                if (errorMsg) {
                    toast.error(errorMsg);
                    setSaving(false);
                    return;
                }

                ko32R32.forEach((m) => payloads.push(buildPayload(m, 1)));
                ko32R16.forEach((m) => payloads.push(buildPayload(m, 2)));
                ko32QF.forEach((m) => payloads.push(buildPayload(m, 3)));
                ko32SF.forEach((m) => payloads.push(buildPayload(m, 4)));
                ko32Final.forEach((m) => payloads.push(buildPayload(m, 5)));
            } else {
                const errorMsg = validateMatchTimes([...ko16R16, ...ko16QF, ...ko16SF, ...ko16Final], tournament.start_date);
                if (errorMsg) {
                    toast.error(errorMsg);
                    setSaving(false);
                    return;
                }

                ko16R16.forEach((m) => payloads.push(buildPayload(m, 1)));
                ko16QF.forEach((m) => payloads.push(buildPayload(m, 2)));
                ko16SF.forEach((m) => payloads.push(buildPayload(m, 3)));
                ko16Final.forEach((m) => payloads.push(buildPayload(m, 4)));
            }

            for (const p of payloads) {
                await onUpsertMatch(p.matchNo, p.data);
            }

            toast.success('Đã lưu bảng loại trực tiếp');
            onClean?.();
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Lỗi khi lưu dữ liệu');
        } finally {
            setSaving(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isKO8Mode, isKO32Mode, ko8Round1, ko8Round2, ko8Final, ko16R16, ko16QF, ko16SF, ko16Final, ko32R32, ko32R16, ko32QF, ko32SF, ko32Final, onUpsertMatch]);

    // Per-match save for KO8
    const saveKO8Match = useCallback(async (round: 1 | 2 | 3, idx: number) => {
        const arr = round === 1 ? ko8Round1 : round === 2 ? ko8Round2 : ko8Final;
        const m = arr[idx];
        if (!m) return;
        const errorMsg = validateMatchTimes([m], tournament.start_date);
        if (errorMsg) { toast.error(errorMsg); throw new Error(errorMsg); }
        const p = buildPayload(m, round);
        await onUpsertMatch(p.matchNo, p.data);
        toast.success(`Đã lưu trận ${m.match_no}`);
        onClean?.();
    }, [ko8Round1, ko8Round2, ko8Final, onUpsertMatch, tournament.start_date, onClean]);

    // Per-match save for KO16
    const saveKO16Match = useCallback(async (round: 1 | 2 | 3 | 4, idx: number) => {
        const arr = round === 1 ? ko16R16 : round === 2 ? ko16QF : round === 3 ? ko16SF : ko16Final;
        const m = arr[idx];
        if (!m) return;
        const errorMsg = validateMatchTimes([m], tournament.start_date);
        if (errorMsg) { toast.error(errorMsg); throw new Error(errorMsg); }
        const p = buildPayload(m, round);
        await onUpsertMatch(p.matchNo, p.data);
        toast.success(`Đã lưu trận ${m.match_no}`);
        onClean?.();
    }, [ko16R16, ko16QF, ko16SF, ko16Final, onUpsertMatch, tournament.start_date, onClean]);

    // Per-match save for KO32
    const saveKO32Match = useCallback(async (round: 1 | 2 | 3 | 4 | 5, idx: number) => {
        const arr = round === 1 ? ko32R32 : round === 2 ? ko32R16 : round === 3 ? ko32QF : round === 4 ? ko32SF : ko32Final;
        const m = arr[idx];
        if (!m) return;
        const errorMsg = validateMatchTimes([m], tournament.start_date);
        if (errorMsg) { toast.error(errorMsg); throw new Error(errorMsg); }
        const p = buildPayload(m, round);
        await onUpsertMatch(p.matchNo, p.data);
        toast.success(`Đã lưu trận ${m.match_no}`);
        onClean?.();
    }, [ko32R32, ko32R16, ko32QF, ko32SF, ko32Final, onUpsertMatch, tournament.start_date, onClean]);

    return {
        saving,
        // KO8
        ko8Round1,
        ko8Round2,
        ko8Final,
        qualified8Players,
        qualified8Count: qualified8Ids.length,
        ko8SelectedIds,
        // KO16
        ko16R16,
        ko16QF,
        ko16SF,
        ko16Final,
        qualifiedPlayers,
        qualified16Count: qualified16Ids.length,
        ko16SelectedIds,
        // KO32
        ko32R32,
        ko32R16,
        ko32QF,
        ko32SF,
        ko32Final,
        qualified32Players,
        qualified32Count: qualified32Ids.length,
        ko32SelectedIds,
        // Handlers
        handleKO8Change,
        handleKO16Change,
        handleKO32Change,
        saveAll,
        saveKO8Match,
        saveKO16Match,
        saveKO32Match,
        // Helpers
        getPlayerName,
        isKO8Mode,
        isKO32Mode,
    };
};
