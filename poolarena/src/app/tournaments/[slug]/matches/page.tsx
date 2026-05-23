"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Spin } from "antd";
import {
    TournamentNavbar,
    ChampionshipBanner,
    RoundSection,
} from "@/components";
import NavBar from "@/components/NavBar";
import { tournamentAPI } from "@/api/tournament.api";

// ---------- Types ----------
interface ApiMatch {
    id: number;
    tournament_id: number;
    match_no: number;
    bracket: string;        // "winners" | "losers" | "knockout"
    round: number;
    player1_id: number | null;
    player1_name: string | null;
    player1_avatar: string | null;
    player1_rank: string | null;
    player2_id: number | null;
    player2_name: string | null;
    player2_avatar: string | null;
    player2_rank: string | null;
    player1_score: number;
    player2_score: number;
    table_no: string | null;
    match_time: string | null;
    status: string;         // "pending" | "upcoming" | "ongoing" | "completed"
    player1_check_in: string;
    player2_check_in: string;
    winner_id: number | null;
}

interface FormattedMatch {
    id: number;
    tableNumber: string | number;
    tableNumberColor: "default" | "green" | "yellow";
    player1: { name: string; avatar: string; isWinner?: boolean; isBye?: boolean };
    player2: { name: string; avatar: string; isWinner?: boolean; isBye?: boolean };
    score: string;
    meta: {
        matchNo?: string | number;
        race?: string;
        time?: string;
        date?: string;
    };
}

interface TournamentInfo {
    draw_touch?: string | null;
    handicap_1_touch?: string | null;
    handicap_2_touch?: string | null;
    number_of_players?: number | null;
    tournament_type?: string | null;
}

// Rank ordering for handicap calculation (lower index = lower rank)
const RANK_ORDER = ['K', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];

function getRankIndex(rank?: string | null): number {
    if (!rank) return -1;
    return RANK_ORDER.indexOf(rank.toUpperCase());
}

/**
 * Compute race-to text from player ranks and tournament settings.
 * E.g. "chạm 8 chấp 1", "chạm 7", etc.
 */
function computeRaceText(
    p1Rank: string | null,
    p2Rank: string | null,
    tournament: TournamentInfo | null,
): string {
    if (!tournament || !p1Rank || !p2Rank) return "";
    const r1 = getRankIndex(p1Rank);
    const r2 = getRankIndex(p2Rank);
    if (r1 < 0 || r2 < 0) return "";

    const diff = Math.abs(r1 - r2);
    let raceTo = 0;
    let handicap = 0;

    if (diff === 0) {
        raceTo = parseInt(tournament.draw_touch || '0', 10) || 0;
        handicap = 0;
    } else if (diff === 1) {
        raceTo = parseInt(tournament.handicap_1_touch || '0', 10) || 0;
        handicap = 1;
    } else {
        raceTo = parseInt(tournament.handicap_2_touch || '0', 10) || 0;
        handicap = 2;
    }

    if (!raceTo) return "";
    if (handicap === 0) return `chạm ${raceTo}`;
    return `chạm ${raceTo} chấp ${handicap}`;
}

interface RoundGroup {
    title: string;
    matches: FormattedMatch[];
}

// ---------- Helpers ----------

/**
 * Format avatar URL – prepend API_BASE if it's a relative path.
 */
