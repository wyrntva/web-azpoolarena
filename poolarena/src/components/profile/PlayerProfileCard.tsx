"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaTiktok, FaFacebookF, FaInstagram } from "react-icons/fa";
import { resolveImageUrl } from "@/lib/tournament-utils";

interface Achievement {
    id: number;
    text: string;
    points: string;
    type: string;
}

interface PlayerProfileCardProps {
    user: any; // Ideally this should be typed properly with the User interface
}

export default function PlayerProfileCard({ user }: PlayerProfileCardProps) {
    const [imgSrc, setImgSrc] = useState(() =>
        resolveImageUrl(user.avatar_url || user.avatarUrl || user.avatar, '/images/imageprofile.png')
    );

    useEffect(() => {
        setImgSrc(resolveImageUrl(user.avatar_url || user.avatarUrl || user.avatar, '/images/imageprofile.png'));
    }, [user.avatar_url, user.avatarUrl, user.avatar]);

    const wins = user.wins ?? 0;
    const losses = user.losses ?? 0;
    const totalGames = user.total_games ?? user.totalGames ?? (wins + losses);
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    const stats: Achievement[] = [
        { id: 1, text: "Tổng số trận đã thi đấu", points: `+${totalGames}`, type: "win" },
        { id: 2, text: "Số trận thắng", points: `+${wins}`, type: "win" },
        { id: 3, text: "Số trận thua", points: `-${losses}`, type: "loss" },
        { id: 4, text: "Tỉ lệ thắng", points: `+${winRate}%`, type: winRate >= 50 ? "win" : "loss" },
    ];

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-3 h-auto lg:h-[628px]">
                {/* Left Section - Player Image with Dual Background Cards (Two separate blocks) */}
                <div className="w-full max-w-[361px] lg:max-w-none mx-auto lg:w-1/2 relative h-[588px] lg:h-full flex-shrink-0">
                    {/* Background Cards (Spaced exactly 12px apart) */}
                    <div className="absolute inset-0 flex flex-col gap-3">
                        {/* Top Block - Dark blue background card */}
                        <div className="h-[200px] lg:flex-1 bg-[#172339] rounded-t-2xl rounded-b-none lg:rounded-2xl shadow-sm"></div>
                        {/* Bottom Block - Light gray background card */}
                        <div className="h-[376px] lg:h-2/3 bg-[#9A9CA3] rounded-t-none rounded-b-2xl lg:rounded-2xl shadow-sm"></div>
                    </div>

                    {/* Player Image with high z-index */}
                    <div className="relative z-10 flex h-full">
                        <div className="relative w-full h-full">
                            {/* Player Avatar */}
                            <div className="w-full h-full overflow-hidden relative">
                                <Image
                                    src={imgSrc}
                                    alt={user.fullName || user.full_name || "User Avatar"}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-contain bg-transparent object-bottom scale-[1.25] origin-bottom transition-transform duration-300"
                                    priority
                                    onError={() => setImgSrc('/images/imageprofile.png')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Player Information and Achievements */}
                <div className="w-full lg:w-1/2 bg-[#172339] text-white p-12 h-auto lg:h-full flex flex-col rounded-2xl shadow-sm">
                    {/* Player Name and Rank */}
                    <div className="mb-12">
                        <div className="text-white mb-1.5 text-2xl sm:text-4xl font-bold italic uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {user.fullName || user.full_name || "Tên Người Chơi"}
                        </div>
                        <div className="flex items-center space-x-3 text-sm sm:text-lg">
                            <span className="font-semibold text-white">
                                Điểm: {user.points?.toLocaleString('vi-VN') || 0}
                            </span>
                            <span className="text-white/60">—</span>
                            <span className="font-semibold text-white">
                                Hạng {user.rank || "G+"}
                            </span>
                        </div>
                    </div>

                    {/* Achievements List */}
                    <div className="flex-1 max-h-[280px] lg:max-h-none overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                        {stats.map((stat) => (
                            <div key={stat.id} className="flex flex-col">
                                <div className="flex items-start space-x-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 mt-[8px]"></div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-sm sm:text-base font-normal leading-snug">
                                            {stat.text}
                                        </span>
                                        <span className={`text-xs sm:text-sm font-bold tracking-wide mt-[2px] ${
                                            stat.points.startsWith('+') ? 'text-[#BAE3FF]' : 'text-[#FF7783]'
                                        }`}>
                                            {stat.points}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fixed Follow Us Section */}
                    {(user.tiktok_url || user.facebook_url || user.instagram_url) && (
                        <div className="mt-6 border-t border-white/10 pt-4">
                            <div className="text-white font-bold text-base mb-2">
                                Follow {user.fullName || user.full_name || "User"}
                            </div>
                            <div className="flex space-x-4">
                                {user.tiktok_url && (
                                    <a href={user.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#D22E39] flex items-center justify-center text-white hover:opacity-80 transition-all active:scale-95">
                                        <FaTiktok size={18} />
                                    </a>
                                )}
                                {user.facebook_url && (
                                    <a href={user.facebook_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#D22E39] flex items-center justify-center text-white hover:opacity-80 transition-all active:scale-95">
                                        <FaFacebookF size={18} />
                                    </a>
                                )}
                                {user.instagram_url && (
                                    <a href={user.instagram_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#D22E39] flex items-center justify-center text-white hover:opacity-80 transition-all active:scale-95">
                                        <FaInstagram size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
