"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export interface RankingData {
    key: string;
    rank: number;
    rankLabel?: string;
    player: {
        id?: number;  // ID của người chơi để navigate
        name: string;
        avatar?: string;
        tier?: string;
    };
    points: number | string;
}

const RankingRow: React.FC<{ data: RankingData; isTop1?: boolean }> = ({ data, isTop1 }) => {
    const router = useRouter();

    const handlePlayerClick = () => {
        if (data.player.id) {
            router.push(`/player/${data.player.id}`);
        }
    };

    return (
        <div
            onClick={handlePlayerClick}
            className={`w-full flex items-center bg-white rounded-xl overflow-hidden transition-all duration-300 group border ${
                isTop1
                    ? "h-[140px] pt-2 pb-0 pl-4 pr-4 gap-4 sm:h-[200px] sm:pt-3 sm:pl-6 sm:pr-[90px] sm:gap-6 self-stretch border-4 border-[#FAC600] shadow-[0_4px_6px_0_rgba(138,138,138,0.10)] hover:-translate-y-1 hover:shadow-xl hover:bg-[#F4F8FF]"
                    : "h-auto py-3 px-4 gap-2 sm:h-[90px] sm:pt-1 sm:pb-0 sm:px-6 sm:gap-6 border-transparent shadow-[0_4px_6px_0_rgba(138,138,138,0.10)] hover:-translate-y-1 hover:shadow-lg hover:bg-[#F4F8FF]"
            } ${data.player.id ? "cursor-pointer" : ""}`}
        >
            {/* Rank Label */}
            {!isTop1 && (
                <div className="w-[60px] sm:w-[70px] text-[#172339] font-bold italic text-[18px] select-none transition-transform duration-300 group-hover:scale-105">
                    {data.rankLabel || `# ${data.rank}`}
                </div>
            )}

            {/* Player Info */}
            <div className="flex flex-1 items-center gap-2 sm:gap-6 h-full min-w-0">
                <div className="self-center sm:self-end">
                    <div className={`${isTop1 ? "w-[96px] h-[120px] sm:w-[144px] sm:h-[180px]" : "w-[48px] h-[60px] sm:w-[68px] sm:h-[85px]"} flex-shrink-0 relative transition-transform duration-300 group-hover:scale-105`}>
                        <Image
                            src={data.player.avatar || '/images/imageprofile.png'}
                            alt={data.player.name}
                            fill
                            unoptimized
                            sizes={isTop1 ? "(max-width: 640px) 96px, 144px" : "68px"}
                            className="object-contain object-bottom"
                            onError={(e) => {
                                e.currentTarget.src = '/images/imageprofile.png';
                            }}
                        />
                    </div>
                </div>
                <div className={`flex flex-col py-2 min-w-0 ${isTop1 ? "gap-2" : "gap-1"}`}>
                    <span
                        className={`font-bold ${
                            isTop1
                                ? "text-[#37393E] text-[20px] sm:text-[32px] sm:leading-[32px] truncate"
                                : "text-[#37393E] text-[16px] sm:text-[24px] leading-tight truncate"
                        }`}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {data.player.name}
                    </span>
                    <span
                        className={`font-medium ${
                            isTop1
                                ? "text-[#575E70] text-[16px] sm:text-[24px] sm:leading-[24px]"
                                : "text-[#575E70] text-[14px] sm:text-[16px] leading-tight"
                        }`}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {data.player.tier || "Chưa có level"}
                    </span>
                    <span
                        className={`block sm:hidden font-bold italic mt-0.5 ${
                            isTop1 ? "text-[16px] text-[#CAB765]" : "text-[14px] text-[#7C8FB5]"
                        }`}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {data.points}
                    </span>
                </div>
            </div>

            {/* Points (Desktop Only) */}
            <div
                className={`hidden sm:block font-bold italic ${isTop1 ? "text-[32px] text-[#CAB765]" : "text-[20px] text-[#7C8FB5]"}`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
                {data.points}
            </div>
        </div>
    );
};

export const RankingsTable: React.FC<{ data: RankingData[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const top1 = data[0];
    const rest = data.slice(1);

    return (
        <div className="flex flex-col gap-2">
            {/* Top 1 Player Card */}
            <RankingRow data={top1} isTop1={true} />

            {/* Other Players */}
            {rest.map((item) => (
                <RankingRow key={item.key} data={item} />
            ))}
        </div>
    );
};
