"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Spin } from "antd";
import { TournamentNavbar } from "@/components";
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
    bracket: string;
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
    status: string;
    player1_check_in: string;
    player2_check_in: string;
    winner_id: number | null;
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
    number_of_players?: number | null;
    tournament_type?: string | null;
}

interface RoundGroup {
    title: string;
    matches: FormattedMatch[];
}

// Rank ordering for handicap calculation
const RANK_ORDER = ['K', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];

function getRankIndex(rank?: string | null): number {
    if (!rank) return -1;
    return RANK_ORDER.indexOf(rank.toUpperCase());
}

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

function formatAvatarUrl(avatarUrl: string | null): string {
    if (!avatarUrl) return "";
    if (avatarUrl.startsWith("http")) return avatarUrl;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${API_BASE}${avatarUrl}`;
}

function getIndexColor(match: ApiMatch): "default" | "green" | "yellow" {
    if (match.status === "ongoing") return "green";
    if (match.status === "upcoming") return "yellow";
    return "default";
}

function getPlayerName(
    playerId: number | null,
    playerName: string | null,
    checkIn: string,
    fallback: string,
): string {
    if (!playerId) return fallback;
    return playerName || fallback;
}

function buildScoreString(match: ApiMatch, p1Rank?: string | null, p2Rank?: string | null): string {
    const p1Id = (match.player1 && match.player1.id) || match.player1_id;
    const p2Id = (match.player2 && match.player2.id) || match.player2_id;

    if (match.status === "pending") {
        return " vs ";
    }

    if (match.player1_check_in === "absent") return "NS vs -";
    if (match.player2_check_in === "absent") return "- vs NS";

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

    // Apply handicap head start when both scores are 0 and match is in progress.
    // Device initialises the scoreboard locally but only pushes an update after the first ball is potted.
    if (s1 === 0 && s2 === 0 && (match.status === "upcoming" || match.status === "ongoing") && p1Rank && p2Rank) {
        const r1 = getRankIndex(p1Rank);
        const r2 = getRankIndex(p2Rank);
        if (r1 >= 0 && r2 >= 0 && r1 !== r2) {
            const headStart = Math.abs(r1 - r2) === 1 ? 1 : 2;
            if (r1 < r2) s1 = headStart;
            else s2 = headStart;
        }
    }

    return `${s1} vs ${s2}`;
}

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

function resolvePlayerId(match: ApiMatch, side: 'player1' | 'player2'): number | null {
    const nested = match[side];
    if (nested && nested.id) return nested.id;
    return match[`${side}_id` as 'player1_id' | 'player2_id'];
}

function resolvePlayerName(match: ApiMatch, side: 'player1' | 'player2'): string | null {
    const nested = match[side];
    if (nested && nested.full_name) return nested.full_name;
    return match[`${side}_name` as 'player1_name' | 'player2_name'];
}

function resolvePlayerAvatar(match: ApiMatch, side: 'player1' | 'player2'): string | null {
    const nested = match[side];
    if (nested && nested.avatar_url) return nested.avatar_url;
    return match[`${side}_avatar` as 'player1_avatar' | 'player2_avatar'];
}

function resolvePlayerRank(match: ApiMatch, side: 'player1' | 'player2'): string | null {
    const frozenRank = match[`${side}_rank` as 'player1_rank' | 'player2_rank'];
    if (frozenRank) return frozenRank;
    const nested = match[side];
    if (nested && nested.rank) return nested.rank;
    return null;
}

function formatMatch(
    match: ApiMatch,
    tournament: TournamentInfo | null,
    p1Fallback: string = "Bye",
    p2Fallback: string = "Bye",
): FormattedMatch {
    const p1Id = resolvePlayerId(match, 'player1');
    const p2Id = resolvePlayerId(match, 'player2');
    const p1Name = resolvePlayerName(match, 'player1');
    const p2Name = resolvePlayerName(match, 'player2');
    const p1Avatar = resolvePlayerAvatar(match, 'player1');
    const p2Avatar = resolvePlayerAvatar(match, 'player2');
    const p1Rank = resolvePlayerRank(match, 'player1');
    const p2Rank = resolvePlayerRank(match, 'player2');

    const winnerId = match.winner_id ?? match.winner?.id ?? null;

    const isCompleted = match.status === "completed";
    let p1Winner = isCompleted && winnerId === p1Id;
    let p2Winner = isCompleted && winnerId === p2Id;

    if (match.player1_check_in === "absent") p2Winner = true;
    if (match.player2_check_in === "absent") p1Winner = true;
    const { time, date } = formatMatchTime(match.match_time);

    const tableNumber = match.table_no || "-";

    const raceText = computeRaceText(p1Rank, p2Rank, tournament);

    return {
        id: match.id,
        tableNumber: tableNumber,
        tableNumberColor: getIndexColor(match),
        player1: {
            name: getPlayerName(p1Id, p1Name, match.player1_check_in, p1Fallback),
            avatar: formatAvatarUrl(p1Avatar),
            rank: p1Rank,
            isWinner: p1Winner,
            isBye: !p1Id,
        },
        player2: {
            name: getPlayerName(p2Id, p2Name, match.player2_check_in, p2Fallback),
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

// ---------- Live Card Component ----------
interface MatchCardProps {
    match: FormattedMatch;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
    const matchHasResult = !!match.player1.isWinner || !!match.player2.isWinner;

    // Table box colors
    let tableNumBg = "#464C58";
    let tableTextColor = "#7C8FB5";
    if (match.tableNumberColor === "green") {
        tableNumBg = "#60DB80";
        tableTextColor = "#FFFFFF";
    } else if (match.tableNumberColor === "yellow") {
        tableNumBg = "#E5BD4F";
        tableTextColor = "#FFFFFF";
    }

    const displayTableNumber = String(match.tableNumber || "-");

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

    // Score parsing
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
        if (matchHasResult && !isWinner && opponentWinner) return "#ACB3C3";
        return "#FFFFFF";
    };

    const getPlayerNameWeight = (isWinner?: boolean, isBye?: boolean) => {
        if (isBye) return 400;
        return isWinner ? 700 : 500;
    };

    const getPlayerFontSize = (name: string, rank?: string | null, isBye?: boolean) => {
        const fullName = `${name}${rank && !isBye ? ` - ${rank}` : ""}`;
        const len = fullName.length;
        if (len > 24) return "10px";
        if (len > 20) return "11.5px";
        if (len > 16) return "13px";
        return "14px";
    };

    return (
        <div className="flex flex-col gap-0 w-full">
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

            {/* Seamless Card Body */}
            <div className="w-full flex items-stretch overflow-hidden shadow-sm" style={{ height: "80px", borderRadius: "12px", background: "linear-gradient(to right, transparent 72px, #172339 72px)" }}>
                {/* Table number box */}
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

                {/* Players column */}
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
                                    fontSize: getPlayerFontSize(match.player1.name, match.player1.rank, match.player1.isBye),
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
                                    fontSize: getPlayerFontSize(match.player2.name, match.player2.rank, match.player2.isBye),
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

// When duplicates exist (same match_no), keep the best row:
// completed > others, winner set, both players present, higher total score, lower id
const dedupeMatches = (matches: ApiMatch[]): ApiMatch[] => {
    const map = new Map<number, ApiMatch>();
    const statusRank = (s: string) => s === 'completed' ? 0 : s === 'ongoing' ? 1 : s === 'upcoming' ? 2 : 3;
    for (const m of matches) {
        const existing = map.get(m.match_no);
        if (!existing) { map.set(m.match_no, m); continue; }
        const score = (x: ApiMatch) =>
            statusRank(x.status) * -100 +
            (x.winner_id ? 10 : 0) +
            (x.player1_id && x.player2_id ? 5 : 0) +
            (x.player1_score + x.player2_score);
        if (score(m) > score(existing)) map.set(m.match_no, m);
    }
    return Array.from(map.values()).sort((a, b) => a.match_no - b.match_no);
};

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

function getBracketLayout(numberOfPlayers: number) {
    if (numberOfPlayers > 32) {
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

function groupMatches(allMatches: ApiMatch[], tournament: TournamentInfo | null) {
    const matchByNo = new Map<number, ApiMatch>();
    for (const m of allMatches) {
        matchByNo.set(m.match_no, m);
    }

    const numberOfPlayers = tournament?.number_of_players || 16;
    const isDoubleElimination = tournament?.tournament_type === "double_elimination";
    const layout = getBracketLayout(numberOfPlayers);

    const is64 = numberOfPlayers > 32;
    const is32 = numberOfPlayers > 16 && numberOfPlayers <= 32;

    function getWinnerOfMatch(mNo: number): ApiPlayerNested | null {
        const m = matchByNo.get(mNo);
        if (!m || m.status !== "completed") return null;
        const wId = m.winner_id ?? m.winner?.id ?? null;
        if (!wId) return null;
        if (m.player1 && m.player1.id === wId) return m.player1;
        if (m.player2 && m.player2.id === wId) return m.player2;
        if (m.player1_id === wId) {
            return { id: m.player1_id, full_name: m.player1_name, avatar_url: m.player1_avatar, rank: m.player1_rank };
        }
        if (m.player2_id === wId) {
            return { id: m.player2_id, full_name: m.player2_name, avatar_url: m.player2_avatar, rank: m.player2_rank };
        }
        return null;
    }

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
        
        if (p1Id && p2Id) return m;
        
        let p1: ApiPlayerNested | null = m.player1 || null;
        let p2: ApiPlayerNested | null = m.player2 || null;
        
        const size = numberOfPlayers;
        
        if (size === 24) {
            if (m.bracket === "winners" && m.round === 2) {
                const wr1MatchNo = m.match_no - 8;
                if (!p1Id) p1 = getWinnerOfMatch(wr1MatchNo);
            } else if (m.bracket === "losers" && m.round === 1) {
                const wr2MatchNo = 33 - m.match_no;
                const wr1MatchNo = m.match_no - 16;
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

    function getLosersSourceLabels(
        roundMatches: ApiMatch[],
        round: number,
    ): Map<number, [string, string]> {
        const labels = new Map<number, [string, string]>();
        const sorted = [...roundMatches].sort((a, b) => a.match_no - b.match_no);

        if (round === 1) {
            if (numberOfPlayers === 24) {
                sorted.forEach((m) => {
                    const wr2MatchNo = 33 - m.match_no;
                    const wr1MatchNo = m.match_no - 16;
                    labels.set(m.match_no, [`Thua trận ${wr2MatchNo}`, `Thua trận ${wr1MatchNo}`]);
                });
            } else {
                sorted.forEach((m, i) => {
                    const wr1Match1 = 1 + i * 2;
                    const wr1Match2 = 1 + i * 2 + 1;
                    labels.set(m.match_no, [`Thua trận ${wr1Match1}`, `Thua trận ${wr1Match2}`]);
                });
            }
        } else if (round === 2) {
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

    function formatWinnersRound(
        roundMatches: ApiMatch[],
        isFirstRound: boolean,
        prevRoundMatches: ApiMatch[] | undefined,
        emptySlotFallback: string = "Bye",
    ): FormattedMatch[] {
        const sorted = [...roundMatches].sort((a, b) => a.match_no - b.match_no);
        const prevSorted = prevRoundMatches
            ? [...prevRoundMatches].sort((a, b) => a.match_no - b.match_no)
            : undefined;

        return sorted.map((match, index) => {
            let p1Fallback = emptySlotFallback;
            let p2Fallback = emptySlotFallback;

            if (!isFirstRound && prevSorted) {
                const is24WR2 = numberOfPlayers === 24
                    && sorted.length > 0
                    && sorted[0].bracket === "winners"
                    && sorted[0].round === 2;
                if (is24WR2) {
                    const srcP1 = prevSorted[index];
                    if (srcP1) p1Fallback = `Thắng trận ${srcP1.match_no}`;
                } else {
                    const srcP1 = prevSorted[2 * index];
                    const srcP2 = prevSorted[2 * index + 1];
                    if (srcP1) p1Fallback = `Thắng trận ${srcP1.match_no}`;
                    if (srcP2) p2Fallback = `Thắng trận ${srcP2.match_no}`;
                }
            }

            return formatMatch(match, tournament, p1Fallback, p2Fallback);
        });
    }

    function isSourceMatchBye(mNo: number): boolean {
        const m = matchByNo.get(mNo);
        if (!m) return false;
        const hasP1 = !!((m.player1 && m.player1.id) || m.player1_id);
        const hasP2 = !!((m.player2 && m.player2.id) || m.player2_id);
        return (hasP1 !== hasP2) && m.status === "completed";
    }

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

    const groupRounds: RoundGroup[] = [];

    if (isDoubleElimination) {
        let wr1Matches = ensureMatchRange(matchByNo, layout.wr1.start, layout.wr1.count, "winners", 1);
        let lr1Matches = ensureMatchRange(matchByNo, layout.lr1.start, layout.lr1.count, "losers", 1);
        let wr2Matches = ensureMatchRange(matchByNo, layout.wr2.start, layout.wr2.count, "winners", 2);
        let lr2Matches = ensureMatchRange(matchByNo, layout.lr2.start, layout.lr2.count, "losers", 2);

        wr1Matches = wr1Matches.map(resolveDynamicPlayers);
        lr1Matches = lr1Matches.map(resolveDynamicPlayers);
        wr2Matches = wr2Matches.map(resolveDynamicPlayers);
        lr2Matches = lr2Matches.map(resolveDynamicPlayers);

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

    const knockoutRounds: RoundGroup[] = [];

    if (isDoubleElimination && layout.knockout.length > 0) {
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
                        return formatMatch(match, tournament, p1Fallback, p2Fallback);
                    });
                } else {
                    koMatches = sortedKo.map((m, idx) => {
                        const p1Id = m.player1?.id || m.player1_id;
                        const p2Id = m.player2?.id || m.player2_id;
                        if (p1Id && p2Id) return m;

                        const wr2MatchNo = layout.wr2.start + idx;
                        const lr2MatchNo = layout.lr2.start + idx;
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
                        const lr2MatchNo = layout.lr2.start + idx;
                        const p1Fallback = `Thắng trận ${wr2MatchNo}`;
                        const p2Fallback = `Thắng trận ${lr2MatchNo}`;
                        return formatMatch(match, tournament, p1Fallback, p2Fallback);
                    });
                }
            } else {
                roundFormattedMatches = formatWinnersRound(koMatches, i === 0, prevKoMatches, "Chờ...");
            }

            knockoutRounds.push({
                title: getRoundLabel("knockout", ko.round, maxKoRound),
                matches: roundFormattedMatches,
            });
            prevKoMatches = koMatches;
        }
    } else {
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

// ---------- Main Page Component ----------
export default function TournamentLivePage() {
    const params = useParams();
    const slug = params?.slug as string;
    const router = useRouter();

    // Fetch tournament details
    const { data: tournament, isLoading: isTourLoading } = useQuery({
        queryKey: ['tournament', slug],
        queryFn: () => tournamentAPI.getTournament(slug).then(r => r.data),
        enabled: !!slug,
    });

    // Fetch tournament matches
    const { data: matches, isLoading: isMatchesLoading } = useQuery({
        queryKey: ['tournament-matches', slug],
        queryFn: () => tournamentAPI.getTournamentMatchesBySlug(slug).then(r => r.data as ApiMatch[]),
        enabled: !!slug,
        refetchInterval: 5000,
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!tournament?.id) return;

        let API_BASE = "";
        if (typeof window !== "undefined") {
            API_BASE = `http://${window.location.hostname}:8000`;
        } else {
            API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        }
        const sseUrl = `${API_BASE}/api/tournaments/${tournament.id}/matches/live`;
        console.log("Connecting to live match updates SSE in live page:", sseUrl);

        const eventSource = new EventSource(sseUrl, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const updatedMatch: ApiMatch = JSON.parse(event.data);
                console.log("Realtime match update received in live page:", updatedMatch);
                
                queryClient.setQueryData(['tournament-matches', slug], (prev: ApiMatch[] | undefined) => {
                    if (!prev) return prev;
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
                console.error("Failed to parse SSE data in live page:", e);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE connection error in live page:", err);
        };

        return () => {
            console.log("Closing live match updates SSE connection in live page");
            eventSource.close();
        };
    }, [tournament?.id, queryClient, slug]);

    const isRedirecting = tournament && tournament.status !== "ongoing";

    useEffect(() => {
        if (tournament && tournament.status !== "ongoing" && !isTourLoading) {
            router.replace(`/tournaments/${slug}`);
        }
    }, [tournament, isTourLoading, router, slug]);

    const isLoading = isTourLoading || isMatchesLoading;

    // Filter and format matches that are ongoing or upcoming
    const activeFormattedMatches = React.useMemo(() => {
        if (!matches) return [];
        
        // Deduplicate matches in case there are duplicates in the DB
        const dedupedAll = dedupeMatches(matches);

        // Group matches using the tournament bracket logic to resolve dynamic players and fallback labels ("Thắng trận X", "Thua trận X")
        const { groupRounds, knockoutRounds } = groupMatches(dedupedAll, tournament);

        // Flatten all formatted matches from all rounds
        const allFormatted = [
            ...groupRounds.flatMap(r => r.matches),
            ...knockoutRounds.flatMap(r => r.matches)
        ];

        // Create a map of match ID to status from the deduplicated list of matches
        const statusMap = new Map(dedupedAll.map(m => [m.id, m.status]));

        return allFormatted
            .filter(m => {
                const status = statusMap.get(m.id);
                return status === 'ongoing' || status === 'upcoming';
            })
            // Only show matches that have at least one player ready
            .filter(m => !m.player1.isBye || !m.player2.isBye)
            .sort((a, b) => {
                // Sort by status first: ongoing (green) before upcoming (yellow)
                const colorOrder = { green: 1, yellow: 2, default: 3 };
                const orderA = colorOrder[a.tableNumberColor] || 3;
                const orderB = colorOrder[b.tableNumberColor] || 3;
                if (orderA !== orderB) return orderA - orderB;

                // Then sort by table number
                const tableA = parseInt(String(a.tableNumber).replace(/[^\d]/g, "")) || 999;
                const tableB = parseInt(String(b.tableNumber).replace(/[^\d]/g, "")) || 999;
                if (tableA !== tableB) return tableA - tableB;

                // Finally sort by match number
                return Number(a.meta.matchNo || 0) - Number(b.meta.matchNo || 0);
            });
    }, [matches, tournament]);

    return (
        <div className="min-h-screen bg-[#F4F7FE] pb-24 font-sans">
            <NavBar />

            <main className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 mt-[48px]">
                {isLoading || isRedirecting ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Spin size="large" />
                        <p className="text-gray-500 font-medium text-sm font-['Montserrat']">
                            {isRedirecting ? "Đang chuyển hướng..." : "Đang tải danh sách trận đấu..."}
                        </p>
                    </div>
                ) : activeFormattedMatches.length === 0 ? (
                    <div className="bg-white p-12 rounded-[16px] text-center shadow-sm border border-gray-100 max-w-md mx-auto mt-12">
                        <div className="text-gray-400 text-lg font-medium mb-2">Hiện không có trận đấu nào sắp diễn ra hoặc đang thi đấu</div>
                        <p className="text-gray-400 text-sm">Vui lòng quay lại sau hoặc xem lịch thi đấu ở phần "Trận đấu".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                        {activeFormattedMatches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                )}
            </main>

            <TournamentNavbar activeTab="live" />
        </div>
    );
}
