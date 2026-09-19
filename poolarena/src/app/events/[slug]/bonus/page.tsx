"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TournamentNavbar } from "@/components";
import NavBar from "@/components/NavBar";
import Skeleton from "@/components/skeletons/Skeleton";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl, formatLevel } from "@/lib/tournament-utils";
import Image from "next/image";
import { 
    FaUsers, 
    FaGamepad, 
    FaTrophy, 
    FaFire, 
    FaHeartBroken, 
    FaCrown, 
    FaMedal,
    FaArrowRight
} from "react-icons/fa";

type CategoryKey = "opponents" | "matches" | "wins" | "streak" | "losses";

interface CategoryConfig {
    key: CategoryKey;
    title: string;
    shortTitle: string;
    icon: React.ElementType;
    color: string;
    textColor: string;
    bgLight: string;
    badgeBg: string;
    unit: string;
    description: string;
}

const CATEGORIES: CategoryConfig[] = [
    {
        key: "opponents",
        title: "Gặp nhiều đối thủ nhất",
        shortTitle: "Gặp nhiều đối thủ",
        icon: FaUsers,
        color: "from-blue-600 to-indigo-600",
        textColor: "text-blue-600",
        bgLight: "bg-blue-50/80",
        badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
        unit: "đối thủ",
        description: "Cơ thủ chạm trán với nhiều đối thủ khác nhau nhất"
    },
    {
        key: "matches",
        title: "Số trận đã thi đấu",
        shortTitle: "Thi đấu nhiều nhất",
        icon: FaGamepad,
        color: "from-purple-600 to-indigo-600",
        textColor: "text-purple-600",
        bgLight: "bg-purple-50/80",
        badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
        unit: "trận",
        description: "Cơ thủ tham gia nhiều trận đấu nhất giải"
    },
    {
        key: "wins",
        title: "Thắng nhiều trận nhất",
        shortTitle: "Thắng nhiều nhất",
        icon: FaTrophy,
        color: "from-amber-500 to-orange-500",
        textColor: "text-amber-600",
        bgLight: "bg-amber-50/80",
        badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
        unit: "trận thắng",
        description: "Cơ thủ sở hữu số trận thắng nhiều nhất"
    },
    {
        key: "streak",
        title: "Chuỗi thắng dài nhất",
        shortTitle: "Chuỗi thắng dài nhất",
        icon: FaFire,
        color: "from-rose-500 to-red-600",
        textColor: "text-rose-600",
        bgLight: "bg-rose-50/80",
        badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
        unit: "trận liên tiếp",
        description: "Cơ thủ có chuỗi trận thắng liên tiếp ấn tượng nhất"
    },
    {
        key: "losses",
        title: "Thua nhiều trận nhất",
        shortTitle: "Thua nhiều nhất",
        icon: FaHeartBroken,
        color: "from-slate-600 to-gray-700",
        textColor: "text-slate-600",
        bgLight: "bg-slate-50/80",
        badgeBg: "bg-slate-200 text-slate-800 border-slate-300",
        unit: "trận thua",
        description: "Cơ thủ thi đấu cống hiến nhưng chưa may mắn"
    }
];

interface PlayerStats {
    id: number;
    name: string;
    avatarUrl: string;
    rank: string | null;
    opponentsCount: number;
    totalMatches: number;
    wins: number;
    losses: number;
    maxStreak: number;
}

