"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    TournamentNavbar,
    ChampionshipBanner,
    RoundSection,
} from "@/components";
import NavBar from "@/components/NavBar";
import { tournamentAPI } from "@/api/tournament.api";
import { formatLevel, resolveImageUrl } from "@/lib/tournament-utils";
import MatchCardSkeleton from "@/components/skeletons/MatchCardSkeleton";
import MatchRowSkeleton from "@/components/skeletons/MatchRowSkeleton";

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

    const diff = Math.abs(r1 - r2);
    if (tournament?.category === 'event') {
        if (diff === 0) return "chạm 9";
        if (diff === 1) return "chạm 8 chấp 1";
        return "chạm 13 chấp 2";
    }

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

// ---------- Mobile Match Card Component ----------
const MobileMatchCard: React.FC<{ match: FormattedMatch }> = ({ match }) => {
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

    const displayTableNumber =
        match.tableNumber != null && match.tableNumber !== "" && match.tableNumber !== "-"
            ? `Bàn ${match.tableNumber}`
            : "-";

    const scoreParts = match.score.includes(" vs ") ? match.score.split(" vs ") : null;
    const p1ScoreVal = scoreParts ? scoreParts[0] : match.score;
    const p2ScoreVal = scoreParts ? scoreParts[1] : "";

    return (
        <div className="flex flex-col gap-0 mb-3">
            {/* Meta row */}
            <div className="flex items-center justify-between px-1 pt-2 pb-1 text-xs text-[#37393E] font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                <span>{match.meta.matchNo ? `Trận ${match.meta.matchNo}` : ""}</span>
                <div className="flex items-center gap-1.5">
                    {match.meta.race && (
                        <span className="font-semibold text-emerald-600">{match.meta.race}</span>
                    )}
                    {match.meta.time && (
                        <span>{[match.meta.time, match.meta.date].filter(Boolean).join(", ")}</span>
                    )}
                </div>
            </div>

            {/* Main card */}
            <div
                className="w-full flex items-center rounded-xl overflow-hidden shadow-sm h-[56px]"
                style={{ background: "#172339" }}
            >
                {/* Table pill */}
                <div
                    className="w-[72px] h-full flex items-center justify-center font-bold italic text-xs shrink-0 rounded-l-xl px-1"
                    style={{
                        backgroundColor: tableNumBg,
                        color: tableTextColor,
                        fontFamily: "Montserrat, sans-serif",
                    }}
                >
                    {displayTableNumber}
                </div>

                {/* Match content */}
                <div className="flex-1 flex items-center h-full min-w-0 px-2">
                    {/* Player 1 */}
                    <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 text-right">
                        <span
                            className="truncate text-xs font-semibold"
                            style={{
                                color: match.player1.isWinner ? "#ED1C1F" : (matchHasResult && match.player2.isWinner ? "#ACB3C3" : "#FFFFFF"),
                                fontFamily: "Montserrat, sans-serif",
                            }}
                        >
                            {match.player1.name}{match.player1.rank ? ` - ${formatLevel(match.player1.rank)}` : ""}
                        </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center justify-center px-2 shrink-0 gap-1 text-sm font-bold italic" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        <span style={{ color: match.player1.isWinner ? "#ED1C1F" : "#FFFFFF" }}>{p1ScoreVal}</span>
                        <span className="text-[#8690A7] text-xs font-normal">vs</span>
                        <span style={{ color: match.player2.isWinner ? "#ED1C1F" : "#FFFFFF" }}>{p2ScoreVal}</span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex-1 min-w-0 flex items-center justify-start gap-1.5 text-left">
                        <span
                            className="truncate text-xs font-semibold"
                            style={{
                                color: match.player2.isWinner ? "#ED1C1F" : (matchHasResult && match.player1.isWinner ? "#ACB3C3" : "#FFFFFF"),
                                fontFamily: "Montserrat, sans-serif",
                            }}
                        >
                            {match.player2.name}{match.player2.rank ? ` - ${formatLevel(match.player2.rank)}` : ""}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function EventMatchesPage() {
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

    // Realtime SSE updates
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
                console.error("Failed to parse SSE data in event matches:", e);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [tournament?.id, queryClient, slug]);

    const isLoading = isTourLoading || isMatchesLoading;

    const formattedMatches: FormattedMatch[] = useMemo(() => {
        if (!rawMatches || rawMatches.length === 0) return [];
        // Sort matches by match_no ASC
        const sorted = [...rawMatches].sort((a, b) => a.match_no - b.match_no);
        return sorted.map((m) => formatMatch(m, tournament));
    }, [rawMatches, tournament]);

    return (
        <div className="min-h-screen bg-[#F0F2F4] font-sans">
            <NavBar />

            {/* ===================== DESKTOP ===================== */}
            <div className="hidden sm:block pb-24">
                <main className="w-full max-w-[1360px] mx-auto mt-[48px] flex flex-col gap-[48px]">
                    {/* Championship Banner */}
                    <ChampionshipBanner className="shadow-sm" />

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex flex-col gap-[48px]">
                            <div className="w-full">
                                <div className="bg-[#C6010B]/80 h-[48px] flex items-center px-[22px] rounded-[12px] shadow-sm mb-[8px] animate-pulse">
                                    <div className="w-[120px] h-[20px] bg-red-400/50 rounded" />
                                </div>
                                <div className="flex flex-col gap-[8px]">
                                    {[...Array(4)].map((_, i) => (
                                        <MatchRowSkeleton key={i} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : formattedMatches.length > 0 ? (
                        <div className="flex flex-col gap-[48px]">
                            <RoundSection
                                title="DANH SÁCH TRẬN ĐẤU"
                                matches={formattedMatches as any}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl p-8 shadow-sm">
                            Chưa có trận đấu nào trong sự kiện này
                        </div>
                    )}
                </main>
            </div>

            {/* ===================== MOBILE ===================== */}
            <div className="block sm:hidden pb-[80px]">
                {/* Championship Banner */}
                <div className="px-4 mt-4">
                    <ChampionshipBanner className="!h-auto" style={{ aspectRatio: '361 / 74' }} />
                </div>

                {/* Match content */}
                <div className="px-4 pt-4">
                    {isLoading ? (
                        <div className="flex flex-col gap-[32px] py-4">
                            <div className="w-full">
                                <div className="bg-[#C6010B]/80 h-[40px] flex items-center px-[16px] rounded-[10px] shadow-sm mb-[6px] animate-pulse">
                                    <div className="w-[100px] h-[16px] bg-red-400/50 rounded" />
                                </div>
                                <div className="flex flex-col gap-[8px]">
                                    {[...Array(3)].map((_, i) => (
                                        <MatchRowSkeleton key={i} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : formattedMatches.length > 0 ? (
                        <div className="flex flex-col gap-0">
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
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    DANH SÁCH TRẬN ĐẤU
                                </span>
                            </div>

                            {/* Match list */}
                            <div className="flex flex-col gap-0">
                                {formattedMatches.map((match) => (
                                    <MobileMatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl p-6 shadow-sm">
                            Chưa có trận đấu nào trong sự kiện này
                        </div>
                    )}
                </div>
            </div>

            <TournamentNavbar activeTab="matches" isEvent={true} />
        </div>
    );
}
