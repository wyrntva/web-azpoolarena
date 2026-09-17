"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    TournamentNavbar,
} from "@/components";
import NavBar from "@/components/NavBar";
import { RankingsTable, RankingData } from "@/components/RankingsTable";
import RankingRowSkeleton from "@/components/skeletons/RankingRowSkeleton";
import Skeleton from "@/components/skeletons/Skeleton";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl, formatLevel } from "@/lib/tournament-utils";
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

export default function EventRankingsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: tournament, isLoading: isTourLoading } = useQuery({
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

    const isLoading = isTourLoading || regLoading;

    const rankings: RankingData[] = React.useMemo(() => {
        if (!registrations || registrations.length === 0) return [];

        const sorted = [...registrations].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

        return sorted.map((reg, index) => {
            return {
                key: String(reg.id),
                rank: index + 1,
                rankLabel: index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : `#${index + 1}`,
                player: {
                    id: reg.id,
                    name: reg.full_name,
                    avatar: reg.avatar_url ? resolveImageUrl(reg.avatar_url, '') : '',
                    tier: reg.rank ? formatLevel(reg.rank) : undefined,
                },
                points: `${reg.points ?? 0}`,
            };
        });
    }, [registrations]);

    return (
        <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
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

                <div className="px-4 -mt-[40px] pb-8 relative z-10 flex flex-col gap-4">

                    {isLoading ? (
                        <div className="flex flex-col gap-3">
                            <RankingRowSkeleton isTop1 />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <RankingRowSkeleton key={i} />
                            ))}
                        </div>
                    ) : rankings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-md border border-gray-100/50">
                            Chưa có người đăng ký sự kiện này
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
                            <div className="w-full z-10 flex flex-col gap-2">

                                {isLoading ? (
                                    <div className="w-full flex flex-col gap-3">
                                        <RankingRowSkeleton isTop1 />
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <RankingRowSkeleton key={i} />
                                        ))}
                                    </div>
                                ) : rankings.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
                                        Chưa có người đăng ký sự kiện này
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

            <TournamentNavbar activeTab="rankings" isEvent={true} />
        </div>
    );
}
