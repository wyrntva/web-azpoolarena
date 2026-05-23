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
    points: number;
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
            className={`w-full flex items-center bg-white rounded-[12px] shadow-sm overflow-hidden px-6 py-2 ${isTop1 ? "h-[100px] border-[2px] border-[#E5BD4F]" : "h-[64px]"
                } ${data.player.id ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}`}
        >
            {/* Rank Label */}
            {!isTop1 && (
                <div className="w-[100px] text-[#757E95] font-bold italic text-[14px]">
                    {data.rankLabel || `# ${data.rank}`}
                </div>
            )}

            {/* Player Info */}
            <div className="flex flex-1 items-center gap-4">
                <div className={`${isTop1 ? "scale-125 mx-2" : ""}`}>
                    <div className="w-[60px] h-[75px] flex-shrink-0 relative transition-transform duration-300">
                        <Image
                            src={
                                data.player.avatar
                                    ? data.player.avatar.startsWith('http')
                                        ? data.player.avatar
                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${data.player.avatar}`
                                    : '/images/imageprofile.png'
                            }
                            alt={data.player.name}
                            fill
                            sizes="60px"
                            className="object-contain"
                            onError={(e) => {
                                e.currentTarget.src = '/images/imageprofile.png';
                            }}
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span
                        className="text-[#172339] font-bold text-[16px]"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {data.player.name}
                    </span>
                    <span
                        className="text-[#757E95] text-[12px] font-medium"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {data.player.tier || "Hạng G+"}
                    </span>
                </div>
            </div>

            {/* Points */}
            <div
                className={`text-[#172339] font-bold italic ${isTop1 ? "text-[24px]" : "text-[18px]"}`}
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

            {/* Spacer */}
            <div className="h-4" />

            {/* Other Players */}
            {rest.map((item) => (
                <RankingRow key={item.key} data={item} />
            ))}
        </div>
    );
};