function formatAvatarUrl(avatarUrl: string | null): string {
    if (!avatarUrl) return "";
    if (avatarUrl.startsWith("http")) return avatarUrl;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${API_BASE}${avatarUrl}`;
}

/**
 * Determine what colour the index box should be, based on match status.
 */
function getIndexColor(match: ApiMatch): "default" | "green" | "yellow" {
    if (match.status === "ongoing") return "green";
    if (match.status === "upcoming") return "yellow";
    return "default";
}

/**
 * Determine the display name for a player.
 *   – If the player has checked in as "absent" → "NS" (Not Show)
 *   – If no player assigned → placeholder
 *   – Otherwise → their real name
 */
function getPlayerName(
    playerId: number | null,
    playerName: string | null,
    checkIn: string,
    fallback: string,
): string {
    if (!playerId) return fallback;
    if (checkIn === "absent") return playerName || fallback;
    return playerName || fallback;
}

/**
 * Build the score display string from match data.
 */
function buildScoreString(match: ApiMatch): string {
    // Not started yet – no score (leave blank)
    if (match.status === "pending" || match.status === "upcoming") {
        if (!match.player1_id || !match.player2_id) {
            // One side is empty (BYE) – WO on the present player's side
            if (match.player1_id && !match.player2_id) return "WO vs -";
            if (!match.player1_id && match.player2_id) return "- vs WO";
            return " vs ";
        }
        return " vs ";
    }

    // Absent handling
    if (match.player1_check_in === "absent") return "NS vs -";
    if (match.player2_check_in === "absent") return "- vs NS";

    // Normal score
    return `${match.player1_score} vs ${match.player2_score}`;
}

/**
 * Format match time for display.
 */
function formatMatchTime(matchTime: string | null): { time: string; date: string } {
    if (!matchTime) return { time: "", date: "" };
    try {
        const dt = new Date(matchTime);
        const time = dt.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
        const date = dt.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
        });
        return { time, date };
    } catch {
        return { time: "", date: "" };
    }
}

/**
 * Convert a raw API match into a FormattedMatch for the UI.
 * p1Fallback / p2Fallback: text shown when a player slot is empty.
 */
function formatMatch(
    match: ApiMatch,
    tournament: TournamentInfo | null,
    p1Fallback: string = "Bye",
    p2Fallback: string = "Bye",
): FormattedMatch {
    const isCompleted = match.status === "completed";
    let p1Winner = isCompleted && match.winner_id === match.player1_id;
    let p2Winner = isCompleted && match.winner_id === match.player2_id;

    // WO (walkover): one player present, the other missing
    if (
        (match.status === "pending" || match.status === "upcoming") &&
        (!match.player1_id || !match.player2_id)
    ) {
        if (match.player1_id && !match.player2_id) p1Winner = true;
        if (!match.player1_id && match.player2_id) p2Winner = true;
    }

    // NS (Not Show / absent): the other player wins by default
    if (match.player1_check_in === "absent") p2Winner = true;
    if (match.player2_check_in === "absent") p1Winner = true;
    const { time, date } = formatMatchTime(match.match_time);

    // Build table number display from table_no (e.g. "Bàn 1" → "1", "Bàn 2" → "2")
    const tableNumber = match.table_no
        ? match.table_no.replace(/[^\d]/g, "") || match.table_no
        : "-";

    // Compute race info from player ranks + tournament settings
    const raceText = computeRaceText(
        match.player1_rank,
        match.player2_rank,
        tournament,
    );

    return {
        id: match.id,
        tableNumber: tableNumber,
        tableNumberColor: getIndexColor(match),
        player1: {
            name: getPlayerName(match.player1_id, match.player1_name, match.player1_check_in, p1Fallback),
            avatar: formatAvatarUrl(match.player1_avatar),
            isWinner: p1Winner,
            isBye: !match.player1_id,
        },
        player2: {
            name: getPlayerName(match.player2_id, match.player2_name, match.player2_check_in, p2Fallback),
            avatar: formatAvatarUrl(match.player2_avatar),
            isWinner: p2Winner,
            isBye: !match.player2_id,
        },
        score: buildScoreString(match),
        meta: {
            matchNo: match.match_no,
            race: raceText || undefined,
            time,
            date,
        },
    };
}

/**
 * Get the label for a round number within a bracket.
 */
function getRoundLabel(bracket: string, round: number, maxRound: number): string {
    if (bracket === "winners") {
        return `VÒNG ${round}: NHÁNH THẮNG`;
    }
    if (bracket === "losers") {
        return `VÒNG ${round}: NHÁNH THUA`;
    }
    // knockout
    if (round === maxRound) return "CHUNG KẾT";
    if (round === maxRound - 1) return "BÁN KẾT";
    if (round === maxRound - 2) return "TỨ KẾT";
    return `VÒNG ${round}`;
}

/**
 * Create a placeholder empty ApiMatch for a given match number.
 */
function createPlaceholderMatch(
    matchNo: number,
    bracket: string,
    round: number,
    tournamentId: number = 0,
): ApiMatch {
    return {
        id: -matchNo,
        tournament_id: tournamentId,
        match_no: matchNo,
        bracket,
        round,
        player1_id: null,
        player1_name: null,
        player1_avatar: null,
        player1_rank: null,
        player2_id: null,
        player2_name: null,
        player2_avatar: null,
        player2_rank: null,
        player1_score: 0,
        player2_score: 0,
        table_no: null,
        match_time: null,
        status: "pending",
        player1_check_in: "unconfirmed",
        player2_check_in: "unconfirmed",
        winner_id: null,
    };
}

/**
 * Generate the complete bracket match number layout based on the number of players.
 *
 * Match numbering scheme (matching admin):
 *
 * 16 players:
 *   WR1: 1–8    (8 matches)   LR1: 9–12  (4 matches)
 *   WR2: 13–16  (4 matches)   LR2: 17–20 (4 matches)
 *   KO:  21–27  (QF 21–24, SF 25–26, Final 27)
 *
 * 32 players:
 *   WR1: 1–16   (16 matches)  LR1: 17–24 (8 matches)
 *   WR2: 25–32  (8 matches)   LR2: 33–40 (8 matches)
 *   KO:  41–55  (R16: 41–48, QF: 49–52, SF: 53–54, Final: 55)
 *
 * 64 players:
 *   WR1: 1–32   (32 matches)  LR1: 33–48 (16 matches)
 *   WR2: 49–64  (16 matches)  LR2: 65–80 (16 matches)
 *   KO:  81–111 (R32: 81–96, R16: 97–104, QF: 105–108, SF: 109–110, Final: 111)
 */
function getBracketLayout(numberOfPlayers: number) {
    if (numberOfPlayers > 32) {
        // 64-player bracket
        return {
            wr1: { start: 1, count: 32 },
            lr1: { start: 33, count: 16 },
            wr2: { start: 49, count: 16 },
            lr2: { start: 65, count: 16 },
            knockout: [
                { start: 81, count: 16, round: 1 },  // R32
                { start: 97, count: 8, round: 2 },   // R16
                { start: 105, count: 4, round: 3 },  // QF
                { start: 109, count: 2, round: 4 },  // SF
                { start: 111, count: 1, round: 5 },  // Final
            ],
        };
    } else if (numberOfPlayers > 16) {
        // 32-player bracket
        return {
            wr1: { start: 1, count: 16 },
            lr1: { start: 17, count: 8 },
            wr2: { start: 25, count: 8 },
            lr2: { start: 33, count: 8 },
            knockout: [
                { start: 41, count: 8, round: 1 },  // R16
                { start: 49, count: 4, round: 2 },  // QF
                { start: 53, count: 2, round: 3 },  // SF
                { start: 55, count: 1, round: 4 },  // Final
            ],
        };
    } else {
        // 16-player bracket
        return {
            wr1: { start: 1, count: 8 },
            lr1: { start: 9, count: 4 },
            wr2: { start: 13, count: 4 },
            lr2: { start: 17, count: 4 },
            knockout: [
                { start: 21, count: 4, round: 1 },  // QF
                { start: 25, count: 2, round: 2 },  // SF
                { start: 27, count: 1, round: 3 },  // Final
            ],
        };
    }
}

/**
 * Ensure a complete array of matches for a given range.
 * Uses DB data if available, otherwise creates placeholder matches.
 */
function ensureMatchRange(
    matchByNo: Map<number, ApiMatch>,
    start: number,
    count: number,
    bracket: string,
    round: number,
): ApiMatch[] {
    const result: ApiMatch[] = [];
    for (let i = 0; i < count; i++) {
        const matchNo = start + i;
        result.push(matchByNo.get(matchNo) ?? createPlaceholderMatch(matchNo, bracket, round));
    }
    return result;
}

/**
 * Separate matches into group-stage rounds and knockout-stage rounds.
 *
 * Generates the complete bracket structure based on `number_of_players`,
 * filling in placeholder empty matches for rounds that the admin
 * hasn't yet created matches for.
 *
 * For round 1 of each bracket, empty player slots show "Bye".
 * For subsequent rounds, empty player slots show "Thắng trận X"  or "Thua trận X"
 * where X is the match_no of the source match from the previous round.
 */
function groupMatches(allMatches: ApiMatch[], tournament: TournamentInfo | null) {
    // Build a lookup map of all matches by match_no
    const matchByNo = new Map<number, ApiMatch>();
    for (const m of allMatches) {
        matchByNo.set(m.match_no, m);
    }

    // Determine bracket size from tournament info or DB data
    const numberOfPlayers = tournament?.number_of_players || 16;
    const isDoubleElimination = tournament?.tournament_type === "double_elimination";
    const layout = getBracketLayout(numberOfPlayers);

    const is64 = numberOfPlayers > 32;
    const is32 = numberOfPlayers > 16 && numberOfPlayers <= 32;

    /**
     * Compute source labels for losers bracket matches.
     * LR1: both players come from WR1 losers → "Thua trận X"
     * LR2: player1 = winner of LR1, player2 = loser of WR2
     */
    function getLosersSourceLabels(
        roundMatches: ApiMatch[],
        round: number,
    ): Map<number, [string, string]> {
        const labels = new Map<number, [string, string]>();
        const sorted = [...roundMatches].sort((a, b) => a.match_no - b.match_no);

        if (round === 1) {
            // LR1 players come from losers of WR1
            sorted.forEach((m, i) => {
                const wr1Match1 = 1 + i * 2;
                const wr1Match2 = 1 + i * 2 + 1;
                labels.set(m.match_no, [`Thua trận ${wr1Match1}`, `Thua trận ${wr1Match2}`]);
            });
        } else if (round === 2) {
            // LR2: p1 = winner of LR1, p2 = loser of WR2
            if (is64) {
                sorted.forEach((m, i) => {
                    labels.set(m.match_no, [
                        `Thắng trận ${layout.lr1.start + i}`,
                        `Thua trận ${layout.wr2.start + layout.wr2.count - 1 - i}`,
                    ]);
                });
            } else if (is32) {
                sorted.forEach((m, i) => {
                    labels.set(m.match_no, [
                        `Thắng trận ${layout.lr1.start + i}`,
                        `Thua trận ${layout.wr2.start + layout.wr2.count - 1 - i}`,
                    ]);
                });
            } else {
                // 16-player:
                // LR1 = [9..12], WR2 reversed = [16,15,14,13]
                sorted.forEach((m, i) => {
                    labels.set(m.match_no, [
                        `Thắng trận ${layout.lr1.start + i}`,
                        `Thua trận ${layout.wr2.start + layout.wr2.count - 1 - i}`,
                    ]);
                });
            }
        }
        return labels;
    }

    /**
     * Format matches for a winners bracket round.
     */
    function formatWinnersRound(
        roundMatches: ApiMatch[],
        isFirstRound: boolean,
        prevRoundMatches: ApiMatch[] | undefined,
    ): FormattedMatch[] {
        const sorted = [...roundMatches].sort((a, b) => a.match_no - b.match_no);
        const prevSorted = prevRoundMatches
            ? [...prevRoundMatches].sort((a, b) => a.match_no - b.match_no)
            : undefined;

        return sorted.map((match, index) => {
            let p1Fallback = "Bye";
            let p2Fallback = "Bye";

            if (!isFirstRound && prevSorted) {
                const srcP1 = prevSorted[2 * index];
                const srcP2 = prevSorted[2 * index + 1];
                if (srcP1) p1Fallback = `Thắng trận ${srcP1.match_no}`;
                if (srcP2) p2Fallback = `Thắng trận ${srcP2.match_no}`;
            }

            return formatMatch(match, tournament, p1Fallback, p2Fallback);
        });
    }

    /**
     * Format matches for a losers bracket round with correct source labels.
     */
    function formatLosersRound(
        roundMatches: ApiMatch[],
        round: number,
    ): FormattedMatch[] {
        const sorted = [...roundMatches].sort((a, b) => a.match_no - b.match_no);
        const sourceLabels = getLosersSourceLabels(roundMatches, round);

        return sorted.map((match) => {
            const labels = sourceLabels.get(match.match_no);
            const p1Fallback = labels?.[0] ?? "Chờ...";
            const p2Fallback = labels?.[1] ?? "Chờ...";
            return formatMatch(match, tournament, p1Fallback, p2Fallback);
        });
    }

    // --- Group stage (double elimination) ---
    const groupRounds: RoundGroup[] = [];

    if (isDoubleElimination) {
        // Generate complete bracket structure from layout
        const wr1Matches = ensureMatchRange(matchByNo, layout.wr1.start, layout.wr1.count, "winners", 1);
        const lr1Matches = ensureMatchRange(matchByNo, layout.lr1.start, layout.lr1.count, "losers", 1);
        const wr2Matches = ensureMatchRange(matchByNo, layout.wr2.start, layout.wr2.count, "winners", 2);
        const lr2Matches = ensureMatchRange(matchByNo, layout.lr2.start, layout.lr2.count, "losers", 2);

        // Interleave: W1, L1, W2, L2 (matching admin QualificationTab display order)
        groupRounds.push({
            title: "VÒNG 1: NHÁNH THẮNG",
            matches: formatWinnersRound(wr1Matches, true, undefined),
        });
        groupRounds.push({
            title: "VÒNG 1: NHÁNH THUA",
            matches: formatLosersRound(lr1Matches, 1),
        });
        groupRounds.push({
            title: "VÒNG 2: NHÁNH THẮNG",
            matches: formatWinnersRound(wr2Matches, false, wr1Matches),
        });
        groupRounds.push({
            title: "VÒNG 2: NHÁNH THUA",
            matches: formatLosersRound(lr2Matches, 2),
        });
    } else {
        // For non-double-elimination, fall back to dynamic grouping from DB data
        const grpMatches = allMatches.filter(
            (m) => m.bracket === "winners" || m.bracket === "losers",
        );
        const winnersMap = new Map<number, ApiMatch[]>();
        const losersMap = new Map<number, ApiMatch[]>();

        for (const m of grpMatches) {
            const map = m.bracket === "winners" ? winnersMap : losersMap;
            if (!map.has(m.round)) map.set(m.round, []);
            map.get(m.round)!.push(m);
        }

        const winnersRounds = Array.from(winnersMap.keys()).sort((a, b) => a - b);
        const losersRounds = Array.from(losersMap.keys()).sort((a, b) => a - b);
        const maxRoundNum = Math.max(
            winnersRounds.length > 0 ? winnersRounds[winnersRounds.length - 1] : 0,
            losersRounds.length > 0 ? losersRounds[losersRounds.length - 1] : 0,
        );

        for (let round = 1; round <= maxRoundNum; round++) {
            if (winnersMap.has(round)) {
                const roundIdx = winnersRounds.indexOf(round);
                const isFirstRound = roundIdx === 0;
                const prevMatches = roundIdx > 0 ? winnersMap.get(winnersRounds[roundIdx - 1]) : undefined;
                groupRounds.push({
                    title: `VÒNG ${round}: NHÁNH THẮNG`,
                    matches: formatWinnersRound(winnersMap.get(round)!, isFirstRound, prevMatches),
                });
            }
            if (losersMap.has(round)) {
                groupRounds.push({
                    title: `VÒNG ${round}: NHÁNH THUA`,
                    matches: formatLosersRound(losersMap.get(round)!, round),
                });
            }
        }
    }

    // --- Knockout stage ---
    const knockoutRounds: RoundGroup[] = [];

    if (isDoubleElimination && layout.knockout.length > 0) {
        // Generate complete knockout structure from layout
        let prevKoMatches: ApiMatch[] | undefined;
        for (let i = 0; i < layout.knockout.length; i++) {
            const ko = layout.knockout[i];
            const koMatches = ensureMatchRange(matchByNo, ko.start, ko.count, "knockout", ko.round);
            const maxKoRound = layout.knockout[layout.knockout.length - 1].round;
            knockoutRounds.push({
                title: getRoundLabel("knockout", ko.round, maxKoRound),
                matches: formatWinnersRound(koMatches, i === 0, prevKoMatches),
            });
            prevKoMatches = koMatches;
        }
    } else {
        // For non-double-elimination, fall back to dynamic grouping from DB data
        const knockoutMatches = allMatches.filter((m) => m.bracket === "knockout");
        const knockoutMap = new Map<number, ApiMatch[]>();
        for (const m of knockoutMatches) {
            if (!knockoutMap.has(m.round)) knockoutMap.set(m.round, []);
            knockoutMap.get(m.round)!.push(m);
        }

        const knockoutRoundsNums = Array.from(knockoutMap.keys()).sort((a, b) => a - b);
        const maxKoRound = knockoutRoundsNums.length > 0
            ? knockoutRoundsNums[knockoutRoundsNums.length - 1]
            : 0;

        for (let i = 0; i < knockoutRoundsNums.length; i++) {
            const round = knockoutRoundsNums[i];
            const isFirstRound = i === 0;
            const prevMatches = i > 0 ? knockoutMap.get(knockoutRoundsNums[i - 1]) : undefined;
            knockoutRounds.push({
                title: getRoundLabel("knockout", round, maxKoRound),
                matches: formatWinnersRound(knockoutMap.get(round)!, isFirstRound, prevMatches),
            });
        }
    }

    return { groupRounds, knockoutRounds };
}

// ---------- Component ----------

export default function TournamentMatchesPage() {
    const params = useParams();
    const slug = typeof params.slug === "string"
        ? params.slug
        : Array.isArray(params.slug)
            ? params.slug[0]
            : String(params.slug || "");

    const [activeStage, setActiveStage] = useState<"group" | "knockout">("group");
    const [loading, setLoading] = useState(true);
    const [groupRounds, setGroupRounds] = useState<RoundGroup[]>([]);
    const [knockoutRounds, setKnockoutRounds] = useState<RoundGroup[]>([]);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);

        // Fetch tournament info (for race settings) and matches in parallel
        Promise.all([
            tournamentAPI.getTournament(slug).catch(() => ({ data: null })),
            tournamentAPI.getTournamentMatchesBySlug(slug),
        ])
            .then(([tournamentRes, matchesRes]) => {
                const tournamentData: TournamentInfo | null = tournamentRes.data || null;
                const matches: ApiMatch[] = matchesRes.data || [];
                const { groupRounds: gr, knockoutRounds: kr } = groupMatches(matches, tournamentData);
                setGroupRounds(gr);
                setKnockoutRounds(kr);

                // Auto-select tab: if no group matches but has knockout, switch to knockout
                if (gr.length === 0 && kr.length > 0) {
                    setActiveStage("knockout");
                }
            })
            .catch((err) => {
                console.error("Failed to fetch matches:", err);
                setGroupRounds([]);
                setKnockoutRounds([]);
            })
            .finally(() => setLoading(false));
    }, [slug]);

    return (
        <div className="min-h-screen bg-[#e8e8e8] pb-24 font-sans">
            <NavBar />

            {/* Matches Header / Tabs */}
            <div className="w-full sticky top-[60px] z-[60] shadow-md">
                <div className="flex w-full h-[36px]">
                    <button
                        onClick={() => setActiveStage("group")}
                        className={`flex-1 h-full flex items-center justify-center uppercase tracking-wide transition-colors ${activeStage === "group" ? "bg-[#172339] text-white" : "bg-[#fafafa] text-[#172339] shadow-inner"}`}
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '16px',
                            fontStyle: 'italic',
                            fontWeight: 700,
                            lineHeight: '28px',
                        }}
                    >
                        Vòng bảng
                    </button>
                    <button
                        onClick={() => setActiveStage("knockout")}
                        className={`w-[960px] h-full flex items-center justify-center uppercase tracking-wide transition-colors ${activeStage === "knockout" ? "bg-[#172339] text-white" : "bg-[#fafafa] text-[#172339] shadow-inner"}`}
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '16px',
                            fontStyle: 'italic',
                            fontWeight: 700,
                            lineHeight: '28px',
                        }}
                    >
                        Vòng loại trực tiếp
                    </button>
                </div>
            </div>

            <main className="w-full max-w-[1360px] mx-auto mt-[48px] flex flex-col gap-[48px]">

                {/* Banner */}
                <div className="rounded-[12px] overflow-hidden shadow-sm h-[146px] relative">
                    <Image
                        src="/images/home_banner.png"
                        alt="Tournament Banner"
                        fill
                        sizes="1360px"
                        className="object-cover"
                    />
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <Spin size="large" />
                            <p className="mt-4 text-gray-600">Đang tải trận đấu...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Content Area */}
                        {activeStage === "group" ? (
                            <div className="flex flex-col gap-[48px]">
                                {groupRounds.length > 0 ? (
                                    groupRounds.map((round, i) => (
                                        <RoundSection
                                            key={`group-${i}`}
                                            title={round.title}
                                            matches={round.matches as any}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        Chưa có trận đấu vòng bảng
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-[48px]">
                                {knockoutRounds.length > 0 ? (
                                    knockoutRounds.map((round, i) => (
                                        <RoundSection
                                            key={`ko-${i}`}
                                            title={round.title}
                                            matches={round.matches as any}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        Chưa có trận đấu vòng loại trực tiếp
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

            </main>

            <TournamentNavbar activeTab="matches" />
        </div>
    );
}
