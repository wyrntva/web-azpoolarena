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
import { resolveImageUrl } from "@/lib/tournament-utils";

interface RegistrationItem {
    id: number;
    full_name: string;
    rank?: string | null;
    avatar_url?: string | null;
    points?: number;
    registered_at?: string | null;
}

export default function TournamentRankingsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: registrations, isLoading } = useQuery({
        queryKey: ['tournament-registrations', slug],
        queryFn: () => tournamentAPI.getTournamentRegistrationsBySlug(slug).then(r => r.data as RegistrationItem[]),
        enabled: !!slug,
    });

    const sortedRegistrations = [...(registrations ?? [])].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

    const rankings: RankingData[] = sortedRegistrations.map((reg, index) => ({
        key: String(reg.id),
        rank: index + 1,
        rankLabel: index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : `#${index + 1}`,
        player: {
            id: reg.id,
            name: reg.full_name,
            avatar: reg.avatar_url ? resolveImageUrl(reg.avatar_url, '') : '',
            tier: reg.rank ? `Hạng ${reg.rank}` : undefined,
        },
        points: reg.points ?? 0,
    }));

    return (
        <div className="min-h-screen bg-[#e8e8e8] pb-24 font-sans">
            <NavBar />

            <div className="flex flex-col bg-[url('/images/tour_banner.png')] bg-[length:1920px_450px] bg-no-repeat">
                <main className="w-full max-w-[1360px] mx-auto mt-[288px] flex flex-col items-center">

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

            <TournamentNavbar activeTab="rankings" />
        </div>
    );
}
