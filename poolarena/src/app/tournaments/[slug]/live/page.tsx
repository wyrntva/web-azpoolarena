"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
    if (match.status === "upcoming" || match.status === "pending") return "yellow";
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

function buildScoreString(match: ApiMatch): string {
    const p1Id = (match.player1 && match.player1.id) || match.player1_id;
    const p2Id = (match.player2 && match.player2.id) || match.player2_id;

    if (match.status === "pending" || match.status === "upcoming") {
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

    return `${match.player1_score} vs ${match.player2_score}`;
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
    const nested = match[side];
    if (nested && nested.rank) return nested.rank;
    return match[`${side}_rank` as 'player1_rank' | 'player2_rank'];
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
        score: buildScoreString(match),
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

// ---------- Main Page Component ----------
export default function TournamentLivePage() {
    const params = useParams();
    const slug = params?.slug as string;

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
        refetchInterval: 10000,
    });

    const isLoading = isTourLoading || isMatchesLoading;

    // Filter and format matches that are ongoing, upcoming, or pending
    const activeFormattedMatches = React.useMemo(() => {
        if (!matches) return [];
        return matches
            .filter(m => m.status === 'ongoing' || m.status === 'upcoming' || m.status === 'pending')
            .map(m => formatMatch(m, tournament))
            .sort((a, b) => {
                // Parse table numbers for sorting
                const tableA = parseInt(String(a.tableNumber).replace(/[^\d]/g, "")) || 999;
                const tableB = parseInt(String(b.tableNumber).replace(/[^\d]/g, "")) || 999;
                if (tableA !== tableB) return tableA - tableB;
                return Number(a.meta.matchNo || 0) - Number(b.meta.matchNo || 0);
            });
    }, [matches, tournament]);

    return (
        <div className="min-h-screen bg-[#F4F7FE] pb-24 font-sans">
            <NavBar />

            <main className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 mt-[48px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Spin size="large" />
                        <p className="text-gray-500 font-medium text-sm font-['Montserrat']">Đang tải danh sách trận đấu...</p>
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
