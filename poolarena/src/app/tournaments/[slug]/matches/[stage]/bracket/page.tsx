"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin } from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores/store";
import NavBar from "@/components/NavBar";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl } from "@/lib/tournament-utils";

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
    status: string;
    player1_check_in: string;
    player2_check_in: string;
    winner_id: number | null;
    table_no?: string | null;
    player1?: ApiPlayerNested | null;
    player2?: ApiPlayerNested | null;
    winner?: ApiPlayerNested | null;
}

interface FormattedPlayer {
    id: number | null;
    name: string;
    avatar: string;
    rank: string | null;
    isWinner: boolean;
    isBye: boolean;
}

interface FormattedMatch {
    matchNo: number;
    player1: FormattedPlayer;
    player2: FormattedPlayer;
    score1: string;
    score2: string;
    status: string;
    tableNumber: string;
    tableNumberColor: "default" | "green" | "yellow";
    race: string;
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

const RANK_ORDER = ['K', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];

function getRankIndex(rank?: string | null): number {
    if (!rank) return -1;
    return RANK_ORDER.indexOf(rank.toUpperCase());
}

function formatAvatarUrl(avatarUrl: string | null): string {
    if (!avatarUrl) return "";
    if (avatarUrl.startsWith("http")) return avatarUrl;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${API_BASE}${avatarUrl}`;
}

function getPlayerName(playerId: number | null, playerName: string | null, fallback: string): string {
    if (!playerId) return fallback;
    return playerName || fallback;
}

function computeRaceText(
    p1Rank: string | null,
    p2Rank: string | null,
    tournament: TournamentInfo | null,
    koRoundInfo?: { round: number; maxKoRound: number },
): string {
    if (!tournament) return "";

    if (koRoundInfo && koRoundInfo.maxKoRound > 0) {
        const roundsFromEnd = koRoundInfo.maxKoRound - koRoundInfo.round;
        let koRaceTo: number | null = null;
        if (roundsFromEnd === 0 && tournament.final) koRaceTo = parseInt(tournament.final, 10);
        else if (roundsFromEnd === 1 && tournament.semi_final) koRaceTo = parseInt(tournament.semi_final, 10);
        else if (roundsFromEnd === 2 && tournament.quarter_final) koRaceTo = parseInt(tournament.quarter_final, 10);
        if (koRaceTo) return `Chạm ${koRaceTo}`;
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
    if (handicap === 0) return `Chạm ${raceTo}`;
    return `Chạm ${raceTo} chấp ${handicap}`;
}

// Convert ApiMatch into a clean state for rendering inside the map
function getMatchBracketAndRound(matchNo: number, numberOfPlayers: number): { bracket: string; round: number } {
    if (numberOfPlayers === 24) {
        if (matchNo >= 1 && matchNo <= 8) return { bracket: "winners", round: 1 };
        if (matchNo >= 9 && matchNo <= 16) return { bracket: "winners", round: 2 };
        if (matchNo >= 17 && matchNo <= 24) return { bracket: "losers", round: 1 };
    } else if (numberOfPlayers > 32) { // 64 players
        if (matchNo >= 1 && matchNo <= 32) return { bracket: "winners", round: 1 };
        if (matchNo >= 33 && matchNo <= 48) return { bracket: "losers", round: 1 };
        if (matchNo >= 49 && matchNo <= 64) return { bracket: "winners", round: 2 };
        if (matchNo >= 65 && matchNo <= 80) return { bracket: "losers", round: 2 };
    } else if (numberOfPlayers > 16) { // 32 players
        if (matchNo >= 1 && matchNo <= 16) return { bracket: "winners", round: 1 };
        if (matchNo >= 17 && matchNo <= 24) return { bracket: "losers", round: 1 };
        if (matchNo >= 25 && matchNo <= 32) return { bracket: "winners", round: 2 };
        if (matchNo >= 33 && matchNo <= 40) return { bracket: "losers", round: 2 };
    } else { // 16 players
        if (matchNo >= 1 && matchNo <= 8) return { bracket: "winners", round: 1 };
        if (matchNo >= 9 && matchNo <= 12) return { bracket: "losers", round: 1 };
        if (matchNo >= 13 && matchNo <= 16) return { bracket: "winners", round: 2 };
        if (matchNo >= 17 && matchNo <= 20) return { bracket: "losers", round: 2 };
    }
    return { bracket: "knockout", round: 1 }; // fallback
}

function getFallbackPlayerName(
    matchNo: number,
    slot: 1 | 2,
    numberOfPlayers: number,
    bracket: string,
    round: number
): string {
    if (round === 1 && bracket === "winners") {
        return "Bye";
    }

    if (round === 1 && bracket === "knockout") {
        if (numberOfPlayers === 24) {
            if (matchNo >= 25 && matchNo <= 32) {
                const idx = matchNo - 25;
                if (slot === 1) return `Thắng trận ${9 + idx}`;
                return `Thắng trận ${17 + idx}`;
            }
        } else {
            const size = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
            if (size === 16 && matchNo >= 21 && matchNo <= 24) {
                const idx = matchNo - 21;
                if (slot === 1) return `Thắng trận ${13 + idx}`;
                const mapping = [19, 20, 17, 18];
                return `Thắng trận ${mapping[idx]}`;
            }
            if (size === 32 && matchNo >= 41 && matchNo <= 48) {
                const idx = matchNo - 41;
                if (slot === 1) return `Thắng trận ${25 + idx}`;
                return `Thắng trận ${33 + idx}`;
            }
            if (size === 64 && matchNo >= 81 && matchNo <= 96) {
                const idx = matchNo - 81;
                if (slot === 1) return `Thắng trận ${49 + idx}`;
                return `Thắng trận ${65 + idx}`;
            }
        }
        return "Bye";
    }

    if (numberOfPlayers === 24) {
        if (bracket === "winners") {
            if (round === 2) {
                if (slot === 1) {
                    return `Thắng trận ${matchNo - 8}`;
                }
                return "Chờ...";
            }
        } else if (bracket === "losers") {
            if (round === 1) {
                if (slot === 1) {
                    return `Thua trận ${33 - matchNo}`;
                } else {
                    return `Thua trận ${matchNo - 16}`;
                }
            }
        }
        return "Chờ...";
    }

    // For other sizes (16, 32, 64)
    if (bracket === "winners") {
        if (round === 2) {
            const size = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
            const wr2Start = size === 64 ? 49 : size === 32 ? 25 : 13;
            const wr1Start = 1;
            const idx = matchNo - wr2Start;
            const src1 = wr1Start + 2 * idx;
            const src2 = wr1Start + 2 * idx + 1;
            return `Thắng trận ${slot === 1 ? src1 : src2}`;
        }
    } else if (bracket === "losers") {
        if (round === 1) {
            const size = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
            const lr1Start = size === 64 ? 33 : size === 32 ? 17 : 9;
            const wr1Start = 1;
            const idx = matchNo - lr1Start;
            const src1 = wr1Start + 2 * idx;
            const src2 = wr1Start + 2 * idx + 1;
            return `Thua trận ${slot === 1 ? src1 : src2}`;
        } else if (round === 2) {
            const size = numberOfPlayers > 32 ? 64 : numberOfPlayers > 16 ? 32 : 16;
            const lr2Start = size === 64 ? 65 : size === 32 ? 33 : 17;
            const lr1Start = size === 64 ? 33 : size === 32 ? 17 : 9;
            const wr2Start = size === 64 ? 49 : size === 32 ? 25 : 13;
            const wr2Count = size === 64 ? 16 : size === 32 ? 8 : 4;
            const idx = matchNo - lr2Start;
            if (slot === 1) {
                return `Thắng trận ${lr1Start + idx}`;
            } else {
                return `Thua trận ${wr2Start + wr2Count - 1 - idx}`;
            }
        }
    }

    return "Chờ...";
}

// Convert ApiMatch into a clean state for rendering inside the map
function parseMatch(match: ApiMatch | undefined, matchNo: number, tournament: TournamentInfo | null): FormattedMatch {
    const numPlayers = tournament?.number_of_players || 16;
    const { bracket: derivedBracket, round: derivedRound } = getMatchBracketAndRound(matchNo, numPlayers);
    const bracket = match?.bracket || derivedBracket;
    const round = match?.round || derivedRound;

    const p1Fallback = getFallbackPlayerName(matchNo, 1, numPlayers, bracket, round);
    const p2Fallback = getFallbackPlayerName(matchNo, 2, numPlayers, bracket, round);

    const isRegistrationClosed = tournament?.registration_end_date
        ? new Date() > new Date(tournament.registration_end_date)
        : false;

    const resolvedP1Fallback = (!isRegistrationClosed && p1Fallback === "Bye") ? "Chờ đăng ký" : p1Fallback;
    const resolvedP2Fallback = (!isRegistrationClosed && p2Fallback === "Bye") ? "Chờ đăng ký" : p2Fallback;

    if (!match) {
        return {
            matchNo,
            player1: { id: null, name: resolvedP1Fallback, avatar: "", rank: null, isWinner: false, isBye: resolvedP1Fallback === "Bye" || resolvedP1Fallback === "Chờ đăng ký" },
            player2: { id: null, name: resolvedP2Fallback, avatar: "", rank: null, isWinner: false, isBye: resolvedP2Fallback === "Bye" || resolvedP2Fallback === "Chờ đăng ký" },
            score1: "-",
            score2: "-",
            status: "pending",
            tableNumber: "-",
            tableNumberColor: "default",
            race: ""
        };
    }

    const p1Id = match.player1?.id || match.player1_id;
    const p2Id = match.player2?.id || match.player2_id;
    const p1Name = match.player1?.full_name || match.player1_name;
    const p2Name = match.player2?.full_name || match.player2_name;
    const p1Avatar = match.player1?.avatar_url || match.player1_avatar;
    const p2Avatar = match.player2?.avatar_url || match.player2_avatar;
    const p1Rank = match.player1_rank || match.player1?.rank || null;
    const p2Rank = match.player2_rank || match.player2?.rank || null;
    const winnerId = match.winner_id ?? match.winner?.id ?? null;

    const isCompleted = match.status === "completed";
    let p1Winner = isCompleted && winnerId === p1Id;
    let p2Winner = isCompleted && winnerId === p2Id;

    if (match.player1_check_in === "absent") p2Winner = true;
    if (match.player2_check_in === "absent") p1Winner = true;

    // Apply handicap head start for upcoming/ongoing when score is 0-0
    let s1 = match.player1_score;
    let s2 = match.player2_score;
    if (s1 === 0 && s2 === 0 && (match.status === "upcoming" || match.status === "ongoing") && p1Rank && p2Rank) {
        const r1 = getRankIndex(p1Rank);
        const r2 = getRankIndex(p2Rank);
        if (r1 >= 0 && r2 >= 0 && r1 !== r2) {
            const headStart = Math.abs(r1 - r2) === 1 ? 1 : 2;
            if (r1 < r2) s1 = headStart;
            else s2 = headStart;
        }
    }

    const isMatchActiveOrCompleted =
        match.status === "upcoming" ||
        match.status === "ongoing" ||
        match.status === "completed";
    const isFirstRound = match.round === 1 && (match.bracket === "winners" || match.bracket === "knockout");
    const showTable = isMatchActiveOrCompleted || isFirstRound;

    const tableNumber = showTable && match.table_no
        ? match.table_no.replace(/[^\d]/g, "") || match.table_no
        : "-";

    const tableNumberColor = match.status === "ongoing"
        ? "green"
        : match.status === "upcoming"
            ? "yellow"
            : "default";

    const raceText = showTable ? computeRaceText(p1Rank, p2Rank, tournament) : "";

    return {
        matchNo: match.match_no,
        player1: {
            id: p1Id,
            name: getPlayerName(p1Id, p1Name, resolvedP1Fallback),
            avatar: formatAvatarUrl(p1Avatar),
            rank: p1Rank,
            isWinner: p1Winner,
            isBye: !p1Id && (resolvedP1Fallback === "Bye" || resolvedP1Fallback === "Chờ đăng ký")
        },
        player2: {
            id: p2Id,
            name: getPlayerName(p2Id, p2Name, resolvedP2Fallback),
            avatar: formatAvatarUrl(p2Avatar),
            rank: p2Rank,
            isWinner: p2Winner,
            isBye: !p2Id && (resolvedP2Fallback === "Bye" || resolvedP2Fallback === "Chờ đăng ký")
        },
        score1: match.status === "pending" ? "-" : String(s1),
        score2: match.status === "pending" ? "-" : String(s2),
        status: match.status,
        tableNumber,
        tableNumberColor,
        race: raceText
    };
}

// Bracket Match Card — 100% copy layout/dimensions từ MobileMatchCard
const BracketMatchCard: React.FC<{ match: FormattedMatch }> = ({ match }) => {
    const matchHasResult = !!match.player1.isWinner || !!match.player2.isWinner;

    // Table number box color — copied 1:1 from MobileMatchCard
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

    // Score color — copied 1:1
    const getScoreColor = (isWinner?: boolean, opponentWinner?: boolean) => {
        if (!matchHasResult) return "#FFFFFF";
        if (isWinner) return "#ED1C1F";
        if (opponentWinner) return "#ACB3C3";
        return "#FFFFFF";
    };

    // Player name color — copied 1:1 (no isFinal in bracket)
    const getPlayerNameColor = (isWinner?: boolean, opponentWinner?: boolean) => {
        if (!matchHasResult) return "#FFFFFF";
        if (matchHasResult && !isWinner && opponentWinner) return "#ACB3C3";
        return "#FFFFFF";
    };

    // Player name weight — copied 1:1
    const getPlayerNameWeight = (isWinner?: boolean, isBye?: boolean) => {
        if (isBye) return 400;
        return isWinner ? 700 : 500;
    };

    // renderTableNumber — copied 1:1 from MobileMatchCard (72px pill)
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

    return (
        <div className="w-full max-w-[358px] self-center" style={{ flexShrink: 0, flexGrow: 0, display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Meta row — copied 1:1 from MobileMatchCard */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "4px", paddingRight: "4px", paddingTop: "8px", paddingBottom: "4px" }}>
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
                    {match.matchNo ? `Trận ${match.matchNo}` : ""}
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
                    {match.race || ""}
                </span>
            </div>

            {/* Card — exactly 358×80px, borderRadius 12px, gradient 72px */}
            <div className="w-full max-w-[358px]" style={{ height: "80px", borderRadius: "12px", background: "linear-gradient(to right, transparent 72px, #172339 72px)", display: "flex", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
                {/* Table number box — exactly 72px wide */}
                <div
                    style={{
                        display: "flex",
                        width: "72px",
                        minWidth: "72px",
                        padding: "4px",
                        justifyContent: "center",
                        alignItems: "center",
                        alignSelf: "stretch",
                        background: tableNumBg,
                        color: tableTextColor,
                        fontFamily: "Montserrat, sans-serif",
                        textAlign: "center",
                        borderTopLeftRadius: "12px",
                        borderBottomLeftRadius: "12px",
                        transition: "background 0.5s ease-in-out, color 0.5s ease-in-out",
                    }}
                >
                    {renderTableNumber(displayTableNumber)}
                </div>

                {/* Players column — exactly 286px (= 358 - 72), no flex grow/shrink ambiguity */}
                <div className="flex-1 min-w-0" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", background: "#172339" }}>
                    {/* Player 1 row — 286×40px */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "40px", paddingLeft: "8px", paddingRight: "12px", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: "1 1 0", overflow: "hidden" }}>
                            {!match.player1.isBye && (
                                <img
                                    src={match.player1.avatar || "/images/generic-profile_mini_dcryfs.webp"}
                                    alt={match.player1.name}
                                    style={{ width: "26px", height: "26px", objectFit: "cover", flexShrink: 0 }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/images/generic-profile_mini_dcryfs.webp";
                                    }}
                                />
                            )}
                            <span
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: getPlayerNameWeight(match.player1.isWinner, match.player1.isBye),
                                    color: getPlayerNameColor(match.player1.isWinner, match.player2.isWinner),
                                    lineHeight: "20px",
                                    fontStyle: match.player1.isBye ? "italic" : "normal",
                                    paddingRight: match.player1.isBye ? "4px" : "0px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    minWidth: 0,
                                }}
                            >
                                {match.player1.name}{match.player1.rank && !match.player1.isBye ? ` - ${match.player1.rank}` : ""}
                            </span>
                        </div>
                        <div style={{
                            borderRadius: '6px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            flexGrow: 0,
                        }}>
                            <span
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "18px",
                                    fontStyle: "italic",
                                    fontWeight: 700,
                                    lineHeight: "24px",
                                    color: getScoreColor(match.player1.isWinner, match.player2.isWinner),
                                    minWidth: "20px",
                                    textAlign: "right",
                                    display: "block",
                                }}
                            >
                                {match.score1}
                            </span>
                        </div>
                    </div>

                    {/* Player 2 row — 286×40px */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "40px", paddingLeft: "8px", paddingRight: "12px", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: "1 1 0", overflow: "hidden" }}>
                            {!match.player2.isBye && (
                                <img
                                    src={match.player2.avatar || "/images/generic-profile_mini_dcryfs.webp"}
                                    alt={match.player2.name}
                                    style={{ width: "26px", height: "26px", objectFit: "cover", flexShrink: 0 }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/images/generic-profile_mini_dcryfs.webp";
                                    }}
                                />
                            )}
                            <span
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: getPlayerNameWeight(match.player2.isWinner, match.player2.isBye),
                                    color: getPlayerNameColor(match.player2.isWinner, match.player1.isWinner),
                                    lineHeight: "20px",
                                    fontStyle: match.player2.isBye ? "italic" : "normal",
                                    paddingRight: match.player2.isBye ? "4px" : "0px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    minWidth: 0,
                                }}
                            >
                                {match.player2.name}{match.player2.rank && !match.player2.isBye ? ` - ${match.player2.rank}` : ""}
                            </span>
                        </div>
                        <div style={{
                            borderRadius: '6px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            flexGrow: 0,
                        }}>
                            <span
                                style={{
                                    fontFamily: "Montserrat, sans-serif",
                                    fontSize: "18px",
                                    fontStyle: "italic",
                                    fontWeight: 700,
                                    lineHeight: "24px",
                                    color: getScoreColor(match.player2.isWinner, match.player1.isWinner),
                                    minWidth: "20px",
                                    textAlign: "right",
                                    display: "block",
                                }}
                            >
                                {match.score2}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Winners Block containing Winners R1 (2 matches) feeding into Winners R2 (1 match)

const WinnersBlock: React.FC<{ match1: FormattedMatch; match2: FormattedMatch; nextMatch: FormattedMatch }> = ({
    match1,
    match2,
    nextMatch
}) => {
    return (
        <div className="flex items-center gap-8 bg-transparent">
            {/* Feeders Column */}
            <div className="flex flex-col gap-6 shrink-0">
                <BracketMatchCard match={match1} />
                <BracketMatchCard match={match2} />
            </div>

            {/* Connecting lines */}
            <div className="hidden sm:flex items-center relative h-[240px] w-8">
                {/* Horizontal lines from cards — card center = meta(28px) + half card(40px) = 68px */}
                <div className="absolute top-[68px] left-0 w-4 h-[2px] bg-slate-300"></div>
                {/* Card 2 center = card1(108px) + gap(24px) + meta(28px) + half(40px) = 200px */}
                <div className="absolute top-[200px] left-0 w-4 h-[2px] bg-slate-300"></div>
                {/* Vertical join line */}
                <div className="absolute top-[68px] h-[132px] left-4 w-[2px] bg-slate-300"></div>
                {/* Output horizontal line at midpoint */}
                <div className="absolute top-[134px] left-4 w-4 h-[2px] bg-slate-300"></div>
            </div>

            {/* Next Match Column */}
            <BracketMatchCard match={nextMatch} />
        </div>
    );
};

// Empty Winners Block containing a placeholder on the left to align with WinnersBlock
const EmptyWinnersBlock: React.FC<{ match: FormattedMatch }> = ({ match }) => {
    return (
        <div className="flex items-center gap-8 bg-transparent">
            {/* Feeders Column Placeholder */}
            <div className="w-[358px] h-[240px] shrink-0"></div>

            {/* Connecting lines Placeholder */}
            <div className="hidden sm:block w-8 shrink-0"></div>

            {/* Next Match Column */}
            <BracketMatchCard match={match} />
        </div>
    );
};

// Losers Column Block (groups 2 matches to match WinnersBlock height)
const LosersColumnBlock: React.FC<{ match1: FormattedMatch; match2: FormattedMatch }> = ({
    match1,
    match2
}) => {
    return (
        <div className="flex flex-col gap-6 bg-transparent">
            <BracketMatchCard match={match1} />
            <BracketMatchCard match={match2} />
        </div>
    );
};

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

function getRoundLabel(bracket: string, round: number, maxRound: number): string {
    if (bracket === "knockout") {
        if (round === maxRound) return "Chung kết";
        if (round === maxRound - 1) return "Bán kết";
        if (round === maxRound - 2) return "Tứ kết";
        return `Vòng ${round}`;
    }
    return `Vòng ${round}`;
}

export default function TournamentStageBracketPage() {
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
            : String(params.stage || "1");

    const user = useSelector((state: RootState) => state.auth.user);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

    const [loading, setLoading] = useState(true);
    const [rawMatches, setRawMatches] = useState<ApiMatch[]>([]);
    const [tournamentData, setTournamentData] = useState<any>(null);

    // Fetch tournament data
    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        Promise.all([
            tournamentAPI.getTournament(slug).catch(() => ({ data: null })),
            tournamentAPI.getTournamentMatchesBySlug(slug),
        ])
            .then(([tournamentRes, matchesRes]) => {
                setTournamentData(tournamentRes.data || null);
                setRawMatches(matchesRes.data || []);
            })
            .catch((err) => {
                console.error("Failed to fetch matches for map:", err);
            })
            .finally(() => setLoading(false));
    }, [slug]);

    // Check user registration
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

    const isRevealedPhase = useMemo(() => {
        if (!tournamentData) return false;
        const closed = tournamentData.registration_end_date
            ? new Date() > new Date(tournamentData.registration_end_date)
            : false;
        const full = (tournamentData.registration_count ?? 0) >= (tournamentData.number_of_players ?? Infinity);
        return closed || full;
    }, [tournamentData]);

    const canAccess = isRevealedPhase || isRegistered;

    useEffect(() => {
        if (isRegistered === false && !isRevealedPhase && !loading) {
            router.replace(`/tournaments/${slug}`);
        }
    }, [isRegistered, isRevealedPhase, loading, router, slug]);

    // Map matches by match_no
    const matchByNo = useMemo(() => {
        const map = new Map<number, ApiMatch>();
        for (const m of rawMatches) {
            map.set(m.match_no, m);
        }
        return map;
    }, [rawMatches]);

    // Compute knockout single elimination structure
    const knockoutRounds = useMemo(() => {
        if (!tournamentData || stageParam !== "2") return [];
        const numPlayers = tournamentData.number_of_players || 16;
        const layout = getBracketLayout(numPlayers);

        return layout.knockout.map((ko) => {
            const roundMatches: ApiMatch[] = [];
            for (let i = 0; i < ko.count; i++) {
                const mNo = ko.start + i;
                const match = matchByNo.get(mNo);
                roundMatches.push(match || {
                    id: mNo,
                    tournament_id: tournamentData.id,
                    match_no: mNo,
                    bracket: "knockout",
                    round: ko.round,
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
                    status: "pending",
                    player1_check_in: "pending",
                    player2_check_in: "pending",
                    winner_id: null
                });
            }
            return {
                roundNo: ko.round,
                title: getRoundLabel("knockout", ko.round, layout.knockout.length),
                matches: roundMatches.map(m => parseMatch(m, m.match_no, tournamentData))
            };
        });
    }, [tournamentData, matchByNo, stageParam]);

    // Calculate maximum matches in single round to scale height of single elimination bracket tree
    const maxMatchesInRound = useMemo(() => {
        if (knockoutRounds.length === 0) return 0;
        return Math.max(...knockoutRounds.map(r => r.matches.length));
    }, [knockoutRounds]);

    const knockoutBracketHeight = useMemo(() => {
        if (maxMatchesInRound === 0) return 600;
        return Math.max(600, maxMatchesInRound * 95);
    }, [maxMatchesInRound]);

    const logoUrl = useMemo(() => {
        if (!tournamentData) return "/images/logo-dark.png";
        return resolveImageUrl(
            tournamentData.detail_logo || tournamentData.logo,
            "/images/logo-dark.png"
        );
    }, [tournamentData]);

    // Render loading state
    if (loading || isRegistered === null) {
        return (
            <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Đang tải sơ đồ...
                    </p>
                </div>
            </div>
        );
    }

    if (!canAccess) {
        return (
            <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center">
                <div className="bg-[#172339] p-8 rounded-2xl text-center max-w-[360px]">
                    <div className="text-4xl mb-3">🔒</div>
                    <p className="text-white text-lg font-bold mb-2">Bạn chưa đăng ký giải đấu này</p>
                    <p className="text-gray-400 text-sm">Chỉ người tham gia mới có thể xem sơ đồ giải đấu.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e8e8e8] font-sans pb-12">
            <NavBar logoUrl={logoUrl} />
            <main className="w-full max-w-[1640px] mx-auto px-4 md:px-6 pt-6 flex flex-col gap-6">

                {/* Map Display area */}
                <div className="w-full min-h-[600px] overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: "thin" }}>
                    {stageParam === "1" ? (
                        /* Stage 1: 4-column layout side-by-side with SVG connectors */
                        <div className="flex py-4 min-w-full md:justify-center gap-0">
                            {(() => {
                                const layout = getBracketLayout(tournamentData?.number_of_players || 16);
                                const is24 = tournamentData?.number_of_players === 24;

                                if (is24) {
                                    return (
                                        <>
                                            {/* Column 1: Vòng 1 */}
                                            <div className="flex flex-col gap-6 w-[calc(100vw-32px)] md:w-[358px] items-stretch snap-center shrink-0">
                                                <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-2 self-center">
                                                    Vòng 1
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    {Array.from({ length: layout.wr1.count }).map((_, i) => {
                                                        const mNo = layout.wr1.start + i;
                                                        const m = parseMatch(matchByNo.get(mNo), mNo, tournamentData);
                                                        return <BracketMatchCard key={mNo} match={m} />;
                                                    })}
                                                </div>
                                            </div>

                                            {/* Left Connectors: Vòng 1 to Vòng 2 Nhánh thắng */}
                                            <div className="flex flex-col gap-3 w-[50px] shrink-0 pt-[80px]">
                                                {Array.from({ length: layout.wr2.count }).map((_, i) => (
                                                    <div key={i} className="h-[108px] flex items-center justify-center shrink-0">
                                                        <svg width="50" height="108" viewBox="0 0 50 108" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M0 68 H50" stroke="#37393E" strokeWidth="1.5" />
                                                        </svg>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Column 2: Vòng 2 Nhánh thắng */}
                                            <div className="flex flex-col gap-6 w-[calc(100vw-32px)] md:w-[358px] items-stretch snap-center shrink-0">
                                                <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-2 self-center">
                                                    Vòng 2: Nhánh thắng
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    {Array.from({ length: layout.wr2.count }).map((_, i) => {
                                                        const mNo = layout.wr2.start + i;
                                                        const m = parseMatch(matchByNo.get(mNo), mNo, tournamentData);
                                                        return <BracketMatchCard key={mNo} match={m} />;
                                                    })}
                                                </div>
                                            </div>

                                            {/* Right Connectors: Vòng 2 Nhánh thắng to Vòng 1 Nhánh thua */}
                                            <div className="flex flex-col gap-3 w-[50px] shrink-0 pt-[80px]">
                                                {Array.from({ length: layout.lr1.count }).map((_, i) => (
                                                    <div key={i} className="h-[108px] flex items-center justify-center shrink-0">
                                                        <svg width="50" height="108" viewBox="0 0 50 108" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M0 68 H50" stroke="#37393E" strokeWidth="1.5" />
                                                        </svg>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Column 3: Vòng 1 Nhánh thua */}
                                            <div className="flex flex-col gap-6 w-[calc(100vw-32px)] md:w-[358px] items-stretch snap-center shrink-0">
                                                <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-2 self-center">
                                                    Vòng 1: Nhánh thua
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    {Array.from({ length: layout.lr1.count }).map((_, i) => {
                                                        const mNo = layout.lr1.start + i;
                                                        const m = parseMatch(matchByNo.get(mNo), mNo, tournamentData);
                                                        return <BracketMatchCard key={mNo} match={m} />;
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    );
                                }

                                return (
                                    <>
                                        {/* Column 1: Vòng 2 Nhánh thắng */}
                                        <div className="flex flex-col gap-6 w-[calc(100vw-32px)] md:w-[358px] items-stretch snap-center shrink-0">
                                            <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-2 self-center">
                                                Vòng 2: Nhánh thắng
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {Array.from({ length: layout.wr2.count }).map((_, i) => {
                                                    const mNo = layout.wr2.start + i;
                                                    const m = parseMatch(matchByNo.get(mNo), mNo, tournamentData);
                                                    return (
                                                        <div key={mNo} className="h-[228px] flex flex-col justify-center shrink-0 items-center">
                                                            <BracketMatchCard match={m} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Left Connectors: Vòng 1 to Vòng 2 Nhánh thắng */}
                                        <div className="flex flex-col gap-3 w-[50px] shrink-0 pt-[80px]">
                                            {Array.from({ length: layout.wr2.count }).map((_, i) => (
                                                <div key={i} className="h-[228px] flex items-center justify-center shrink-0">
                                                    <svg width="50" height="228" viewBox="0 0 50 228" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M50 68 H25 V188 H50 M25 128 H0" stroke="#37393E" strokeWidth="1.5" />
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Column 2: Vòng 1 */}
                                        <div className="flex flex-col gap-6 w-[calc(100vw-32px)] md:w-[358px] items-stretch snap-center shrink-0">
                                            <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-2 self-center">
                                                Vòng 1
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {Array.from({ length: layout.wr1.count }).map((_, i) => {
                                                    const mNo = layout.wr1.start + i;
                                                    const m = parseMatch(matchByNo.get(mNo), mNo, tournamentData);
                                                    return <BracketMatchCard key={mNo} match={m} />;
                                                })}
                                            </div>
                                        </div>

                                        {/* Right Connectors: Vòng 1 to Vòng 1 Nhánh thua */}
                                        <div className="flex flex-col gap-3 w-[50px] shrink-0 pt-[80px]">
                                            {Array.from({ length: layout.lr1.count }).map((_, i) => (
                                                <div key={i} className="h-[228px] flex items-center justify-center shrink-0">
                                                    <svg width="50" height="228" viewBox="0 0 50 228" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M0 68 H25 V188 H0 M25 128 H50" stroke="#37393E" strokeWidth="1.5" />
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Column 3: Vòng 1 Nhánh thua */}
                                        <div className="flex flex-col gap-6 w-[calc(100vw-32px)] md:w-[358px] items-stretch snap-center shrink-0">
                                            <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-2 self-center">
                                                Vòng 1: Nhánh thua
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {Array.from({ length: layout.lr1.count }).map((_, i) => {
                                                    const mNo = layout.lr1.start + i;
                                                    const m = parseMatch(matchByNo.get(mNo), mNo, tournamentData);
                                                    return (
                                                        <div key={mNo} className="h-[228px] flex flex-col justify-center shrink-0 items-center">
                                                            <BracketMatchCard match={m} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Connectors: Vòng 1 Nhánh thua to Vòng 2 Nhánh thua */}
                                        {(() => {
                                            if (!layout.lr2 || layout.lr2.count === 0) return null;
                                            return (
                                                <div className="flex flex-col gap-3 w-[50px] shrink-0 pt-[80px]">
                                                    {Array.from({ length: layout.lr2.count }).map((_, i) => (
                                                        <div key={i} className="h-[228px] flex items-center justify-center shrink-0">
                                                            <svg width="50" height="228" viewBox="0 0 50 228" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 128 H50" stroke="#37393E" strokeWidth="1.5" />
                                                            </svg>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        {/* Column 4: Vòng 2 Nhánh thua */}
                                        {(() => {
                                            if (!layout.lr2 || layout.lr2.count === 0) return null;
                                            return (
                                                <div className="flex flex-col gap-6 w-[calc(100vw-32px)] md:w-[358px] items-stretch snap-center shrink-0">
                                                    <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-2 self-center">
                                                        Vòng 2: Nhánh thua
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        {Array.from({ length: layout.lr2.count }).map((_, i) => {
                                                            const mNo = layout.lr2.start + i;
                                                            const m = parseMatch(matchByNo.get(mNo), mNo, tournamentData);
                                                            return (
                                                                <div key={mNo} className="h-[228px] flex flex-col justify-center shrink-0 items-center">
                                                                    <BracketMatchCard match={m} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        /* Stage 2: Single Elimination Playoff/Knockout Bracket Map */
                        <div 
                            className="flex gap-0 py-4 justify-start md:justify-center min-w-full"
                            style={{ 
                                height: `${knockoutBracketHeight}px`
                            }}
                        >
                            {knockoutRounds.map((round, idx) => {
                                const isLast = idx === knockoutRounds.length - 1;
                                const nextRound = !isLast ? knockoutRounds[idx + 1] : null;

                                return (
                                    <React.Fragment key={round.roundNo}>
                                        <div className="flex flex-col w-[calc(100vw-32px)] md:w-[358px] h-full items-stretch snap-center shrink-0">
                                            {/* Capsule header for Knockout Rounds */}
                                            <div className="flex w-full max-w-[358px] h-[48px] p-3 items-center justify-center shrink-0 rounded-[12px] bg-[#C6010B] text-white font-bold uppercase tracking-wider text-[13px] shadow-sm mb-4 self-center">
                                                {round.title}
                                            </div>
                                            <div className="flex flex-col justify-around flex-grow py-2">
                                                {round.matches.map((m) => (
                                                    <BracketMatchCard key={m.matchNo} match={m} />
                                                ))}
                                            </div>
                                        </div>

                                        {!isLast && nextRound && (
                                            <div className="hidden sm:flex flex-col w-[50px] h-full shrink-0">
                                                {/* Empty spacer to align with the capsule header */}
                                                <div className="h-[48px] mb-4"></div>
                                                {/* Connector SVG container */}
                                                <div className="flex-grow py-2">
                                                    {(() => {
                                                        const m = nextRound.matches.length;
                                                        const H_avail = knockoutBracketHeight - 112;
                                                        const H_item = H_avail / m;
                                                        return (
                                                            <div className="flex flex-col h-full">
                                                                {Array.from({ length: m }).map((_, j) => {
                                                                    const Y1 = (H_item / 4) + 14;
                                                                    const Y2 = (3 * H_item / 4) + 14;
                                                                    const Ymid = (H_item / 2) + 14;
                                                                    return (
                                                                        <div key={j} style={{ height: `${H_item}px` }} className="flex items-center justify-center shrink-0">
                                                                            <svg width="50" height={H_item} viewBox={`0 0 50 ${H_item}`} fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path 
                                                                                    d={`M 0 ${Y1} H 25 V ${Y2} H 0 M 25 ${Ymid} H 50`}
                                                                                    stroke="#37393E" 
                                                                                    strokeWidth="1.5" 
                                                                                />
                                                                            </svg>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
