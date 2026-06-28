"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import {
    TournamentNavbar,
} from "@/components";
import NavBar from "@/components/NavBar";
import { RankingsTable, RankingData } from "@/components/RankingsTable";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl, formatFullLevel } from "@/lib/tournament-utils";
import Image from "next/image";

interface RegistrationItem {
    id: number;
    full_name: string;
    rank?: string | null;
    avatar_url?: string | null;
    points?: number;
    current_points?: number;
    registered_at?: string | null;
}

export default function TournamentRankingsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: tournament } = useQuery({
        queryKey: ['tournament', slug],
        queryFn: () => tournamentAPI.getTournament(slug).then(r => r.data),
        enabled: !!slug,
    });

    const [bannerSrc, setBannerSrc] = React.useState<string>("/images/tour_banner.webp");

    React.useEffect(() => {
        if (tournament?.banner) {
            setBannerSrc(resolveImageUrl(tournament.banner, '/images/tour_banner.webp'));
        } else {
            setBannerSrc("/images/tour_banner.webp");
        }
    }, [tournament?.banner]);

    const { data: registrations, isLoading: regLoading } = useQuery({
        queryKey: ['tournament-registrations', slug],
        queryFn: () => tournamentAPI.getTournamentRegistrationsBySlug(slug).then(r => r.data as RegistrationItem[]),
        enabled: !!slug,
    });

    const { data: matches, isLoading: matchesLoading } = useQuery({
        queryKey: ['tournament-matches', slug],
        queryFn: () => tournamentAPI.getTournamentMatchesBySlug(slug).then(r => r.data as any[]),
        enabled: !!slug,
    });

    const isLoading = regLoading || matchesLoading;

    const rankings: RankingData[] = React.useMemo(() => {
        if (!registrations) return [];

        const knockoutMatches = (matches ?? []).filter(m => m.bracket === 'knockout');
        if (knockoutMatches.length === 0) {
            // Fallback: If no knockout matches exist yet, show sorted registrations by points
            const sorted = [...registrations].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
            return sorted.map((reg, index) => {
                const diff = (reg.current_points ?? 0) - (reg.points ?? 0);
                const formattedPoints = diff > 0 ? `+${diff}` : `${diff}`;
                return {
                    key: String(reg.id),
                    rank: index + 1,
                    rankLabel: index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : `#${index + 1}`,
                    player: {
                        id: reg.id,
                        name: reg.full_name,
                        avatar: reg.avatar_url ? resolveImageUrl(reg.avatar_url, '') : '',
                        tier: reg.rank ? formatFullLevel(reg.rank) : undefined,
                    },
                    points: formattedPoints,
                };
            });
        }

        // We have knockout matches! Determine standings:
        // Find max round in knockout
        const maxRound = Math.max(...knockoutMatches.map(m => m.round || 1));

        const championId = knockoutMatches.find(m => m.round === maxRound)?.winner_id;
        const finalMatch = knockoutMatches.find(m => m.round === maxRound);
        let runnerUpId: number | null = null;
        if (finalMatch) {
            runnerUpId = finalMatch.player1_id === championId ? finalMatch.player2_id : finalMatch.player1_id;
        }

        // Semi-final losers (losers of round maxRound - 1)
        const semiFinalLosers: number[] = [];
        const semiMatches = knockoutMatches.filter(m => m.round === maxRound - 1);
        semiMatches.forEach(m => {
            const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
            if (loserId) semiFinalLosers.push(loserId);
        });

        // Quarter-final losers (losers of round maxRound - 2)
        const quarterFinalLosers: number[] = [];
        const quarterMatches = knockoutMatches.filter(m => m.round === maxRound - 2);
        quarterMatches.forEach(m => {
            const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
            if (loserId) quarterFinalLosers.push(loserId);
        });

        // Round of 16 losers (losers of round maxRound - 3)
        const r16Losers: number[] = [];
        const r16Matches = knockoutMatches.filter(m => m.round === maxRound - 3);
        r16Matches.forEach(m => {
            const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
            if (loserId) r16Losers.push(loserId);
        });

        // Combine player IDs in order of ranking
        const orderedPlayerIds: number[] = [];
        if (championId) orderedPlayerIds.push(championId);
        if (runnerUpId) orderedPlayerIds.push(runnerUpId);
        
        // Sort sub-categories by points descending
        const regMap = new Map(registrations.map(r => [r.id, r]));
        
        semiFinalLosers.sort((a, b) => ((regMap.get(b)?.points ?? 0) - (regMap.get(a)?.points ?? 0)));
        quarterFinalLosers.sort((a, b) => ((regMap.get(b)?.points ?? 0) - (regMap.get(a)?.points ?? 0)));
        r16Losers.sort((a, b) => ((regMap.get(b)?.points ?? 0) - (regMap.get(a)?.points ?? 0)));

        orderedPlayerIds.push(...semiFinalLosers);
        orderedPlayerIds.push(...quarterFinalLosers);
        orderedPlayerIds.push(...r16Losers);

        const list: RankingData[] = [];
        orderedPlayerIds.forEach((id, index) => {
            const reg = regMap.get(id);
            if (reg) {
                let label = `#${index + 1}`;
                if (index === 0) label = '#1';
                else if (index === 1) label = '#2';
                else if (index === 2 || index === 3) label = '#3-4';
                else if (index >= 4 && index <= 7) label = '#5-8';
                else if (index >= 8 && index <= 15) label = '#9-16';

                const diff = (reg.current_points ?? 0) - (reg.points ?? 0);
                const formattedPoints = diff > 0 ? `+${diff}` : `${diff}`;

                list.push({
                    key: String(reg.id),
                    rank: index + 1,
                    rankLabel: label,
                    player: {
                        id: reg.id,
                        name: reg.full_name,
                        avatar: reg.avatar_url ? resolveImageUrl(reg.avatar_url, '') : '',
                        tier: reg.rank ? formatFullLevel(reg.rank) : undefined,
                    },
                    points: formattedPoints,
                });
            }
        });

        return list;
    }, [registrations, matches]);

    return (
        <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
            <NavBar />

            {/* MOBILE LAYOUT (block sm:hidden) */}
            <div className="block sm:hidden bg-[#F0F2F4]">
                {/* Banner Image */}
                <div className="relative w-full h-[180px] bg-gray-200 overflow-hidden">
                    <Image
                        src={bannerSrc}
                        alt={tournament?.name || "Tournament Banner"}
                        fill

                        className="object-cover"
                        priority
                        onError={() => setBannerSrc('/images/tour_banner.webp')}
                    />
                </div>

                {/* Main Content Area */}
                <div className="px-4 -mt-[40px] pb-8 relative z-10 flex flex-col gap-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spin size="large" />
                        </div>
                    ) : rankings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-md border border-gray-100/50">
                            Chưa có người đăng ký giải đấu này
                        </div>
                    ) : (
                        <RankingsTable data={rankings} />
                    )}
                </div>
            </div>

            {/* DESKTOP LAYOUT (hidden sm:block) */}
            <div className="hidden sm:block">
                <div 
                    className="flex flex-col bg-no-repeat"
                    style={{ 
                        backgroundImage: `url(${bannerSrc})`,
                        backgroundSize: '1920px 450px'
                    }}
                >
                    <main className="w-full max-w-[1360px] mx-auto mt-[288px] flex flex-col items-center px-4">
                        <div className="w-full z-10 flex flex-col gap-2">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Spin size="large" />
                                </div>
                            ) : rankings.length === 0 ? (
                                <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
                                    Chưa có người đăng ký giải đấu này
                                </div>
                            ) : (
                                <RankingsTable data={rankings} />
                            )}
                        </div>
                    </main>
                </div>
            </div>

            <TournamentNavbar activeTab="rankings" />
        </div>
    );
}
