"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin } from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores/store";
import {
    TournamentNavbar,
    ChampionshipBanner,
    RoundSection,
} from "@/components";
import NavBar from "@/components/NavBar";
import { tournamentAPI } from "@/api/tournament.api";

// ---------- Types ----------
interface ApiPlayerNested {
    id: number;
    full_name: string | null;
    avatar_url: string | null;
    rank: string | null;
}

interface ApiMatch {
    id: number;
    tournament_id: number;
    match_no: number;
    bracket: string;        // "winners" | "losers" | "knockout"
    round: number;
    // Flat fields (legacy / placeholder matches)
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
    // Nested objects returned by the backend API
    player1?: ApiPlayerNested | null;
    player2?: ApiPlayerNested | null;
    winner?: ApiPlayerNested | null;
}

interface FormattedMatch {
    id: number;
    tableNumber: string | number;
    tableNumberColor: "default" | "green" | "yellow";
    player1: { name: string; avatar: string; rank?: string | null; isWinner?: boolean; isBye?: boolean };
    player2: { name: string; avatar: string; rank?: string | null; isWinner?: boolean; isBye?: boolean };
    score: string;
    meta: {
        matchNo?: string | number;
        race?: string;
        time?: string;
        date?: string;
    };
}

interface TournamentInfo {
    id?: number | null;
    draw_touch?: string | null;
    handicap_1_touch?: string | null;
    handicap_2_touch?: string | null;
    semi_final?: string | null;
    final?: string | null;
    quarter_final?: string | null;
    number_of_players?: number | null;
    tournament_type?: string | null;
    registration_end_date?: string | null;
    registration_count?: number | null;
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
    koRoundInfo?: { round: number; maxKoRound: number },
): string {
    if (!tournament) return "";

    // Knockout round override: use final/semi_final/quarter_final regardless of rank diff
    if (koRoundInfo && koRoundInfo.maxKoRound > 0) {
        const roundsFromEnd = koRoundInfo.maxKoRound - koRoundInfo.round;
        let koRaceTo: number | null = null;
        if (roundsFromEnd === 0 && tournament.final) koRaceTo = parseInt(tournament.final, 10);
        else if (roundsFromEnd === 1 && tournament.semi_final) koRaceTo = parseInt(tournament.semi_final, 10);
        else if (roundsFromEnd === 2 && tournament.quarter_final) koRaceTo = parseInt(tournament.quarter_final, 10);
        if (koRaceTo) return `chạm ${koRaceTo}`;
    }

    if (!p1Rank || !p2Rank) return "";
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
 * When both scores are 0 and a handicap applies, shows the head-start score
 * so the display matches the device's initial state before the first ball is potted.
 */
function buildScoreString(match: ApiMatch, p1Rank?: string | null, p2Rank?: string | null): string {
    // Resolve player IDs from nested objects or flat fields
    const p1Id = (match.player1 && match.player1.id) || match.player1_id;
    const p2Id = (match.player2 && match.player2.id) || match.player2_id;

    // Not started yet – no score (leave blank)
    if (match.status === "pending") {
        return " vs ";
    }

    // Absent handling
    if (match.player1_check_in === "absent") return "NS vs -";
    if (match.player2_check_in === "absent") return "- vs NS";

    // BYE / Walkover handling:
    // If it's completed and one of the players is a BYE (missing ID)
    if (match.status === "completed") {
        const winnerId = match.winner_id ?? match.winner?.id ?? null;
        if (!p1Id || !p2Id) {
            if (p1Id && winnerId === p1Id) return "WO vs -";
            if (p2Id && winnerId === p2Id) return "- vs WO";
            return " - vs - ";
        }
    }

    let s1 = match.player1_score;
    let s2 = match.player2_score;

    // When both scores are 0 and the match is in progress, apply handicap head start.
    // The device initialises the scoreboard with the handicap locally but only pushes
    // an update to the backend when the first ball is actually potted.
    if (s1 === 0 && s2 === 0 && (match.status === "upcoming" || match.status === "ongoing") && p1Rank && p2Rank) {
        const r1 = getRankIndex(p1Rank);
        const r2 = getRankIndex(p2Rank);
        if (r1 >= 0 && r2 >= 0 && r1 !== r2) {
            // headStart: 1 game for 1-rank gap, 2 games for 2+ rank gap
            const headStart = Math.abs(r1 - r2) === 1 ? 1 : 2;
            if (r1 < r2) s1 = headStart; // player1 is weaker → gets the head start
            else s2 = headStart;         // player2 is weaker → gets the head start
        }
    }

    return `${s1} vs ${s2}`;
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
 * Resolve player ID – prefer nested object, fall back to flat field.
 */
function resolvePlayerId(match: ApiMatch, side: 'player1' | 'player2'): number | null {
    const nested = match[side];
    if (nested && nested.id) return nested.id;
    return match[`${side}_id` as 'player1_id' | 'player2_id'];
}

/**
 * Resolve player name – prefer nested object, fall back to flat field.
 */
function resolvePlayerName(match: ApiMatch, side: 'player1' | 'player2'): string | null {
    const nested = match[side];
    if (nested && nested.full_name) return nested.full_name;
    return match[`${side}_name` as 'player1_name' | 'player2_name'];
}

/**
 * Resolve player avatar – prefer nested object, fall back to flat field.
 */
function resolvePlayerAvatar(match: ApiMatch, side: 'player1' | 'player2'): string | null {
    const nested = match[side];
    if (nested && nested.avatar_url) return nested.avatar_url;
    return match[`${side}_avatar` as 'player1_avatar' | 'player2_avatar'];
}

/**
 * Resolve player rank – prefer nested object, fall back to flat field.
 */
function resolvePlayerRank(match: ApiMatch, side: 'player1' | 'player2'): string | null {
    const frozenRank = match[`${side}_rank` as 'player1_rank' | 'player2_rank'];
    if (frozenRank) return frozenRank;
    const nested = match[side];
    if (nested && nested.rank) return nested.rank;
    return null;
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
    maxKoRound?: number,
): FormattedMatch {
    // Resolve player IDs (support both nested objects and flat fields)
    const p1Id = resolvePlayerId(match, 'player1');
    const p2Id = resolvePlayerId(match, 'player2');
    const p1Name = resolvePlayerName(match, 'player1');
    const p2Name = resolvePlayerName(match, 'player2');
    const p1Avatar = resolvePlayerAvatar(match, 'player1');
    const p2Avatar = resolvePlayerAvatar(match, 'player2');
    const p1Rank = resolvePlayerRank(match, 'player1');
    const p2Rank = resolvePlayerRank(match, 'player2');

    // Resolve winner ID (support nested winner object)
    const winnerId = match.winner_id ?? match.winner?.id ?? null;

    const isCompleted = match.status === "completed";
    let p1Winner = isCompleted && winnerId === p1Id;
    let p2Winner = isCompleted && winnerId === p2Id;

    // NS (Not Show / absent): the other player wins by default
    if (match.player1_check_in === "absent") p2Winner = true;
    if (match.player2_check_in === "absent") p1Winner = true;
    const { time, date } = formatMatchTime(match.match_time);

    // Build table number display from table_no (e.g. "Bàn 1" → "1", "Bàn 2" → "2")
    // Only display table number and race info if the match status is "upcoming", "ongoing", or "completed"
    const isMatchActiveOrCompleted =
        match.status === "upcoming" ||
        match.status === "ongoing" ||
        match.status === "completed";

    const isFirstRound = match.round === 1 && (match.bracket === "winners" || match.bracket === "knockout");
    const showTable = isMatchActiveOrCompleted || isFirstRound;

    const tableNumber = showTable && match.table_no
        ? match.table_no.replace(/[^\d]/g, "") || match.table_no
        : "-";

    // Compute race info from player ranks + tournament settings
    const koRoundInfo = (match.bracket === 'knockout' && maxKoRound)
        ? { round: match.round, maxKoRound }
        : undefined;
    const raceText = showTable ? computeRaceText(p1Rank, p2Rank, tournament, koRoundInfo) : "";

    const isRegistrationClosed = tournament?.registration_end_date
        ? new Date() > new Date(tournament.registration_end_date)
        : false;

    const resolvedP1Fallback = (!isRegistrationClosed && p1Fallback === "Bye") ? "Chờ đăng ký" : p1Fallback;
    const resolvedP2Fallback = (!isRegistrationClosed && p2Fallback === "Bye") ? "Chờ đăng ký" : p2Fallback;

    return {
        id: match.id,
        tableNumber: tableNumber,
        tableNumberColor: getIndexColor(match),
        player1: {
            name: getPlayerName(p1Id, p1Name, match.player1_check_in, resolvedP1Fallback),
            avatar: formatAvatarUrl(p1Avatar),
            rank: p1Rank,
            isWinner: p1Winner,
            isBye: !p1Id,
        },
        player2: {
            name: getPlayerName(p2Id, p2Name, match.player2_check_in, resolvedP2Fallback),
            avatar: formatAvatarUrl(p2Avatar),
            rank: p2Rank,
            isWinner: p2Winner,
            isBye: !p2Id,
        },
        score: buildScoreString(match, p1Rank, p2Rank),
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
        return `VÒNG ${round}`;
    }
    if (bracket === "losers") {
        return `VÒNG ${round}: NHÁNH THUA`;
    }
    // knockout
    if (round === maxRound) return "CHUNG KẾT";
    if (round === maxRound - 1) return "BÁN KẾT";
    if (round === maxRound - 2) return "TỨ KẾT";
    if (round === maxRound - 3) return "VÒNG 1/8";
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
    } else if (numberOfPlayers === 24) {
        // 24-player bracket (special: WR1=1-8, WR2=9-16 with seeded slot2, LR1=17-24)
        // Group stage uses matches 1-24; knockout starts at 25
        return {
            wr1: { start: 1, count: 8 },
            lr1: { start: 17, count: 8 },
            wr2: { start: 9, count: 8 },
            lr2: { start: 0, count: 0 },
            knockout: [
                { start: 25, count: 8, round: 1 },  // R16
                { start: 33, count: 4, round: 2 },  // QF
                { start: 37, count: 2, round: 3 },  // SF
                { start: 39, count: 1, round: 4 },  // Final
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

    // Helper to get winner nested object
    function getWinnerOfMatch(mNo: number): ApiPlayerNested | null {
        const m = matchByNo.get(mNo);
        if (!m || m.status !== "completed") return null;
        const wId = m.winner_id ?? m.winner?.id ?? null;
        if (!wId) return null;
        if (m.player1 && m.player1.id === wId) return m.player1;
        if (m.player2 && m.player2.id === wId) return m.player2;
        // fallback to flat fields
        if (m.player1_id === wId) {
            return { id: m.player1_id, full_name: m.player1_name, avatar_url: m.player1_avatar, rank: m.player1_rank };
        }
        if (m.player2_id === wId) {
            return { id: m.player2_id, full_name: m.player2_name, avatar_url: m.player2_avatar, rank: m.player2_rank };
        }
        return null;
    }

    // Helper to get loser nested object
    function getLoserOfMatch(mNo: number): ApiPlayerNested | null {
        const m = matchByNo.get(mNo);
        if (!m || m.status !== "completed") return null;
        const wId = m.winner_id ?? m.winner?.id ?? null;
        if (!wId) return null;
        const p1Id = m.player1?.id || m.player1_id;
        const p2Id = m.player2?.id || m.player2_id;
        if (!p1Id || !p2Id) return null;
        
        if (wId === p1Id) {
            return m.player2 || { id: m.player2_id!, full_name: m.player2_name, avatar_url: m.player2_avatar, rank: m.player2_rank };
        }
        if (wId === p2Id) {
            return m.player1 || { id: m.player1_id!, full_name: m.player1_name, avatar_url: m.player1_avatar, rank: m.player1_rank };
        }
        return null;
    }

    function resolveDynamicPlayers(m: ApiMatch): ApiMatch {
        const p1Id = m.player1?.id || m.player1_id;
        const p2Id = m.player2?.id || m.player2_id;
        
        // If already has both players in the DB, return as is
        if (p1Id && p2Id) return m;
        
        let p1: ApiPlayerNested | null = m.player1 || null;
        let p2: ApiPlayerNested | null = m.player2 || null;
        
        const size = numberOfPlayers;
        
        if (size === 24) {
            // 24-player special: WR2 is one-to-one from WR1; LR1 gets losers from WR2 (reversed) + WR1
            if (m.bracket === "winners" && m.round === 2) {
                const wr1MatchNo = m.match_no - 8; // match 9→1, 10→2, ..., 16→8
                if (!p1Id) p1 = getWinnerOfMatch(wr1MatchNo);
                // player2 is pre-seeded in DB, don't override
            } else if (m.bracket === "losers" && m.round === 1) {
                const wr2MatchNo = 33 - m.match_no; // match 17→16, 18→15, ..., 24→9
                const wr1MatchNo = m.match_no - 16; // match 17→1, 18→2, ..., 24→8
                if (!p1Id) p1 = getLoserOfMatch(wr2MatchNo);
                if (!p2Id) p2 = getLoserOfMatch(wr1MatchNo);
            }
            return {
                ...m,
                player1: p1,
                player2: p2,
                player1_id: p1 ? p1.id : m.player1_id,
                player2_id: p2 ? p2.id : m.player2_id,
                player1_name: p1 ? p1.full_name : m.player1_name,
                player2_name: p2 ? p2.full_name : m.player2_name,
                player1_avatar: p1 ? p1.avatar_url : m.player1_avatar,
                player2_avatar: p2 ? p2.avatar_url : m.player2_avatar,
                player1_rank: p1 ? p1.rank : m.player1_rank,
                player2_rank: p2 ? p2.rank : m.player2_rank,
            };
        }

        if (m.bracket === "winners" && m.round === 2) {
            const idx = m.match_no - layout.wr2.start;
            const src1 = layout.wr1.start + 2 * idx;
            const src2 = layout.wr1.start + 2 * idx + 1;
            if (!p1Id) p1 = getWinnerOfMatch(src1);
            if (!p2Id) p2 = getWinnerOfMatch(src2);
        } else if (m.bracket === "losers" && m.round === 1) {
            const idx = m.match_no - layout.lr1.start;
            const src1 = layout.wr1.start + 2 * idx;
            const src2 = layout.wr1.start + 2 * idx + 1;
            if (!p1Id) p1 = getLoserOfMatch(src1);
            if (!p2Id) p2 = getLoserOfMatch(src2);
        } else if (m.bracket === "losers" && m.round === 2) {
            const idx = m.match_no - layout.lr2.start;
            let src1 = 0;
            let src2 = 0;
            if (size <= 16) {
                const lr1Sources = [9, 10, 11, 12];
                const wr2Sources = [16, 15, 14, 13];
                src1 = lr1Sources[idx];
                src2 = wr2Sources[idx];
            } else if (size <= 32) {
                src1 = 17 + idx;
                src2 = 32 - idx;
            } else {
                src1 = 33 + idx;
                src2 = 64 - idx;
            }
            if (!p1Id) p1 = getWinnerOfMatch(src1);
            if (!p2Id) p2 = getLoserOfMatch(src2);
        }
        
        return {
            ...m,
            player1: p1,
            player2: p2,
            player1_id: p1 ? p1.id : m.player1_id,
            player2_id: p2 ? p2.id : m.player2_id,
            player1_name: p1 ? p1.full_name : m.player1_name,
            player2_name: p2 ? p2.full_name : m.player2_name,
            player1_avatar: p1 ? p1.avatar_url : m.player1_avatar,
            player2_avatar: p2 ? p2.avatar_url : m.player2_avatar,
            player1_rank: p1 ? p1.rank : m.player1_rank,
            player2_rank: p2 ? p2.rank : m.player2_rank,
        };
    }

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
            if (numberOfPlayers === 24) {
                // 24-player LR1: p1 = loser of WR2 (33-matchNo), p2 = loser of WR1 (matchNo-16)
                sorted.forEach((m) => {
                    const wr2MatchNo = 33 - m.match_no;
                    const wr1MatchNo = m.match_no - 16;
                    labels.set(m.match_no, [`Thua trận ${wr2MatchNo}`, `Thua trận ${wr1MatchNo}`]);
                });
            } else {
                // Standard: LR1 players come from losers of WR1 pairs
                sorted.forEach((m, i) => {
                    const wr1Match1 = 1 + i * 2;
                    const wr1Match2 = 1 + i * 2 + 1;
                    labels.set(m.match_no, [`Thua trận ${wr1Match1}`, `Thua trận ${wr1Match2}`]);
                });
            }
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
        emptySlotFallback: string = "Bye",
        maxKoRound?: number,
    ): FormattedMatch[] {
        const sorted = [...roundMatches].sort((a, b) => a.match_no - b.match_no);
        const prevSorted = prevRoundMatches
            ? [...prevRoundMatches].sort((a, b) => a.match_no - b.match_no)
            : undefined;

        return sorted.map((match, index) => {
            let p1Fallback = emptySlotFallback;
            let p2Fallback = emptySlotFallback;

            if (!isFirstRound && prevSorted) {
                // 24-player WR2: one-to-one mapping (WR2[i].player1 = winner of WR1[i])
                const is24WR2 = numberOfPlayers === 24
                    && sorted.length > 0
                    && sorted[0].bracket === "winners"
                    && sorted[0].round === 2;
                if (is24WR2) {
                    const srcP1 = prevSorted[index];
                    if (srcP1) p1Fallback = `Thắng trận ${srcP1.match_no}`;
                    // p2 is pre-seeded (already in DB), keep "Bye" fallback
                } else {
                    const srcP1 = prevSorted[2 * index];
                    const srcP2 = prevSorted[2 * index + 1];
                    if (srcP1) p1Fallback = `Thắng trận ${srcP1.match_no}`;
                    if (srcP2) p2Fallback = `Thắng trận ${srcP2.match_no}`;
                }
            }

            return formatMatch(match, tournament, p1Fallback, p2Fallback, maxKoRound);
        });
    }

    function isSourceMatchBye(mNo: number): boolean {
        const m = matchByNo.get(mNo);
        if (!m) return false;
        const hasP1 = !!((m.player1 && m.player1.id) || m.player1_id);
        const hasP2 = !!((m.player2 && m.player2.id) || m.player2_id);
        // Only a true bye when the match is COMPLETED with exactly one player (walkover).
        // A pending/upcoming match with one empty slot is just incomplete registration, not a bye.
        return (hasP1 !== hasP2) && m.status === "completed";
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

        return sorted.map((match, index) => {
            const labels = sourceLabels.get(match.match_no);
            let p1Fallback = labels?.[0] ?? "Chờ...";
            let p2Fallback = labels?.[1] ?? "Chờ...";

            if (round === 1) {
                if (numberOfPlayers === 24) {
                    // WR2 source (p1) is never a true bye — seeded players always get a real opponent
                    // Only check WR1 source (p2) for bye
                    const wr1MatchNo = match.match_no - 16;
                    if (isSourceMatchBye(wr1MatchNo)) p2Fallback = "Bye";
                } else {
                    const src1 = 1 + index * 2;
                    const src2 = 1 + index * 2 + 1;
                    if (isSourceMatchBye(src1)) p1Fallback = "Bye";
                    if (isSourceMatchBye(src2)) p2Fallback = "Bye";
                }
            }

            return formatMatch(match, tournament, p1Fallback, p2Fallback);
        });
    }

    // --- Group stage (double elimination) ---
    const groupRounds: RoundGroup[] = [];

    if (isDoubleElimination) {
        // Generate complete bracket structure from layout
        let wr1Matches = ensureMatchRange(matchByNo, layout.wr1.start, layout.wr1.count, "winners", 1);
        let lr1Matches = ensureMatchRange(matchByNo, layout.lr1.start, layout.lr1.count, "losers", 1);
        let wr2Matches = ensureMatchRange(matchByNo, layout.wr2.start, layout.wr2.count, "winners", 2);
        let lr2Matches = ensureMatchRange(matchByNo, layout.lr2.start, layout.lr2.count, "losers", 2);

        // Dynamically resolve player information for unsaved matches
        wr1Matches = wr1Matches.map(resolveDynamicPlayers);
        lr1Matches = lr1Matches.map(resolveDynamicPlayers);
        wr2Matches = wr2Matches.map(resolveDynamicPlayers);
        lr2Matches = lr2Matches.map(resolveDynamicPlayers);

        // For 24 players: WR1 → WR2 (seeded vs WR1 winner) → LR1 (no LR2)
        // For others:     WR1 → LR1 → WR2 → LR2
        if (numberOfPlayers === 24) {
            groupRounds.push({
                title: "VÒNG 1",
                matches: formatWinnersRound(wr1Matches, true, undefined),
            });
            groupRounds.push({
                title: "VÒNG 2: NHÁNH THẮNG",
                matches: formatWinnersRound(wr2Matches, false, wr1Matches),
            });
            groupRounds.push({
                title: "VÒNG 2: NHÁNH THUA",
                matches: formatLosersRound(lr1Matches, 1),
            });
        } else {
            groupRounds.push({
                title: "VÒNG 1",
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
            if (lr2Matches.length > 0) {
                groupRounds.push({
                    title: "VÒNG 2: NHÁNH THUA",
                    matches: formatLosersRound(lr2Matches, 2),
                });
            }
        }
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
                    title: round === 1 ? `VÒNG ${round}` : `VÒNG ${round}: NHÁNH THẮNG`,
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
        const maxKoRound = layout.knockout[layout.knockout.length - 1].round;

        for (let i = 0; i < layout.knockout.length; i++) {
            const ko = layout.knockout[i];
            let koMatches = ensureMatchRange(matchByNo, ko.start, ko.count, "knockout", ko.round);

            let roundFormattedMatches: FormattedMatch[];

            if (i === 0) {
                const sortedKo = [...koMatches].sort((a, b) => a.match_no - b.match_no);
                if (numberOfPlayers === 24) {
                    koMatches = sortedKo.map((m, idx) => {
                        const p1Id = m.player1?.id || m.player1_id;
                        const p2Id = m.player2?.id || m.player2_id;
                        if (p1Id && p2Id) return m;

                        const wr2MatchNo = layout.wr2.start + idx;
                        const lr1MatchNo = layout.lr1.start + idx;
                        let p1 = m.player1 || null;
                        let p2 = m.player2 || null;
                        if (!p1Id) p1 = getWinnerOfMatch(wr2MatchNo);
                        if (!p2Id) p2 = getWinnerOfMatch(lr1MatchNo);
                        return {
                            ...m,
                            player1: p1,
                            player2: p2,
                            player1_id: p1 ? p1.id : m.player1_id,
                            player2_id: p2 ? p2.id : m.player2_id,
                            player1_name: p1 ? p1.full_name : m.player1_name,
                            player2_name: p2 ? p2.full_name : m.player2_name,
                            player1_avatar: p1 ? p1.avatar_url : m.player1_avatar,
                            player2_avatar: p2 ? p2.avatar_url : m.player2_avatar,
                            player1_rank: p1 ? p1.rank : m.player1_rank,
                            player2_rank: p2 ? p2.rank : m.player2_rank,
                        };
                    });

                    roundFormattedMatches = koMatches.map((match, idx) => {
                        const p1Fallback = `Thắng trận ${layout.wr2.start + idx}`;
                        const p2Fallback = `Thắng trận ${layout.lr1.start + idx}`;
                        return formatMatch(match, tournament, p1Fallback, p2Fallback, maxKoRound);
                    });
                } else {
                    koMatches = sortedKo.map((m, idx) => {
                        const p1Id = m.player1?.id || m.player1_id;
                        const p2Id = m.player2?.id || m.player2_id;
                        if (p1Id && p2Id) return m;

                        const wr2MatchNo = layout.wr2.start + idx;
                        let lr2MatchNo = layout.lr2.start + idx;
                        if (numberOfPlayers <= 16) {
                            const mapping = [19, 20, 17, 18];
                            lr2MatchNo = mapping[idx];
                        }
                        let p1 = m.player1 || null;
                        let p2 = m.player2 || null;
                        if (!p1Id) p1 = getWinnerOfMatch(wr2MatchNo);
                        if (!p2Id) p2 = getWinnerOfMatch(lr2MatchNo);
                        return {
                            ...m,
                            player1: p1,
                            player2: p2,
                            player1_id: p1 ? p1.id : m.player1_id,
                            player2_id: p2 ? p2.id : m.player2_id,
                            player1_name: p1 ? p1.full_name : m.player1_name,
                            player2_name: p2 ? p2.full_name : m.player2_name,
                            player1_avatar: p1 ? p1.avatar_url : m.player1_avatar,
                            player2_avatar: p2 ? p2.avatar_url : m.player2_avatar,
                            player1_rank: p1 ? p1.rank : m.player1_rank,
                            player2_rank: p2 ? p2.rank : m.player2_rank,
                        };
                    });

                    roundFormattedMatches = koMatches.map((match, idx) => {
                        const wr2MatchNo = layout.wr2.start + idx;
                        let lr2MatchNo = layout.lr2.start + idx;
                        if (numberOfPlayers <= 16) {
                            const mapping = [19, 20, 17, 18];
                            lr2MatchNo = mapping[idx];
                        }
                        const p1Fallback = `Thắng trận ${wr2MatchNo}`;
                        const p2Fallback = `Thắng trận ${lr2MatchNo}`;
                        return formatMatch(match, tournament, p1Fallback, p2Fallback, maxKoRound);
                    });
                }
            } else {
                roundFormattedMatches = formatWinnersRound(koMatches, i === 0, prevKoMatches, "Chờ...", maxKoRound);
            }

            knockoutRounds.push({
                title: getRoundLabel("knockout", ko.round, maxKoRound),
                matches: roundFormattedMatches,
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
                matches: formatWinnersRound(knockoutMap.get(round)!, isFirstRound, prevMatches, "Chờ...", maxKoRound),
            });
        }
    }

    return { groupRounds, knockoutRounds };
}

// ---------- Component ----------

interface MobileMatchCardProps {
    match: FormattedMatch;
    isFinal?: boolean;
}

const MobileMatchCard: React.FC<MobileMatchCardProps> = ({ match, isFinal = false }) => {
    const matchHasResult = !!match.player1.isWinner || !!match.player2.isWinner;

    // Table number box color
    let tableNumBg = "#464C58";
    let tableTextColor = "#7C8FB5";
    if (match.tableNumberColor === "green") {
        tableNumBg = "#60DB80";
        tableTextColor = "#FFFFFF";
    } else if (match.tableNumberColor === "yellow") {
        tableNumBg = "#E5BD4F";
        tableTextColor = "#FFFFFF";
    }

    const displayTableNumber =
        match.tableNumber != null &&
        match.tableNumber !== "" &&
        match.tableNumber !== "-"
            ? String(match.tableNumber)
            : "-";

    // Score parts
    const scoreParts = match.score.includes(" vs ")
        ? match.score.split(" vs ")
        : null;

    const p1ScoreVal = scoreParts ? scoreParts[0] : match.score;
    const p2ScoreVal = scoreParts ? scoreParts[1] : "";

    const prevP1ScoreRef = React.useRef(p1ScoreVal);
    const prevP2ScoreRef = React.useRef(p2ScoreVal);
    const [p1Flash, setP1Flash] = useState(false);
    const [p2Flash, setP2Flash] = useState(false);

    useEffect(() => {
        if (p1ScoreVal !== prevP1ScoreRef.current) {
            prevP1ScoreRef.current = p1ScoreVal;
            setP1Flash(true);
            const timer = setTimeout(() => setP1Flash(false), 800);
            return () => clearTimeout(timer);
        }
    }, [p1ScoreVal]);

    useEffect(() => {
        if (p2ScoreVal !== prevP2ScoreRef.current) {
            prevP2ScoreRef.current = p2ScoreVal;
            setP2Flash(true);
            const timer = setTimeout(() => setP2Flash(false), 800);
            return () => clearTimeout(timer);
        }
    }, [p2ScoreVal]);

    const getScoreColor = (isWinner?: boolean, opponentWinner?: boolean) => {
        if (!matchHasResult) return "#FFFFFF";
        if (isWinner) return "#ED1C1F";
        if (opponentWinner) return "#ACB3C3";
        return "#FFFFFF";
    };

    const getPlayerNameColor = (isWinner?: boolean, opponentWinner?: boolean) => {
        if (!matchHasResult) return "#FFFFFF";
        if (isFinal && isWinner) return "#FFD700";
        if (matchHasResult && !isWinner && opponentWinner) return "#ACB3C3";
        return "#FFFFFF";
    };

    const getPlayerNameWeight = (isWinner?: boolean, isBye?: boolean) => {
        if (isBye) return 400;
        return isWinner ? 700 : 500;
    };

    const renderTableNumber = (tableNo: string) => {
        if (!tableNo || tableNo === "-") return <span style={{ fontSize: "20px", fontWeight: 700 }}>-</span>;
        
        let clean = tableNo.trim();
        // If it's a number, prepend "Bàn "
        if (/^\d+$/.test(clean)) {
            clean = `Bàn ${clean}`;
        }

        // Adjust font size dynamically to make sure it fits the 72px pill in a single line
        const textLen = clean.length;
        let fontSize = "13px";
        if (textLen > 8) {
            fontSize = "10.5px";
        } else if (textLen > 6) {
            fontSize = "11.5px";
        }

        return (
            <span style={{ 
                fontSize: fontSize, 
                fontWeight: 700, 
                fontStyle: "italic",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                letterSpacing: "0.2px"
            }}>
                {clean}
            </span>
        );
    };

    return (
        <div className="flex flex-col gap-0 mb-3">
            {/* Meta row */}
            <div className="flex items-center justify-between px-1" style={{ paddingTop: "8px", paddingBottom: "4px" }}>
                <span
                    style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "12px",
                        fontStyle: "normal",
                        fontWeight: 500,
                        color: "#37393E",
                        lineHeight: "16px",
                    }}
                >
                    {match.meta.matchNo ? `Trận ${match.meta.matchNo}` : ""}
                </span>
                <span
                    style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "12px",
                        fontStyle: "normal",
                        fontWeight: 500,
                        color: "#37393E",
                        lineHeight: "16px",
                        textAlign: "right",
                    }}
                >
                    {[
                        [match.meta.time, match.meta.date].filter(Boolean).join(", "),
                        match.meta.race || "",
                    ].filter(Boolean).join(" / ")}
                </span>
            </div>

            {/* Card */}
            <div className="w-full flex items-stretch overflow-hidden shadow-sm" style={{ height: "80px", borderRadius: "12px", background: "linear-gradient(to right, transparent 72px, #172339 72px)" }}>
                {/* Table number box — 72×stretch */}
                <div
                    style={{
                        display: "flex",
                        width: "72px",
                        padding: "4px",
                        justifyContent: "center",
                        alignItems: "center",
                        alignSelf: "stretch",
                        background: tableNumBg,
                        color: tableTextColor,
                        fontFamily: "Montserrat, sans-serif",
                        textAlign: "center",
                        flexShrink: 0,
                        borderTopLeftRadius: "12px",
                        borderBottomLeftRadius: "12px",
                        transition: "background 0.5s ease-in-out, color 0.5s ease-in-out",
                    }}
                >
                    {renderTableNumber(displayTableNumber)}
                </div>

                {/* Players column — flex 1, split into 2 equal rows, no divider */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", flex: "1 0 0", background: "#172339" }}>
                    {/* Player 1 row */}
                    <div className="flex items-center justify-between w-full" style={{ height: "40px", paddingLeft: "8px", paddingRight: "12px" }}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {!match.player1.isBye && (
                                <img
                                    src={match.player1.avatar || "/images/generic-profile_mini_dcryfs.webp"}
                                    alt={match.player1.name}
                                    className="object-cover shrink-0"
                                    style={{ width: "26px", height: "26px" }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            "/images/generic-profile_mini_dcryfs.webp";
                                    }}
                                />
                            )}
                            <span
                                className="truncate"
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: getPlayerNameWeight(match.player1.isWinner, match.player1.isBye),
                                    color: getPlayerNameColor(match.player1.isWinner, match.player2.isWinner),
                                    lineHeight: "20px",
                                    fontStyle: match.player1.isBye ? "italic" : "normal",
                                    paddingRight: match.player1.isBye ? "4px" : "0px",
                                }}
                            >
                                {match.player1.name}{match.player1.rank && !match.player1.isBye ? ` - ${match.player1.rank}` : ""}
                            </span>
                        </div>
                        <div style={{
                            borderRadius: '6px',
                            padding: '2px 6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span
                                className={p1Flash ? "animate-score-flash" : ""}
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "18px",
                                    fontStyle: "italic",
                                    fontWeight: 700,
                                    lineHeight: "24px",
                                    color: getScoreColor(match.player1.isWinner, match.player2.isWinner),
                                    minWidth: "20px",
                                    textAlign: "right",
                                    flexShrink: 0,
                                }}
                            >
                                {p1ScoreVal}
                            </span>
                        </div>
                    </div>

                    {/* Player 2 row */}
                    <div className="flex items-center justify-between w-full" style={{ height: "40px", paddingLeft: "8px", paddingRight: "12px" }}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {!match.player2.isBye && (
                                <img
                                    src={match.player2.avatar || "/images/generic-profile_mini_dcryfs.webp"}
                                    alt={match.player2.name}
                                    className="object-cover shrink-0"
                                    style={{ width: "26px", height: "26px" }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            "/images/generic-profile_mini_dcryfs.webp";
                                    }}
                                />
                            )}
                            <span
                                className="truncate"
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: getPlayerNameWeight(match.player2.isWinner, match.player2.isBye),
                                    color: getPlayerNameColor(match.player2.isWinner, match.player1.isWinner),
                                    lineHeight: "20px",
                                    fontStyle: match.player2.isBye ? "italic" : "normal",
                                    paddingRight: match.player2.isBye ? "4px" : "0px",
                                }}
                            >
                                {match.player2.name}{match.player2.rank && !match.player2.isBye ? ` - ${match.player2.rank}` : ""}
                            </span>
                        </div>
                        <div style={{
                            borderRadius: '6px',
                            padding: '2px 6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span
                                className={p2Flash ? "animate-score-flash" : ""}
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "18px",
                                    fontStyle: "italic",
                                    fontWeight: 700,
                                    lineHeight: "24px",
                                    color: getScoreColor(match.player2.isWinner, match.player1.isWinner),
                                    minWidth: "20px",
                                    textAlign: "right",
                                    flexShrink: 0,
                                }}
                            >
                                {p2ScoreVal}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function TournamentMatchesPage() {
    const params = useParams();
    const router = useRouter();
    const slug = typeof params.slug === "string"
        ? params.slug
        : Array.isArray(params.slug)
            ? params.slug[0]
            : String(params.slug || "");

    const stageParam = typeof params.stage === "string"
        ? params.stage
        : Array.isArray(params.stage)
            ? params.stage[0]
            : String(params.stage || "");

    // Auth & registration check
    const user = useSelector((state: RootState) => state.auth.user);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null); // null = checking

    const [viewMode, setViewMode] = useState<"list" | "bracket">("list");
    const [activeStage, setActiveStage] = useState<"group" | "knockout">(
        stageParam === "2" ? "knockout" : "group"
    );

    // Sync state when URL param changes
    useEffect(() => {
        if (stageParam === "2") {
            setActiveStage("knockout");
        } else {
            setActiveStage("group");
        }
    }, [stageParam]);
    const [loading, setLoading] = useState(true);
    const [rawMatches, setRawMatches] = useState<ApiMatch[]>([]);
    const [tournamentData, setTournamentData] = useState<TournamentInfo | null>(null);

    const { groupRounds, knockoutRounds } = useMemo(() => {
        return groupMatches(rawMatches, tournamentData);
    }, [rawMatches, tournamentData]);

    // IDs of matches the current user is in
    const userMatchIds = useMemo(() => {
        if (!user || !isRegistered) return null;
        const ids = new Set<number>();
        for (const m of rawMatches) {
            if (m.player1_id === user.id || m.player2_id === user.id) {
                ids.add(m.id);
            }
        }
        return ids;
    }, [rawMatches, user, isRegistered]);

    const isRegistrationClosed = useMemo(() => {
        if (!tournamentData) return false;
        return tournamentData.registration_end_date
            ? new Date() > new Date(tournamentData.registration_end_date)
            : false;
    }, [tournamentData]);

    // Reveal all names when: registration has closed OR tournament is full
    const isRevealedPhase = useMemo(() => {
        if (!tournamentData) return false;
        const full = (tournamentData.registration_count ?? 0) >= (tournamentData.number_of_players ?? Infinity);
        return isRegistrationClosed || full;
    }, [tournamentData, isRegistrationClosed]);

    // Own match always shows real names; other matches hidden as "Bye" / "Chờ đăng ký" until revealed phase
    const sanitizeRoundsForUser = (rounds: RoundGroup[]): RoundGroup[] => {
        if (isRevealedPhase) return rounds;
        if (!isRegistered) return [];

        const isPlaceholderName = (name: string) =>
            !name ||
            name === "Bye" ||
            name === "Chờ..." ||
            name === "Chờ đăng ký" ||
            name.startsWith("Thắng trận") ||
            name.startsWith("Thua trận");

        const hidePlayer = (p: FormattedMatch["player1"]) => {
            if (isPlaceholderName(p.name)) return p;
            const hiddenName = isRegistrationClosed ? "Bye" : "Chờ đăng ký";
            return { ...p, name: hiddenName, avatar: "", rank: null, isBye: true };
        };

        return rounds.map(round => ({
            ...round,
            matches: round.matches.map(m => {
                const fm = m as unknown as FormattedMatch;
                if (userMatchIds?.has(fm.id)) return m; // Own match — always show full info
                return { ...fm, player1: hidePlayer(fm.player1), player2: hidePlayer(fm.player2) };
            }),
        }));
    };

    const visibleGroupRounds = useMemo(
        () => sanitizeRoundsForUser(groupRounds),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [groupRounds, userMatchIds, isRevealedPhase, isRegistered, isRegistrationClosed],
    );
    const visibleKnockoutRounds = useMemo(
        () => sanitizeRoundsForUser(knockoutRounds),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [knockoutRounds, userMatchIds, isRevealedPhase, isRegistered, isRegistrationClosed],
    );

    // Check if current user is registered for this tournament
    useEffect(() => {
        if (!slug) return;
        if (!user) {
            setIsRegistered(false);
            return;
        }
        tournamentAPI.getTournamentRegistrationsBySlug(slug)
            .then((res) => {
                const regs: { id: number }[] = res.data || [];
                setIsRegistered(regs.some(r => r.id === user.id));
            })
            .catch(() => setIsRegistered(false));
    }, [slug, user]);

    useEffect(() => {
        if (isRegistered === false && isRevealedPhase === false && !loading) {
            router.replace(`/tournaments/${slug}`);
        }
    }, [isRegistered, isRevealedPhase, loading, router, slug]);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);

        // Fetch tournament info (for race settings) and matches in parallel
        Promise.all([
            tournamentAPI.getTournament(slug).catch(() => ({ data: null })),
            tournamentAPI.getTournamentMatchesBySlug(slug),
        ])
            .then(([tournamentRes, matchesRes]) => {
                const tour: TournamentInfo | null = tournamentRes.data || null;
                const matches: ApiMatch[] = matchesRes.data || [];
                setTournamentData(tour);
                setRawMatches(matches);

                const { groupRounds: gr, knockoutRounds: kr } = groupMatches(matches, tour);
                // Auto-select tab: if no group matches but has knockout, switch to knockout
                if (gr.length === 0 && kr.length > 0) {
                    setActiveStage("knockout");
                }
            })
            .catch((err) => {
                console.error("Failed to fetch matches:", err);
                setRawMatches([]);
                setTournamentData(null);
            })
            .finally(() => setLoading(false));
    }, [slug]);

    // Fallback polling: refetch matches every 5 seconds (matches CMS polling cadence)
    // Uses a smart merge: only overwrite a match if the polled version is newer or has a different score,
    // so SSE real-time updates are not clobbered by a stale poll that arrives slightly later.
    useEffect(() => {
        if (!slug) return;
        const interval = setInterval(() => {
            tournamentAPI.getTournamentMatchesBySlug(slug)
                .then((res) => {
                    const freshMatches: ApiMatch[] = res.data || [];
                    setRawMatches((prev) => {
                        const prevByNo = new Map(prev.map((m) => [m.match_no, m]));
                        const merged = freshMatches.map((fm) => {
                            const existing = prevByNo.get(fm.match_no);
                            if (!existing) return fm;
                            // Keep the version with the higher total score (more recent device update)
                            const freshTotal = (fm.player1_score ?? 0) + (fm.player2_score ?? 0);
                            const existingTotal = (existing.player1_score ?? 0) + (existing.player2_score ?? 0);
                            return freshTotal >= existingTotal ? fm : existing;
                        });
                        return merged;
                    });
                })
                .catch((err) => {
                    console.error("Failed to poll matches:", err);
                });
        }, 5000);

        return () => clearInterval(interval);
    }, [slug]);

    useEffect(() => {
        if (!tournamentData?.id) return;

        let API_BASE = "";
        if (typeof window !== "undefined") {
            API_BASE = `http://${window.location.hostname}:8000`;
        } else {
            API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        }
        const sseUrl = `${API_BASE}/api/tournaments/${tournamentData.id}/matches/live`;
        console.log("Connecting to live match updates SSE:", sseUrl);

        const eventSource = new EventSource(sseUrl, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const updatedMatch: ApiMatch = JSON.parse(event.data);
                console.log("Realtime match update received:", updatedMatch);
                
                setRawMatches((prev) => {
                    const idx = prev.findIndex((m) => m.match_no === updatedMatch.match_no);
                    if (idx !== -1) {
                        const next = [...prev];
                        next[idx] = { ...next[idx], ...updatedMatch };
                        return next;
                    } else {
                        return [...prev, updatedMatch];
                    }
                });
            } catch (e) {
                console.error("Failed to parse SSE data:", e);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE connection error:", err);
        };

        return () => {
            console.log("Closing live match updates SSE connection");
            eventSource.close();
        };
    }, [tournamentData?.id]);



    const renderMobileRoundSection = (round: RoundGroup, keyPrefix: string, index: number) => (
        <div key={`${keyPrefix}-${index}`} className="flex flex-col gap-0">
            {/* Round header */}
            <div
                className="bg-[#C6010B] flex items-center mb-[6px]"
                style={{ height: "48px", borderRadius: "12px", padding: "12px", alignSelf: "stretch" }}
            >
                <span
                    style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "18px",
                        fontStyle: "normal",
                        fontWeight: 700,
                        lineHeight: "24px",
                        color: "#FFF",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {round.title}
                </span>
            </div>

            {/* Match list */}
            <div className="flex flex-col gap-0">
                {(round.matches as unknown as FormattedMatch[]).map((match) => (
                    <MobileMatchCard key={match.id} match={match} isFinal={round.title === "CHUNG KẾT"} />
                ))}
            </div>
        </div>
    );

    const renderAccessDenied = (isMobile = false) => {
        const isNotLoggedIn = !user;
        const msg = isNotLoggedIn
            ? "Bạn cần đăng nhập để xem trang này"
            : "Bạn chưa đăng ký giải đấu này";
        const sub = isNotLoggedIn
            ? "Vui lòng đăng nhập để xem lịch thi đấu của bạn"
            : "Chỉ người tham gia giải đấu mới có thể xem trang trận đấu";
        return (
            <div
                className={`flex flex-col items-center justify-center ${isMobile ? "py-16 px-4" : "py-24"}`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
            >
                <div
                    style={{
                        background: "#172339",
                        borderRadius: "16px",
                        padding: "32px 24px",
                        maxWidth: "360px",
                        width: "100%",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
                    <p style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                        {msg}
                    </p>
                    <p style={{ color: "#ACB3C3", fontSize: "13px", marginBottom: "20px" }}>
                        {sub}
                    </p>
                    {isNotLoggedIn && (
                        <button
                            onClick={() => router.push("/auth/login")}
                            style={{
                                background: "#C6010B",
                                color: "#FFF",
                                border: "none",
                                borderRadius: "8px",
                                padding: "10px 24px",
                                fontFamily: "Montserrat, sans-serif",
                                fontWeight: 700,
                                fontSize: "14px",
                                cursor: "pointer",
                            }}
                        >
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderMobileContent = () => {
        if (loading || isRegistered === null) {
            return (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Đang tải trận đấu...
                        </p>
                    </div>
                </div>
            );
        }

        if (!isRegistered && !isRevealedPhase) return renderAccessDenied(true);

        const rounds = activeStage === "group" ? visibleGroupRounds : visibleKnockoutRounds;
        const emptyMsg =
            activeStage === "group"
                ? "Chưa có trận đấu vòng bảng"
                : "Chưa có trận đấu vòng loại trực tiếp";

        if (viewMode === "bracket") {
            return rounds.length > 0 ? (
                <div className="w-full overflow-x-auto flex gap-4 py-4 px-2 bg-[#172339] rounded-2xl min-h-[450px]" style={{ scrollbarWidth: "none" }}>
                    {rounds.map((round, rIdx) => (
                        <div key={rIdx} className="flex flex-col justify-around min-w-[260px] gap-4">
                            <div className="text-white font-bold text-center border-b border-gray-700/50 pb-2 text-sm uppercase" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                {round.title}
                            </div>
                            <div className="flex flex-col gap-4 justify-center flex-1">
                                {round.matches.map((match) => (
                                    <MobileMatchCard key={match.id} match={match as any} isFinal={round.title === "CHUNG KẾT"} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {emptyMsg}
                </div>
            );
        }

        return rounds.length > 0 ? (
            <div className="flex flex-col gap-5">
                {rounds.map((round, i) =>
                    renderMobileRoundSection(round, activeStage, i)
                )}
            </div>
        ) : (
            <div
                className="text-center py-12 text-gray-500"
                style={{ fontFamily: "Montserrat, sans-serif" }}
            >
                {emptyMsg}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#e8e8e8] font-sans">
            <NavBar />

            {/* ===================== DESKTOP ===================== */}
            <div className="hidden sm:block pb-24">
                {/* Matches Header / Tabs */}
                <div className="w-full sticky top-[50px] xl:top-[66px] z-[60] shadow-md">
                    <div className="flex w-full h-[36px]">
                        <button
                            onClick={() => router.push(`/tournaments/${slug}/matches/1`)}
                            className={`flex-1 h-full flex items-center justify-center uppercase tracking-wide transition-colors ${activeStage === "group" ? "bg-[#172339] text-white" : "bg-[#fafafa] text-[#172339] shadow-inner hover:bg-[#2e394c] hover:text-white"}`}
                            style={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: "16px",
                                fontStyle: "italic",
                                fontWeight: 700,
                                lineHeight: "28px",
                            }}
                        >
                            Vòng bảng
                        </button>
                        <button
                            onClick={() => router.push(`/tournaments/${slug}/matches/2`)}
                            className={`w-[960px] h-full flex items-center justify-center uppercase tracking-wide transition-colors ${activeStage === "knockout" ? "bg-[#172339] text-white" : "bg-[#fafafa] text-[#172339] shadow-inner hover:bg-[#2e394c] hover:text-white"}`}
                            style={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: "16px",
                                fontStyle: "italic",
                                fontWeight: 700,
                                lineHeight: "28px",
                            }}
                        >
                            Vòng loại trực tiếp
                        </button>
                    </div>
                </div>

                <main className="w-full max-w-[1360px] mx-auto mt-[48px] flex flex-col gap-[48px]">
                    {/* Banner */}
                    <ChampionshipBanner className="shadow-sm" />

                    {/* Loading / Access Check */}
                    {(loading || isRegistered === null) ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <Spin size="large" />
                                <p className="mt-4 text-gray-600">Đang tải trận đấu...</p>
                            </div>
                        </div>
                    ) : (!isRegistered && !isRevealedPhase) ? (
                        renderAccessDenied()
                    ) : (
                        <>
                            {viewMode === "bracket" ? (
                                <div className="w-full overflow-x-auto flex gap-6 p-6 bg-[#172339] rounded-2xl min-h-[500px]" style={{ scrollbarWidth: "none" }}>
                                    {(activeStage === "group" ? visibleGroupRounds : visibleKnockoutRounds).map((round, rIdx) => (
                                        <div key={rIdx} className="flex flex-col justify-around min-w-[280px] gap-4">
                                            <div className="text-white font-bold text-center border-b border-gray-700/50 pb-2 uppercase" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                                {round.title}
                                            </div>
                                            <div className="flex flex-col gap-4 justify-center flex-1">
                                                {round.matches.map((match) => (
                                                    <div key={match.id} className="w-full max-w-[280px]">
                                                        <MobileMatchCard match={match as any} isFinal={round.title === "CHUNG KẾT"} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activeStage === "group" ? (
                                <div className="flex flex-col gap-[48px]">
                                    {visibleGroupRounds.length > 0 ? (
                                        visibleGroupRounds.map((round, i) => (
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
                                    {visibleKnockoutRounds.length > 0 ? (
                                        visibleKnockoutRounds.map((round, i) => (
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
            </div>

            {/* ===================== MOBILE ===================== */}
            <div className="block sm:hidden pb-[80px]">
                {/* Sticky Tab Switcher */}
                <div className="sticky top-[50px] z-[60] w-full shadow-md">
                    <div className="flex w-full" style={{ height: "40px" }}>
                        <button
                            id="mobile-tab-group"
                            onClick={() => router.push(`/tournaments/${slug}/matches/1`)}
                            className={`flex-1 h-full flex items-center justify-center transition-colors ${activeStage === "group" ? "bg-[#172339] text-white" : "bg-[#F5F5F5] text-[#172339] hover:bg-[#2e394c] hover:text-white"}`}
                            style={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: "16px",
                                fontStyle: "italic",
                                fontWeight: 700,
                                lineHeight: "24px",
                                textTransform: "uppercase",
                                border: "none",
                                outline: "none",
                            }}
                        >
                            Vòng bảng
                        </button>
                        <button
                            id="mobile-tab-knockout"
                            onClick={() => router.push(`/tournaments/${slug}/matches/2`)}
                            className={`flex-1 h-full flex items-center justify-center transition-colors ${activeStage === "knockout" ? "bg-[#172339] text-white" : "bg-[#F5F5F5] text-[#172339] hover:bg-[#2e394c] hover:text-white"}`}
                            style={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: "16px",
                                fontStyle: "italic",
                                fontWeight: 700,
                                lineHeight: "24px",
                                textTransform: "uppercase",
                                border: "none",
                                outline: "none",
                            }}
                        >
                            Vòng loại trực tiếp
                        </button>
                    </div>
                </div>

                {/* Championship Banner — same 361/74 ratio + px-4 as tournaments listing page */}
                <div className="px-4 mt-4">
                    <ChampionshipBanner className="!h-auto" style={{ aspectRatio: '361 / 74' }} />
                </div>

                {/* Match content */}
                <div className="px-4 pt-4">
                    {renderMobileContent()}
                </div>
            </div>

            <TournamentNavbar activeTab="matches" />

            {/* Floating Action Button for Bracket/List toggle */}
            <button
                onClick={() => router.push(`/tournaments/${slug}/matches/${stageParam}/bracket`)}
                className="fixed bottom-[96px] right-[11px] w-[50px] h-[50px] rounded-full bg-[#C6010B] shadow-lg flex items-center justify-center z-[70] transition-all hover:scale-105 active:scale-95 border-none sm:bottom-[100px]"
                style={{
                    boxShadow: "0px 4px 16px rgba(198, 1, 11, 0.3)"
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M6.599 20.9487L6.599 16.8181L15.9996 16.8181M25.4001 20.9487L25.4001 16.8181L15.9996 16.8181M15.9996 16.8181L15.9996 13.2167" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.98358 29.1875L5.63037 29.1875C5.26562 29.1875 4.94205 29.1757 4.65378 29.1345C3.10654 28.9639 2.68884 28.2341 2.68884 26.245L2.68884 23.891C2.68884 21.9019 3.10654 21.1721 4.65378 21.0015C4.94205 20.9603 5.26562 20.9485 5.63037 20.9485L7.98358 20.9485C8.34833 20.9485 8.6719 20.9603 8.96017 21.0015C10.5074 21.1721 10.9251 21.9019 10.9251 23.891L10.9251 26.245C10.9251 28.2341 10.5074 28.9639 8.96017 29.1345C8.6719 29.1757 8.34833 29.1875 7.98358 29.1875Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.1776 13.2163L14.8243 13.2163C14.4596 13.2163 14.136 13.2045 13.8478 13.1633C12.3005 12.9927 11.8828 12.2629 11.8828 10.2738L11.8828 7.9198C11.8828 5.93067 12.3005 5.20093 13.8477 5.03026C14.136 4.98906 14.4596 4.97729 14.8243 4.97729L17.1776 4.97729C17.5423 4.97729 17.8659 4.98906 18.1541 5.03026C19.7014 5.20092 20.1191 5.93067 20.1191 7.9198L20.1191 10.2738C20.1191 12.2629 19.7014 12.9927 18.1541 13.1633C17.8659 13.2045 17.5423 13.2163 17.1776 13.2163Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M26.3676 29.1875L24.0144 29.1875C23.6497 29.1875 23.3261 29.1757 23.0378 29.1345C21.4906 28.9639 21.0729 28.2341 21.0729 26.245L21.0729 23.891C21.0729 21.9019 21.4906 21.1721 23.0378 21.0015C23.3261 20.9603 23.6497 20.9485 24.0144 20.9485L26.3676 20.9485C26.7324 20.9485 27.0559 20.9603 27.3442 21.0015C28.8914 21.1721 29.3091 21.9019 29.3091 23.891L29.3091 26.245C29.3091 28.2341 28.8914 28.9639 27.3442 29.1345C27.0559 29.1757 26.7324 29.1875 26.3676 29.1875Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
        </div>
    );
}