export default function EventBonusPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [activeCategory, setActiveCategory] = useState<CategoryKey>("opponents");
    const [bannerSrc, setBannerSrc] = useState<string>("/images/tour_banner.webp");

    // Fetch tournament details
    const { data: tournament, isLoading: tourLoading } = useQuery({
        queryKey: ['tournament', slug],
        queryFn: () => tournamentAPI.getTournament(slug).then(r => r.data),
        enabled: !!slug,
    });

    // Fetch matches for statistics
    const { data: rawMatches = [], isLoading: matchesLoading } = useQuery({
        queryKey: ['tournament-matches', slug],
        queryFn: () => tournamentAPI.getTournamentMatchesBySlug(slug).then(r => r.data || []),
        enabled: !!slug,
    });

    // Fetch registrations as fallback for avatars/ranks
    const { data: registrations = [] } = useQuery({
        queryKey: ['tournament-registrations', slug],
        queryFn: () => tournamentAPI.getTournamentRegistrationsBySlug(slug).then(r => r.data || []),
        enabled: !!slug,
    });

    useEffect(() => {
        if (tournament?.banner) {
            setBannerSrc(resolveImageUrl(tournament.banner, '/images/tour_banner.webp'));
        } else {
            setBannerSrc("/images/tour_banner.webp");
        }
    }, [tournament?.banner]);

    // Map registrations for quick lookup
    const regMap = useMemo(() => {
        const map = new Map<number, any>();
        registrations.forEach((r: any) => {
            if (r.id) map.set(r.id, r);
        });
        return map;
    }, [registrations]);

    // Compute player statistics across all completed matches
    const playerStatsMap = useMemo(() => {
        const stats: Record<number, {
            id: number;
            name: string;
            avatarUrl: string;
            rank: string | null;
            opponents: Set<number>;
            matches: { time: string; matchNo: number; won: boolean }[];
            wins: number;
            losses: number;
        }> = {};

        // Helper to register player in map
        const getOrCreate = (playerObj: any, playerId: number | null, pName?: string, pAvatar?: string, pRank?: string) => {
            if (!playerId) return null;
            if (!stats[playerId]) {
                const regInfo = regMap.get(playerId);
                const name = (playerObj && playerObj.full_name) || pName || regInfo?.full_name || `Cơ thủ #${playerId}`;
                const avatar = (playerObj && playerObj.avatar_url) || pAvatar || regInfo?.avatar_url || '';
                const rank = (playerObj && playerObj.rank) || pRank || regInfo?.rank || null;

                stats[playerId] = {
                    id: playerId,
                    name,
                    avatarUrl: avatar,
                    rank,
                    opponents: new Set<number>(),
                    matches: [],
                    wins: 0,
                    losses: 0,
                };
            }
            return stats[playerId];
        };

        // Filter only completed matches
        const completedMatches = rawMatches.filter((m: any) => m.status === 'completed');

        completedMatches.forEach((m: any) => {
            const p1Id = m.player1_id || m.player1?.id;
            const p2Id = m.player2_id || m.player2?.id;
            if (!p1Id || !p2Id) return;

            const p1 = getOrCreate(m.player1, p1Id, m.player1_name, m.player1_avatar, m.player1_rank);
            const p2 = getOrCreate(m.player2, p2Id, m.player2_name, m.player2_avatar, m.player2_rank);
            if (!p1 || !p2) return;

            // Opponents
            p1.opponents.add(p2Id);
            p2.opponents.add(p1Id);

            const winnerId = m.winner_id;
            const p1Won = winnerId === p1Id;
            const p2Won = winnerId === p2Id;

            const timeVal = m.match_time || m.created_at || '';
            const matchNo = m.match_no || 0;

            p1.matches.push({ time: timeVal, matchNo, won: p1Won });
            p2.matches.push({ time: timeVal, matchNo, won: p2Won });

            if (p1Won) {
                p1.wins += 1;
                p2.losses += 1;
            } else if (p2Won) {
                p2.wins += 1;
                p1.losses += 1;
            }
        });

        // Compute streaks and finalize
        const result: PlayerStats[] = [];
        Object.values(stats).forEach(p => {
            // Sort matches chronologically to calculate streak
            p.matches.sort((a, b) => {
                if (a.time && b.time) {
                    const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
                    if (diff !== 0) return diff;
                }
                return a.matchNo - b.matchNo;
            });

            let maxStreak = 0;
            let curStreak = 0;
            p.matches.forEach(match => {
                if (match.won) {
                    curStreak += 1;
                    if (curStreak > maxStreak) maxStreak = curStreak;
                } else {
                    curStreak = 0;
                }
            });

            result.push({
                id: p.id,
                name: p.name,
                avatarUrl: p.avatarUrl,
                rank: p.rank,
                opponentsCount: p.opponents.size,
                totalMatches: p.matches.length,
                wins: p.wins,
                losses: p.losses,
                maxStreak,
            });
        });

        return result;
    }, [rawMatches, regMap]);

    // Rank list for each category
    const rankedLists = useMemo(() => {
        const players = [...playerStatsMap];

        const listOpponents = [...players].sort((a, b) => 
            b.opponentsCount - a.opponentsCount || b.totalMatches - a.totalMatches || b.wins - a.wins
        );

        const listMatches = [...players].sort((a, b) => 
            b.totalMatches - a.totalMatches || b.wins - a.wins || a.losses - b.losses
        );

        const listWins = [...players].sort((a, b) => 
            b.wins - a.wins || (b.wins / (b.totalMatches || 1)) - (a.wins / (a.totalMatches || 1))
        );

        const listStreak = [...players].sort((a, b) => 
            b.maxStreak - a.maxStreak || b.wins - a.wins || b.totalMatches - a.totalMatches
        );

        const listLosses = [...players].sort((a, b) => 
            b.losses - a.losses || b.totalMatches - a.totalMatches
        );

        return {
            opponents: listOpponents,
            matches: listMatches,
            wins: listWins,
            streak: listStreak,
            losses: listLosses,
        };
    }, [playerStatsMap]);

    const activeConfig = CATEGORIES.find(c => c.key === activeCategory) || CATEGORIES[0];
    const currentList = rankedLists[activeCategory] || [];
    const top1Player = currentList.length > 0 ? currentList[0] : null;

    const isLoading = tourLoading || matchesLoading;

    const getStatValue = (player: PlayerStats, key: CategoryKey): number => {
        switch (key) {
            case "opponents": return player.opponentsCount;
            case "matches": return player.totalMatches;
            case "wins": return player.wins;
            case "streak": return player.maxStreak;
            case "losses": return player.losses;
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
            <NavBar />

            {/* BANNER SECTION - Responsive */}
            {/* Mobile Banner */}
            <div className="block sm:hidden w-full h-[180px] bg-gray-200 relative overflow-hidden">
                {tournament ? (
                    <Image
                        src={bannerSrc}
                        alt={tournament?.name || "Event Banner"}
                        fill
                        className="object-cover"
                        priority
                        onError={() => setBannerSrc('/images/tour_banner.webp')}
                    />
                ) : (
                    <Skeleton className="w-full h-full" />
                )}
            </div>

            {/* Desktop Banner Container */}
            <div className="hidden sm:block">
                {tournament ? (
                    <div 
                        className="flex flex-col bg-no-repeat bg-top"
                        style={{ 
                            backgroundImage: `url(${bannerSrc})`,
                            backgroundSize: '1920px 450px'
                        }}
                    >
                        <div className="w-full h-[288px]" />
                    </div>
                ) : (
                    <div className="w-full h-[320px] bg-[#172339]">
                        <Skeleton className="w-full h-full" />
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="w-full max-w-[1360px] mx-auto px-4 -mt-[30px] sm:-mt-[160px] relative z-20 flex flex-col gap-6">

                {/* 5 CATEGORY TABS / SWITCHER CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = activeCategory === cat.key;
                        const catTop1 = (rankedLists[cat.key] && rankedLists[cat.key][0]) || null;
                        const top1Val = catTop1 ? getStatValue(catTop1, cat.key) : 0;

                        return (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={`text-left p-3.5 sm:p-4 rounded-2xl transition-all duration-300 border flex flex-col justify-between cursor-pointer ${
                                    isSelected
                                        ? "bg-white border-2 border-amber-500 shadow-xl scale-[1.02] ring-2 ring-amber-400/20"
                                        : "bg-white/90 hover:bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <span className={`p-2 rounded-xl text-base ${isSelected ? "bg-amber-500 text-white shadow-sm" : `${cat.bgLight} ${cat.textColor}`}`}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </span>
                                    {isSelected && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider">
                                            Đang xem
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 line-clamp-1 ${isSelected ? "text-gray-900" : "text-gray-600"}`}>
                                        {cat.shortTitle}
                                    </div>
                                    {catTop1 ? (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg sm:text-xl font-black text-gray-900">
                                                {top1Val}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-500">
                                                {cat.unit}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400">Chưa có số liệu</div>
                                    )}
                                    {catTop1 && (
                                        <div className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                                            👑 {catTop1.name}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ACTIVE CATEGORY HEADER & DESCRIPTION */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                        <span className={`p-3 rounded-2xl bg-gradient-to-br ${activeConfig.color} text-white shadow-md shadow-gray-200`}>
                            <activeConfig.icon className="w-6 h-6" />
                        </span>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                                {activeConfig.title}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                {activeConfig.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700">
                            {currentList.length} cơ thủ có số liệu
                        </span>
                    </div>
                </div>

                {/* LEADERBOARD CONTENT */}
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        <Skeleton className="w-full h-32 rounded-2xl" />
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="w-full h-16 rounded-xl" />
                        ))}
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
                            <activeConfig.icon />
                        </div>
                        <h3 className="text-base font-bold text-gray-800">
                            Chưa có dữ liệu trận đấu
                        </h3>
                        <p className="text-xs text-gray-500 max-w-sm">
                            Khi các cơ thủ hoàn thành các trận đấu tại bàn Scoreboard, bảng xếp hạng sẽ tự động thống kê và cập nhật tại đây.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">

                        {/* TOP 1 SHOWCASE CARD */}
                        {top1Player && (
                            <div 
                                onClick={() => top1Player.id && router.push(`/player/${top1Player.id}`)}
                                className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-3xl p-5 sm:p-7 shadow-xl text-white cursor-pointer hover:shadow-2xl transition-all duration-300 group"
                            >
                                {/* Decorative elements */}
                                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute right-6 top-6 text-white/20 text-7xl sm:text-8xl font-black select-none pointer-events-none">
                                    #1
                                </div>

                                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        {/* Avatar with Crown */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-white/40 overflow-hidden relative">
                                                {top1Player.avatarUrl ? (
                                                    <Image
                                                        src={resolveImageUrl(top1Player.avatarUrl, '')}
                                                        alt={top1Player.name}
                                                        fill
                                                        className="object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-amber-600 bg-amber-50 rounded-xl">
                                                        {top1Player.name.charAt(0)?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="absolute -top-3 -right-2 text-xl filter drop-shadow">
                                                👑
                                            </span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[11px] font-black tracking-widest uppercase bg-black/20 text-white px-2.5 py-0.5 rounded-full">
                                                    Dẫn đầu bảng vàng
                                                </span>
                                                {top1Player.rank && (
                                                    <span className="text-xs font-bold bg-white/30 text-white px-2 py-0.5 rounded-full">
                                                        {formatLevel(top1Player.rank)}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm group-hover:underline">
                                                {top1Player.name}
                                            </h3>
                                            <div className="text-xs text-white/90 mt-1 font-medium flex items-center gap-3">
                                                <span>{top1Player.totalMatches} trận đã đấu</span>
                                                <span>•</span>
                                                <span>{top1Player.wins} thắng - {top1Player.losses} thua</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Big Stat Value */}
                                    <div className="bg-black/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3.5 flex flex-col items-center sm:items-end justify-center self-stretch sm:self-auto">
                                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            {activeConfig.shortTitle}
                                        </span>
                                        <div className="flex items-baseline gap-1.5 mt-0.5">
                                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                                {getStatValue(top1Player, activeCategory)}
                                            </span>
                                            <span className="text-sm font-bold text-white/90">
                                                {activeConfig.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RANKING LIST ROWS */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                            {currentList.map((player, index) => {
                                const statVal = getStatValue(player, activeCategory);
                                const isTop1 = index === 0;
                                const isTop2 = index === 1;
                                const isTop3 = index === 2;

                                return (
                                    <div
                                        key={player.id || index}
                                        onClick={() => player.id && router.push(`/player/${player.id}`)}
                                        className={`p-3.5 sm:p-4.5 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200 cursor-pointer ${
                                            isTop1
                                                ? "bg-amber-50/40 hover:bg-amber-50/70"
                                                : isTop2
                                                    ? "bg-slate-50/50 hover:bg-slate-100/70"
                                                    : isTop3
                                                        ? "bg-orange-50/30 hover:bg-orange-50/60"
                                                        : "hover:bg-gray-50/80"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                            {/* Rank Badge */}
                                            <div className="w-8 sm:w-10 text-center flex-shrink-0 flex items-center justify-center">
                                                {isTop1 ? (
                                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-sm shadow-amber-200">
                                                        1
                                                    </span>
                                                ) : isTop2 ? (
                                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-400 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-sm">
                                                        2
                                                    </span>
                                                ) : isTop3 ? (
                                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-700 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-sm">
                                                        3
                                                    </span>
                                                ) : (
                                                    <span className="text-xs sm:text-sm font-bold text-gray-400">
                                                        #{index + 1}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Avatar */}
                                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                {player.avatarUrl ? (
                                                    <Image
                                                        src={resolveImageUrl(player.avatarUrl, '')}
                                                        alt={player.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm font-bold text-gray-500 bg-gray-200">
                                                        {player.name.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Player Details */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm sm:text-base font-bold text-gray-900 truncate hover:text-amber-600 transition-colors">
                                                        {player.name}
                                                    </span>
                                                    {player.rank && (
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 flex-shrink-0">
                                                            {formatLevel(player.rank)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                                    Đã đấu: <span className="font-semibold text-gray-700">{player.totalMatches}</span> trận • Thắng: <span className="font-semibold text-emerald-600">{player.wins}</span> • Thua: <span className="font-semibold text-gray-600">{player.losses}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stat Badge */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-right">
                                                <div className="text-sm sm:text-base font-black text-gray-900">
                                                    {statVal}
                                                </div>
                                                <div className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    {activeConfig.unit}
                                                </div>
                                            </div>
                                            <FaArrowRight className="w-3 h-3 text-gray-300 hidden sm:block" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            <TournamentNavbar activeTab="bonus" isEvent={true} />
        </div>
    );
}
