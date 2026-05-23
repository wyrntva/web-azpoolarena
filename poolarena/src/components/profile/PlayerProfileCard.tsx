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

    // Player achievements data (Mock)
    const achievements: Achievement[] = [
        { id: 1, text: "Vô địch giải đấu mở rộng 2024", points: "+250", type: "win" },
        { id: 2, text: "Top 2 giải đấu mở rộng 2020", points: "+250", type: "win" },
        { id: 3, text: "Top 3 giải đấu mở rộng 2021", points: "+250", type: "win" },
        { id: 4, text: "Tham gia giải đấu mở rộng 2025", points: "-250", type: "loss" },
        { id: 5, text: "Tham gia giải đấu mở rộng 2023", points: "+250", type: "win" },
        { id: 6, text: "Top 3 giải đấu mở rộng 2021", points: "+150", type: "win" },
        { id: 7, text: "Tham gia giải đấu mở rộng 2025", points: "+250", type: "win" },
        { id: 8, text: "Tham gia giải đấu mở rộng 2023", points: "+250", type: "win" },
    ];

    return (
        <div className="">
            <div className="flex flex-col lg:flex-row gap-[12px] h-[628px]">
                {/* Left Section - Player Image with Dual Background */}
                <div className="lg:w-1/2 relative h-full bg-white rounded-l-2xl overflow-hidden">
                    {/* Background Colors */}
                    <div className="absolute inset-0 space-y-3">
                        {/* Top half - Dark blue background */}
                        <div className="h-1/3 bg-[#172339]"></div>
                        {/* Bottom half - Light gray background */}
                        <div className="h-2/3 bg-[#9A9CA3]"></div>
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
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-contain bg-transparent object-bottom"
                                    priority
                                    onError={() => setImgSrc('/images/imageprofile.png')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Player Information and Achievements */}
                <div className="lg:w-1/2 bg-[#172339] text-white p-8 h-full flex flex-col rounded-r-2xl overflow-hidden">
                    {/* Player Name and Rank */}
                    <div className="mb-8">
                        <div className="text-white mb-2 text-4xl font-bold italic">
                            {user.fullName || user.full_name || "Tên Người Chơi"}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-lg font-bold text-white">
                                Điểm: {user.points?.toLocaleString('vi-VN') || 0}
                            </div>
                            <span className="text-lg font-bold text-white"> - </span>
                            <div className="text-lg font-bold text-white">
                                Hạng {user.rank || "N/A"}
                            </div>
                        </div>
                    </div>

                    {/* Achievements List */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                        {achievements.map((achievement) => (
                            <div key={achievement.id} className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2 h-2 rounded-full bg-white`}></div>
                                        <div className="text-white text-base">
                                            {achievement.text}
                                        </div>
                                    </div>
                                    <div className={`font-medium text-base ${achievement.points.startsWith('+') ? 'text-[#BAE3FF]' : 'text-[#FF7783]'
                                        }`}>
                                        {achievement.points} điểm
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fixed Follow Us Section */}
                    {(user.tiktok_url || user.facebook_url || user.instagram_url) && (
                        <div className="mt-[18px] ml-5">
                            <div className="text-white font-bold text-lg mb-2">
                                Follow {user.fullName || user.full_name || "User"}
                            </div>
                            <div className="flex space-x-4">
                                {user.tiktok_url && (
                                    <a href={user.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#D22E39] flex items-center justify-center text-white hover:opacity-80 transition-all">
                                        <FaTiktok size={20} />
                                    </a>
                                )}
                                {user.facebook_url && (
                                    <a href={user.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#D22E39] flex items-center justify-center text-white hover:opacity-80 transition-all">
                                        <FaFacebookF size={20} />
                                    </a>
                                )}
                                {user.instagram_url && (
                                    <a href={user.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#D22E39] flex items-center justify-center text-white hover:opacity-80 transition-all">
                                        <FaInstagram size={20} />
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
