"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
    TournamentNavbar,
    ChampionshipBanner,
} from "@/components";
import NavBar from "@/components/NavBar";
import { RankingsTable } from "@/components/RankingsTable";

const SAMPLE_RANKINGS = [
    {
        key: "1",
        rank: 1,
        rankLabel: "#1",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "2",
        rank: 2,
        rankLabel: "# 2",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "3",
        rank: 3,
        rankLabel: "# 3-4",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "4",
        rank: 4,
        rankLabel: "# 3-4",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "5",
        rank: 5,
        rankLabel: "# 5-8",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "6",
        rank: 6,
        rankLabel: "# 5-8",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "7",
        rank: 7,
        rankLabel: "# 5-8",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "8",
        rank: 8,
        rankLabel: "# 5-8",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "9",
        rank: 9,
        rankLabel: "# 9-12",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "10",
        rank: 10,
        rankLabel: "# 9-12",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "11",
        rank: 11,
        rankLabel: "# 9-12",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "12",
        rank: 12,
        rankLabel: "# 9-12",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "13",
        rank: 13,
        rankLabel: "# 13-16",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
    {
        key: "14",
        rank: 14,
        rankLabel: "# 13-16",
        player: { name: "Quốc Huy", avatar: "", tier: "Hạng G+" },
        points: 700,
    },
];

export default function TournamentRankingsPage() {
    return (
        <div className="min-h-screen bg-[#e8e8e8] pb-24 font-sans">
            <NavBar />

            <div className="flex flex-col bg-[url('/images/tour_banner.png')] bg-[length:1920px_450px] bg-no-repeat">
                <main className="w-full max-w-[1360px] mx-auto mt-[288px] flex flex-col items-center">

                    {/* Rankings Container - Overlapping the Banner */}
                    <div className="w-full z-10 flex flex-col gap-2">
                        <RankingsTable data={SAMPLE_RANKINGS as any} />
                    </div>

                </main>
            </div>

            <TournamentNavbar activeTab="rankings" />
        </div>
    );
}
