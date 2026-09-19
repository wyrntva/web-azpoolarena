"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TournamentNavbar } from "@/components";
import NavBar from "@/components/NavBar";
import MatchCardSkeleton from "@/components/skeletons/MatchCardSkeleton";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl, formatLevel } from "@/lib/tournament-utils";

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
    race_to?: number | string | null;
    handicap_desc?: string | null;
    table_no: string | null;
    match_time: string | null;
    status: string;
    player1_check_in?: string;
    player2_check_in?: string;
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

const RANK_ORDER = ['K', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];

function getRankIndex(rank?: string | null): number {
    if (!rank) return -1;
    return RANK_ORDER.indexOf(rank.toUpperCase());
}

function computeRaceText(
    p1Rank?: string | null,
    p2Rank?: string | null,
    tournament?: any,
): string {
    if (!p1Rank || !p2Rank) return "";
    const r1 = getRankIndex(p1Rank);
    const r2 = getRankIndex(p2Rank);
    if (r1 < 0 || r2 < 0) return "";

    if (tournament?.category === 'event') {
        return "";
    }

    const diff = Math.abs(r1 - r2);
    let raceTo = 0;
    let handicap = 0;

    if (diff === 0) {
        raceTo = parseInt(tournament?.draw_touch || '0', 10) || 0;
        handicap = 0;
    } else if (diff === 1) {
        raceTo = parseInt(tournament?.handicap_1_touch || '0', 10) || 0;
        handicap = 1;
    } else {
        raceTo = parseInt(tournament?.handicap_2_touch || '0', 10) || 0;
        handicap = 2;
    }

    if (!raceTo) return "";
    if (handicap === 0) return `chạm ${raceTo}`;
    return `chạm ${raceTo} chấp ${handicap}`;
}

function formatMatchTime(matchTime: string | null): { time: string; date: string } {
    if (!matchTime) return { time: "", date: "" };
    try {
        const dt = new Date(matchTime);
        const time = dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        const date = dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        return { time, date };
    } catch {
        return { time: "", date: "" };
    }
}

function formatMatch(match: ApiMatch, tournament: any): FormattedMatch {
    const p1Id = (match.player1 && match.player1.id) || match.player1_id;
    const p2Id = (match.player2 && match.player2.id) || match.player2_id;
    const p1Name = (match.player1 && match.player1.full_name) || match.player1_name || "Chờ đấu thủ";
    const p2Name = (match.player2 && match.player2.full_name) || match.player2_name || "Chờ đấu thủ";
    const p1Avatar = (match.player1 && match.player1.avatar_url) || match.player1_avatar;
    const p2Avatar = (match.player2 && match.player2.avatar_url) || match.player2_avatar;
    const p1Rank = match.player1_rank || (match.player1 && match.player1.rank);
    const p2Rank = match.player2_rank || (match.player2 && match.player2.rank);

    const winnerId = match.winner_id ?? match.winner?.id ?? null;
    const isCompleted = match.status === "completed";
    let p1Winner = isCompleted && winnerId === p1Id;
    let p2Winner = isCompleted && winnerId === p2Id;

    if (match.player1_check_in === "absent") p2Winner = true;
    if (match.player2_check_in === "absent") p1Winner = true;

    const { time, date } = formatMatchTime(match.match_time);

    let color: "default" | "green" | "yellow" = "default";
    if (match.status === "ongoing") color = "green";
    else if (match.status === "upcoming") color = "yellow";

    const tableNumber = match.table_no
        ? match.table_no.replace(/[^\d]/g, "") || match.table_no
        : "-";

    const raceText = match.handicap_desc || (match.race_to ? `chạm ${match.race_to}` : computeRaceText(p1Rank, p2Rank, tournament));

    let scoreStr = " vs ";
    if (match.status !== "pending") {
        if (match.player1_check_in === "absent") scoreStr = "NS vs -";
        else if (match.player2_check_in === "absent") scoreStr = "- vs NS";
        else scoreStr = `${match.player1_score} vs ${match.player2_score}`;
    }

    return {
        id: match.id,
        tableNumber: tableNumber,
        tableNumberColor: color,
        player1: {
            name: p1Name,
            avatar: p1Avatar ? resolveImageUrl(p1Avatar, '') : '',
            rank: p1Rank,
            isWinner: p1Winner,
            isBye: !p1Id,
        },
        player2: {
            name: p2Name,
            avatar: p2Avatar ? resolveImageUrl(p2Avatar, '') : '',
            rank: p2Rank,
            isWinner: p2Winner,
            isBye: !p2Id,
        },
        score: scoreStr,
        meta: {
            matchNo: match.match_no,
            race: raceText || undefined,
            time,
            date,
        },
    };
}

