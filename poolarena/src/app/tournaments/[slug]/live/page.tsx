"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
    TournamentNavbar,
    ChampionshipBanner,
    RoundSection,
} from "@/components";
import NavBar from "@/components/NavBar";

// Sample Live Data
const ONGOING_MATCHES = [
    {
        id: "live-1",
        tableNumber: "1",
        tableNumberColor: "green",
        player1: { name: "Nguyễn Văn A", avatar: "", isWinner: false },
        player2: { name: "Trần Huy Hoàng", avatar: "", isWinner: false },
        score: "5 vs 3",
        meta: {
            matchNo: 1,
            race: "chạm 9",
            time: "Đang đấu",
        },
    },
    {
        id: "live-2",
        tableNumber: "2",
        tableNumberColor: "green",
        player1: { name: "Lê Quốc Huy", avatar: "", isWinner: false },
        player2: { name: "Phạm Minh Tuấn", avatar: "", isWinner: false },
        score: "2 vs 2",
        meta: {
            matchNo: 2,
            race: "chạm 7 chấp 1",
            time: "Đang đấu",
        },
    },
];

export default function TournamentLivePage() {
    return (
        <div className="min-h-screen bg-[#e8e8e8] pb-24 font-sans">
            <NavBar />

            {/* Header Tabs */}
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

                {/* Banner */}
                <div className="rounded-[12px] overflow-hidden shadow-sm h-[146px] relative">
                    <Image
                        src="/images/home_banner.png"
                        alt="Banner"
                        fill
                        sizes="1360px"
                        className="object-cover"
                    />
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-[48px]">
                    <RoundSection title="TRẬN ĐẤU ĐANG DIỄN RA" matches={ONGOING_MATCHES as any} />

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
