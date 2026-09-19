"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TournamentNavbar } from "@/components";
import NavBar from "@/components/NavBar";
import { RankingsTable, RankingData } from "@/components/RankingsTable";
import RankingRowSkeleton from "@/components/skeletons/RankingRowSkeleton";
import Skeleton from "@/components/skeletons/Skeleton";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl, formatLevel } from "@/lib/tournament-utils";
import Image from "next/image";

type CategoryKey = "opponents" | "matches" | "wins" | "streak" | "losses";

interface CategoryConfig {
    key: CategoryKey;
    label: string;
}

const CATEGORIES: CategoryConfig[] = [
    { key: "opponents", label: "Gặp nhiều đối thủ nhất" },
    { key: "matches", label: "Số trận đã thi đấu" },
    { key: "wins", label: "Thắng nhiều trận nhất" },
    { key: "streak", label: "Chuỗi thắng dài nhất" },
    { key: "losses", label: "Thua nhiều trận nhất" },
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
    const { data: registrations = [], isLoading: regLoading } = useQuery({
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

        const completedMatches = rawMatches.filter((m: any) => m.status === 'completed');

        completedMatches.forEach((m: any) => {
            const p1Id = m.player1_id || m.player1?.id;
            const p2Id = m.player2_id || m.player2?.id;
            if (!p1Id || !p2Id) return;

            const p1 = getOrCreate(m.player1, p1Id, m.player1_name, m.player1_avatar, m.player1_rank);
            const p2 = getOrCreate(m.player2, p2Id, m.player2_name, m.player2_avatar, m.player2_rank);
            if (!p1 || !p2) return;

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

        const result: PlayerStats[] = [];
        Object.values(stats).forEach(p => {
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

        const listOpponents = players
            .filter(p => p.opponentsCount > 0)
            .sort((a, b) => b.opponentsCount - a.opponentsCount || b.totalMatches - a.totalMatches || b.wins - a.wins);

        const listMatches = players
            .filter(p => p.totalMatches > 0)
            .sort((a, b) => b.totalMatches - a.totalMatches || b.wins - a.wins || a.losses - b.losses);

        const listWins = players
            .filter(p => p.wins > 0)
            .sort((a, b) => b.wins - a.wins || (b.wins / (b.totalMatches || 1)) - (a.wins / (a.totalMatches || 1)));

        const listStreak = players
            .filter(p => p.maxStreak > 0)
            .sort((a, b) => b.maxStreak - a.maxStreak || b.wins - a.wins || b.totalMatches - a.totalMatches);

        const listLosses = players
            .filter(p => p.losses > 0)
            .sort((a, b) => b.losses - a.losses || b.totalMatches - a.totalMatches);

        return {
            opponents: listOpponents,
            matches: listMatches,
            wins: listWins,
            streak: listStreak,
            losses: listLosses,
        };
    }, [playerStatsMap]);

    const currentList = rankedLists[activeCategory] || [];

    const rankings: RankingData[] = useMemo(() => {
        return currentList.map((player, index) => {
            let pointsStr = '';
            switch (activeCategory) {
                case 'opponents':
                    pointsStr = `${player.opponentsCount} đối thủ`;
                    break;
                case 'matches':
                    pointsStr = `${player.totalMatches} trận`;
                    break;
                case 'wins':
                    pointsStr = `${player.wins} trận thắng`;
                    break;
                case 'streak':
                    pointsStr = `${player.maxStreak} trận`;
                    break;
                case 'losses':
                    pointsStr = `${player.losses} trận thua`;
                    break;
            }

            return {
                key: `${activeCategory}-${player.id || index}`,
                rank: index + 1,
                rankLabel: index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : `#${index + 1}`,
                player: {
                    id: player.id,
                    name: player.name,
                    avatar: player.avatarUrl ? resolveImageUrl(player.avatarUrl, '') : '',
                    tier: player.rank ? formatLevel(player.rank) : undefined,
                },
                points: pointsStr,
            };
        });
    }, [currentList, activeCategory]);

    const isLoading = tourLoading || matchesLoading || regLoading;

    // Component for 5 category tabs
    const renderCategoryTabs = () => (
        <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap no-scrollbar py-2 w-full">
            {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.key;
                return (
                    <button
                        key={cat.key}
                        type="button"
                        onClick={(e) => {
                            e.currentTarget.blur();
                            setActiveCategory(cat.key);
                        }}
                        className={`whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-colors duration-150 cursor-pointer flex-shrink-0 select-none ${
                            isSelected
                                ? "bg-[#172339] text-white border-[#172339] shadow-sm"
                                : "bg-white text-[#575E70] border-gray-200/80 hover:bg-gray-100 hover:text-[#172339]"
                        }`}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {cat.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans overflow-y-scroll [scrollbar-gutter:stable]">
            <NavBar />

            {/* MOBILE LAYOUT (block sm:hidden) */}
            <div className="block sm:hidden bg-[#F0F2F4]">
                <div className="relative w-full h-[180px] bg-gray-200 overflow-hidden">
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

                <div className="px-4 -mt-[40px] pb-8 relative z-10 flex flex-col gap-4 min-h-[500px]">
                    {/* Category tabs */}
                    {renderCategoryTabs()}

                    {isLoading ? (
                        <div className="flex flex-col gap-3">
                            <RankingRowSkeleton isTop1 />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <RankingRowSkeleton key={i} />
                            ))}
                        </div>
                    ) : rankings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-md border border-gray-100/50">
                            Chưa có dữ liệu trận đấu
                        </div>
                    ) : (
                        <RankingsTable data={rankings} />
                    )}
                </div>
            </div>

            {/* DESKTOP LAYOUT (hidden sm:block) */}
            <div className="hidden sm:block">
                {tournament ? (
                    <div 
                        className="flex flex-col bg-no-repeat"
                        style={{ 
                            backgroundImage: `url(${bannerSrc})`,
                            backgroundSize: '1920px 450px'
                        }}
                    >
                        <main className="w-full max-w-[1360px] mx-auto mt-[288px] flex flex-col items-center px-4">
                            <div className="w-full z-10 flex flex-col gap-3 min-h-[550px]">
                                {/* Category tabs */}
                                {renderCategoryTabs()}

                                {isLoading ? (
                                    <div className="w-full flex flex-col gap-3">
                                        <RankingRowSkeleton isTop1 />
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <RankingRowSkeleton key={i} />
                                        ))}
                                    </div>
                                ) : rankings.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
                                        Chưa có dữ liệu trận đấu
                                    </div>
                                ) : (
                                    <RankingsTable data={rankings} />
                                )}
                            </div>
                        </main>
                    </div>
                ) : (
                    <div className="w-full h-[450px] bg-[#172339] overflow-hidden">
                        <Skeleton className="w-full h-full" />
                    </div>
                )}
            </div>

            <TournamentNavbar activeTab="bonus" isEvent={true} />
        </div>
    );
}