// ---------- MatchCard Component (identical to tournaments live page) ----------
interface MatchCardProps {
    match: FormattedMatch;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
    const matchHasResult = !!match.player1.isWinner || !!match.player2.isWinner;

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
        if (/^\d+$/.test(clean)) {
            clean = `Bàn ${clean}`;
        }

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
        const fullName = `${name}${rank && !isBye ? ` - ${formatLevel(rank)}` : ""}`;
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
                                    className="object-cover shrink-0 rounded-full"
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
                                {match.player1.name}{match.player1.rank && !match.player1.isBye ? ` - ${formatLevel(match.player1.rank)}` : ""}
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
                                    className="object-cover shrink-0 rounded-full"
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
                                {match.player2.name}{match.player2.rank && !match.player2.isBye ? ` - ${formatLevel(match.player2.rank)}` : ""}
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
export default function EventLivePage() {
    const params = useParams();
    const slug = params?.slug as string;
    const queryClient = useQueryClient();

    const { data: tournament, isLoading: isTourLoading } = useQuery({
        queryKey: ['tournament', slug],
        queryFn: () => tournamentAPI.getTournament(slug).then(r => r.data),
        enabled: !!slug,
    });

    const { data: rawMatches = [], isLoading: isMatchesLoading } = useQuery({
        queryKey: ['tournament-matches', slug],
        queryFn: () => tournamentAPI.getTournamentMatchesBySlug(slug).then(r => r.data as ApiMatch[]),
        enabled: !!slug,
    });

    // Real-time SSE updates for live scores
    useEffect(() => {
        if (!tournament?.id) return;

        let API_BASE = "";
        if (typeof window !== "undefined") {
            if (window.location.protocol === "https:") {
                API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://cms.poolarena.vn";
            } else {
                API_BASE = `http://${window.location.hostname}:8000`;
            }
        } else {
            API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        }
        const sseUrl = `${API_BASE}/api/tournaments/${tournament.id}/matches/live`;

        const eventSource = new EventSource(sseUrl, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const updatedMatch: ApiMatch = JSON.parse(event.data);
                queryClient.setQueryData(['tournament-matches', slug], (prev: ApiMatch[] | undefined) => {
                    if (!prev) return prev;
                    const idx = prev.findIndex((m) => m.match_no === updatedMatch.match_no);
                    if (idx !== -1) {
                        const next = [...prev];
                        next[idx] = { ...next[idx], ...updatedMatch };
                        return next;
                    }
                    return [...prev, updatedMatch];
                });
            } catch (e) {
                console.error("SSE parse error in event live:", e);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [tournament?.id, queryClient, slug]);

    const isLoading = isTourLoading || isMatchesLoading;

    // Filter and format matches that are ongoing or upcoming
    const activeFormattedMatches = useMemo(() => {
        if (!rawMatches) return [];

        return rawMatches
            .filter((m) => m.status === 'ongoing' || m.status === 'upcoming')
            .map((m) => formatMatch(m, tournament))
            .sort((a, b) => {
                // Ongoing (green) first, then upcoming (yellow)
                const colorOrder = { green: 1, yellow: 2, default: 3 };
                const orderA = colorOrder[a.tableNumberColor] || 3;
                const orderB = colorOrder[b.tableNumberColor] || 3;
                if (orderA !== orderB) return orderA - orderB;

                // Sort by table number
                const tableA = parseInt(String(a.tableNumber).replace(/[^\d]/g, "")) || 999;
                const tableB = parseInt(String(b.tableNumber).replace(/[^\d]/g, "")) || 999;
                if (tableA !== tableB) return tableA - tableB;

                // Sort by match number
                return Number(a.meta.matchNo || 0) - Number(b.meta.matchNo || 0);
            });
    }, [rawMatches, tournament]);

    return (
        <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
            <NavBar />

            <main className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-0 mt-[48px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <MatchCardSkeleton key={i} />
                        ))}
                    </div>
                ) : activeFormattedMatches.length === 0 ? (
                    <div className="bg-white p-12 rounded-[16px] text-center shadow-sm border border-gray-100 max-w-md mx-auto mt-12">
                        <div className="text-gray-400 text-lg font-medium mb-2">
                            Hiện không có trận đấu nào sắp diễn ra hoặc đang thi đấu
                        </div>
                        <p className="text-gray-400 text-sm">
                            Vui lòng quay lại sau hoặc xem lịch thi đấu ở phần &quot;Trận đấu&quot;.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                        {activeFormattedMatches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                )}
            </main>

            <TournamentNavbar activeTab="live" isEvent={true} />
        </div>
    );
}
