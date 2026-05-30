"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaTiktok, FaFacebookF, FaInstagram } from "react-icons/fa";
import { resolveImageUrl } from "@/lib/tournament-utils";
import { tournamentAPI } from "@/api/tournament.api";

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
    const [activeTab, setActiveTab] = useState<'lich-su' | 'hieu-so'>('lich-su');

    useEffect(() => {
        setImgSrc(resolveImageUrl(user.avatar_url || user.avatarUrl || user.avatar, '/images/imageprofile.png'));
    }, [user.avatar_url, user.avatarUrl, user.avatar]);

    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchTournamentHistory = async () => {
            try {
                // Fetch all public tournaments
                const tourRes = await tournamentAPI.getTournaments();
                const tournaments = tourRes.data?.data || [];
                if (!Array.isArray(tournaments)) return;

                const realHistoryItems: any[] = [];

                // Fetch registrations and matches for each tournament in parallel
                await Promise.all(
                    tournaments.map(async (tournament: any) => {
                        if (tournament.status !== 'completed') return;
                        try {
                            const [regRes, matchRes] = await Promise.all([
                                tournamentAPI.getTournamentRegistrationsBySlug(tournament.slug),
                                tournamentAPI.getTournamentMatchesBySlug(tournament.slug)
                            ]);

                            const registrations = regRes.data;
                            const matches = matchRes.data;

                            if (!registrations) return;

                            const myReg = registrations.find((r: any) => r.id === user.id);
                            if (!myReg) return; // User didn't participate in this tournament

                            // Calculate rankings for this tournament
                            const knockoutMatches = (matches ?? []).filter((m: any) => m.bracket === 'knockout');
                            let rankingsList: any[] = [];

                            if (knockoutMatches.length === 0) {
                                const sorted = [...registrations].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
                                rankingsList = sorted.map((reg, index) => {
                                    const diff = (reg.current_points ?? 0) - (reg.points ?? 0);
                                    const formattedPoints = diff > 0 ? `+${diff}` : `${diff}`;
                                    return {
                                        id: reg.id,
                                        rank: index + 1,
                                        rankLabel: index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : `#${index + 1}`,
                                        diff: formattedPoints,
                                    };
                                });
                            } else {
                                const maxRound = Math.max(...knockoutMatches.map((m: any) => m.round || 1));
                                const championId = knockoutMatches.find((m: any) => m.round === maxRound)?.winner_id;
                                const finalMatch = knockoutMatches.find((m: any) => m.round === maxRound);
                                let runnerUpId: number | null = null;
                                if (finalMatch) {
                                    runnerUpId = finalMatch.player1_id === championId ? finalMatch.player2_id : finalMatch.player1_id;
                                }

                                const semiFinalLosers: number[] = [];
                                const semiMatches = knockoutMatches.filter((m: any) => m.round === maxRound - 1);
                                semiMatches.forEach((m: any) => {
                                    const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
                                    if (loserId) semiFinalLosers.push(loserId);
                                });

                                const quarterFinalLosers: number[] = [];
                                const quarterMatches = knockoutMatches.filter((m: any) => m.round === maxRound - 2);
                                quarterMatches.forEach((m: any) => {
                                    const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
                                    if (loserId) quarterFinalLosers.push(loserId);
                                });

                                const r16Losers: number[] = [];
                                const r16Matches = knockoutMatches.filter((m: any) => m.round === maxRound - 3);
                                r16Matches.forEach((m: any) => {
                                    const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id;
                                    if (loserId) r16Losers.push(loserId);
                                });

                                const orderedPlayerIds: number[] = [];
                                if (championId) orderedPlayerIds.push(championId);
                                if (runnerUpId) orderedPlayerIds.push(runnerUpId);
                                
                                const regMap = new Map(registrations.map((r: any) => [r.id, r]));
                                
                                semiFinalLosers.sort((a, b) => (((regMap.get(b) as any)?.points ?? 0) - ((regMap.get(a) as any)?.points ?? 0)));
                                quarterFinalLosers.sort((a, b) => (((regMap.get(b) as any)?.points ?? 0) - ((regMap.get(a) as any)?.points ?? 0)));
                                r16Losers.sort((a, b) => (((regMap.get(b) as any)?.points ?? 0) - ((regMap.get(a) as any)?.points ?? 0)));

                                orderedPlayerIds.push(...semiFinalLosers);
                                orderedPlayerIds.push(...quarterFinalLosers);
                                orderedPlayerIds.push(...r16Losers);

                                orderedPlayerIds.forEach((id, index) => {
                                    const reg = regMap.get(id) as any;
                                    if (reg) {
                                        let label = `#${index + 1}`;
                                        if (index === 0) label = '#1';
                                        else if (index === 1) label = '#2';
                                        else if (index === 2 || index === 3) label = '#3-4';
                                        else if (index >= 4 && index <= 7) label = '#5-8';
                                        else if (index >= 8 && index <= 15) label = '#9-16';

                                        const diff = (reg.current_points ?? 0) - (reg.points ?? 0);
                                        const formattedPoints = diff > 0 ? `+${diff}` : `${diff}`;

                                        rankingsList.push({
                                            id: reg.id,
                                            rank: index + 1,
                                            rankLabel: label,
                                            diff: formattedPoints,
                                        });
                                    }
                                });
                            }

                            const myRank = rankingsList.find((item: any) => item.id === user.id);
                            let label = "Tham gia giải";
                            let diffStr = "0";

                            if (myRank) {
                                diffStr = myRank.diff;
                                if (myRank.rank === 1) label = "Vô địch giải";
                                else if (myRank.rank === 2) label = "Top 2 giải";
                                else if (myRank.rank === 3 || myRank.rank === 4 || myRank.rankLabel === '#3-4') label = "Top 3-4 giải";
                                else if ((myRank.rank >= 5 && myRank.rank <= 8) || myRank.rankLabel === '#5-8') label = "Top 5-8 giải";
                                else if ((myRank.rank >= 9 && myRank.rank <= 16) || myRank.rankLabel === '#9-16') label = "Top 9-16 giải";
                                else label = `Top ${myRank.rank} giải`;
                            } else {
                                const diff = (myReg.current_points ?? 0) - (myReg.points ?? 0);
                                diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                            }

                            const isPositive = !diffStr.startsWith('-');
                            const numericValue = diffStr.replace('+', '').replace('-', '');
                            const formattedDiff = isPositive ? `+ ${numericValue} điểm` : `- ${numericValue} điểm`;

                            realHistoryItems.push({
                                id: `real-${tournament.id}`,
                                text: `${label} ${tournament.name}`,
                                points: formattedDiff,
                            });
                        } catch (e) {
                            console.error(`Error calculating rankings for ${tournament.name}:`, e);
                        }
                    })
                );

                if (realHistoryItems.length > 0) {
                    setHistory(realHistoryItems);
                } else {
                    setHistory([]);
                }
            } catch (err) {
                console.error("Error fetching tournament history:", err);
            }
        };

        fetchTournamentHistory();
    }, [user.id]);

    const wins = user.wins ?? 0;
    const losses = user.losses ?? 0;
    const totalGames = user.total_games ?? user.totalGames ?? (wins + losses);
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const tournamentsCount = user.tournaments_count ?? user.tournamentsCount ?? 0;

    const stats: Achievement[] = [
        { id: 1, text: "Số giải đã thi đấu", points: `+${tournamentsCount}`, type: "win" },
        { id: 2, text: "Tổng số trận đã thi đấu", points: `+${totalGames}`, type: "win" },
        { id: 3, text: "Số trận thắng", points: `+${wins}`, type: "win" },
        { id: 4, text: "Số trận thua", points: `-${losses}`, type: "loss" },
        { id: 5, text: "Tỉ lệ thắng", points: `+${winRate}%`, type: winRate >= 50 ? "win" : "loss" },
    ];

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-3 h-auto lg:h-[612px] lg:w-[1360px] lg:mx-auto">
                {/* Left Section - Player Image with Dual Background Cards (Two separate blocks) */}
                <div className="w-full max-w-[361px] lg:max-w-none mx-auto lg:w-[674px] relative h-[588px] lg:h-full flex-shrink-0">
                    {/* Background Cards (Spaced exactly 12px apart) */}
                    <div className="absolute inset-0 flex flex-col gap-3">
                        {/* Top Block - Dark blue background card */}
                        <div className="h-[200px] lg:h-[200px] bg-[#172339] rounded-t-2xl rounded-b-none lg:rounded-none lg:rounded-tl-2xl shadow-sm"></div>
                        {/* Bottom Block - Light gray background card */}
                        <div className="h-[376px] lg:h-[400px] bg-[#9A9CA3] rounded-t-none rounded-b-2xl lg:rounded-none lg:rounded-bl-2xl shadow-sm"></div>
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
                                    className="object-contain bg-transparent object-bottom scale-[1.25] lg:scale-[1.0] origin-bottom transition-transform duration-300"
                                    priority
                                    onError={() => setImgSrc('/images/imageprofile.png')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Player Information and Achievements */}
                <div className="w-full lg:w-[674px] bg-[#172339] text-white p-12 lg:p-12 h-auto lg:h-full flex flex-col rounded-2xl lg:rounded-none lg:rounded-tr-2xl lg:rounded-br-2xl shadow-sm">
                    {/* Player Name and Rank */}
                    <div className="mb-0">
                        <div className="text-white mb-1.5 text-2xl sm:text-4xl font-bold italic uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {user.fullName || user.full_name || "Tên Người Chơi"}
                        </div>
                        <div className="flex items-center space-x-3 text-sm sm:text-lg mb-4">
                            <span className="font-semibold text-white">
                                Điểm: {user.points?.toLocaleString('vi-VN') || 0}
                            </span>
                            <span className="text-white/60">—</span>
                            <span className="font-semibold text-white">
                                Hạng {user.rank || "G+"}
                            </span>
                        </div>
                        {/* Two buttons below points: Lịch sử and Hiệu số */}
                        <div className="flex items-center space-x-6 border-b border-white/10 mt-6 pb-0">
                            {/* Button Lịch Sử */}
                            <button
                                onClick={() => setActiveTab('lich-su')}
                                className={`relative pb-2 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors duration-200 outline-none
                                  ${activeTab === 'lich-su' 
                                    ? 'text-white' 
                                    : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                                Lịch sử
                                {/* Đường gạch dưới động */}
                                {activeTab === 'lich-su' && (
                                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-sky-400 rounded-full" />
                                )}
                            </button>

                            {/* Button Hiệu Số */}
                            <button
                                onClick={() => setActiveTab('hieu-so')}
                                className={`relative pb-2 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors duration-200 outline-none
                                  ${activeTab === 'hieu-so' 
                                    ? 'text-white' 
                                    : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                                Hiệu số
                                {/* Đường gạch dưới động */}
                                {activeTab === 'hieu-so' && (
                                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-sky-400 rounded-full" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content below based on selected tab */}
                    {activeTab === 'hieu-so' ? (
                        <div className="flex-1 max-h-[280px] lg:max-h-none overflow-y-auto pr-2 space-y-6 custom-scrollbar mt-6">
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
                    ) : (
                        history.length > 0 ? (
                            <div className="flex-1 max-h-[280px] lg:max-h-none overflow-y-auto pr-2 space-y-6 custom-scrollbar mt-6">
                                {history.map((item) => (
                                    <div key={item.id} className="flex flex-col">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 mt-[8px]"></div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-white text-sm sm:text-base font-normal leading-snug">
                                                    {item.text}
                                                </span>
                                                <span className={`text-xs sm:text-sm font-bold tracking-wide mt-[2px] ${
                                                    item.points.startsWith('+') ? 'text-[#BAE3FF]' : 'text-[#FF7783]'
                                                }`}>
                                                    {item.points}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 max-h-[280px] lg:max-h-none overflow-y-auto pr-2 custom-scrollbar mt-6 flex items-center justify-center text-slate-400 text-sm italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Chưa có dữ liệu lịch sử thi đấu
                            </div>
                        )
                    )}

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
