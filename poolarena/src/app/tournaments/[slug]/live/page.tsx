"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import {
    TournamentNavbar,
    RoundSection,
} from "@/components";
import NavBar from "@/components/NavBar";
import ChampionshipBanner from "@/components/ChampionshipBanner";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl } from "@/lib/tournament-utils";

interface MatchEntity {
    id: number;
    match_no: number;
    round: number;
    table_no?: string | null;
    player1_id?: number | null;
    player2_id?: number | null;
    player1_score: number;
    player2_score: number;
    winner_id?: number | null;
    status: string;
    match_time?: string | null;
    player1?: { id: number; full_name: string; avatar_url?: string | null } | null;
    player2?: { id: number; full_name: string; avatar_url?: string | null } | null;
}

export default function TournamentLivePage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: matches, isLoading } = useQuery({
        queryKey: ['tournament-matches', slug],
        queryFn: () => tournamentAPI.getTournamentMatchesBySlug(slug).then(r => r.data as MatchEntity[]),
        enabled: !!slug,
        refetchInterval: 30000,
    });

    const ongoingMatches = (matches ?? [])
        .filter(m => m.status === 'ongoing')
        .map(m => ({
            id: m.id,
            tableNumber: m.table_no || '-',
            tableNumberColor: 'green' as const,
            player1: {
                name: m.player1?.full_name || 'Chờ xác nhận',
                avatar: m.player1?.avatar_url ? resolveImageUrl(m.player1.avatar_url, '') : '',
                isWinner: m.winner_id != null && m.winner_id === m.player1_id,
            },
            player2: {
                name: m.player2?.full_name || 'Chờ xác nhận',
                avatar: m.player2?.avatar_url ? resolveImageUrl(m.player2.avatar_url, '') : '',
                isWinner: m.winner_id != null && m.winner_id === m.player2_id,
            },
            score: `${m.player1_score} vs ${m.player2_score}`,
            meta: {
                matchNo: m.match_no,
                time: 'Đang đấu',
            },
        }));

    return (
        <div className="min-h-screen bg-[#e8e8e8] pb-24 font-sans">
            <NavBar />

            <div className="w-full sticky top-[60px] z-[60] shadow-md">
                <div className="flex w-full h-[36px]">
                    <div
                        className="w-[1360px] h-full flex items-center px-10 text-white font-bold uppercase text-[16px] italic bg-[#172339]"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        <span>Trực tiếp giải đấu</span>
                        <div className="ml-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            <main className="w-full max-w-[1360px] mx-auto mt-[48px] flex flex-col gap-[48px]">

                <ChampionshipBanner className="shadow-sm" />

                <div className="flex flex-col gap-[48px]">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spin size="large" />
                        </div>
                    ) : ongoingMatches.length === 0 ? (
                        <div className="bg-white p-10 rounded-[12px] text-center shadow-sm">
                            <div className="text-gray-400">Hiện không có trận đấu nào đang diễn ra</div>
                        </div>
                    ) : (
                        <RoundSection title="TRẬN ĐẤU ĐANG DIỄN RA" matches={ongoingMatches as any} />
                    )}

                    <div className="bg-white p-10 rounded-[12px] text-center shadow-sm border border-dashed border-gray-300">
                        <div className="text-gray-400 mb-2">Chưa có luồng livestream cho giải đấu này</div>
                        <button className="text-[#C6010B] font-semibold hover:underline">
                            Xem lịch thi đấu tiếp theo
                        </button>
                    </div>
                </div>

            </main>

            <TournamentNavbar activeTab="live" />
        </div>
    );
}
