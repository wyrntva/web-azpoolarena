"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TournamentNavbar } from "@/components";
import NavBar from "@/components/NavBar";
import Skeleton from "@/components/skeletons/Skeleton";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl, formatFullLevel, formatCurrency } from "@/lib/tournament-utils";
import Image from "next/image";
import { FaGift, FaTrophy, FaStar, FaMedal } from "react-icons/fa";

interface RegistrationItem {
    id: number;
    full_name: string;
    rank?: string | null;
    avatar_url?: string | null;
    points?: number;
    current_points?: number;
    registered_at?: string | null;
}

export default function EventBonusPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: tournament, isLoading: tourLoading } = useQuery({
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

    const isLoading = tourLoading || regLoading;
    const bonusPoints = tournament?.bonus ? parseInt(tournament.bonus, 10) : 0;

    const prizeList = [
        { label: "Tổng giải thưởng", value: tournament?.total_prize, icon: FaTrophy, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "Giải Nhất", value: tournament?.first_prize, icon: FaMedal, color: "text-yellow-600", bg: "bg-yellow-50" },
        { label: "Giải Nhì", value: tournament?.second_prize, icon: FaMedal, color: "text-gray-500", bg: "bg-gray-100" },
        { label: "Đồng Hạng Ba", value: tournament?.third_prize, icon: FaMedal, color: "text-amber-700", bg: "bg-orange-50" },
        { label: "Top 5 - 8", value: tournament?.top_5_8_prize, icon: FaStar, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Top 9 - 16", value: tournament?.top_9_16_prize, icon: FaStar, color: "text-indigo-500", bg: "bg-indigo-50" },
    ].filter(p => p.value && Number(p.value) > 0);

    return (
        <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
            <NavBar />

            {/* MOBILE LAYOUT (block sm:hidden) */}
            <div className="block sm:hidden bg-[#F0F2F4]">
                {/* Banner Image */}
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

                {/* Main Content Area */}
                <div className="px-4 -mt-[40px] pb-8 relative z-10 flex flex-col gap-4">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100/50 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                                <FaGift className="w-5 h-5" />
                            </span>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                                    {tournament?.name || "Sự kiện"}
                                </h1>
                                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                                    Phần thưởng & Điểm Bonus
                                </p>
                            </div>
                        </div>

                        {bonusPoints > 0 && (
                            <div className="mt-2 p-3 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FaStar className="text-amber-500 text-lg" />
                                    <div>
                                        <div className="text-xs text-gray-600 font-medium">Bonus lần đầu đối đầu</div>
                                        <div className="text-sm font-bold text-gray-900">Cộng trực tiếp vào BXH</div>
                                    </div>
                                </div>
                                <span className="text-base font-extrabold text-amber-600 bg-white px-3 py-1 rounded-full shadow-sm">
                                    +{bonusPoints} điểm
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Cơ cấu giải thưởng */}
                    {prizeList.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100/50 flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <FaTrophy className="text-amber-500" />
                                Cơ cấu giải thưởng & Thưởng
                            </h2>
                            <div className="grid grid-cols-2 gap-2.5">
                                {prizeList.map((prize, idx) => {
                                    const Icon = prize.icon;
                                    return (
                                        <div key={idx} className={`p-3 rounded-xl ${prize.bg} border border-black/5 flex flex-col`}>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium mb-1">
                                                <Icon className={prize.color} />
                                                <span>{prize.label}</span>
                                            </div>
                                            <div className="text-sm font-extrabold text-gray-900">
                                                {formatCurrency(prize.value)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Danh sách cơ thủ */}
                    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100/50 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <FaStar className="text-rose-500" />
                                Cơ thủ tham gia
                            </h2>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {registrations?.length || 0} cơ thủ
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col gap-2 py-3">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="w-full h-12 rounded-xl" />
                                ))}
                            </div>
                        ) : !registrations || registrations.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 text-sm">
                                Chưa có dữ liệu cơ thủ đăng ký
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-gray-100">
                                {registrations.map((player, index) => (
                                    <div key={player.id || index} className="py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 text-xs font-bold text-gray-400 text-center">
                                                #{index + 1}
                                            </div>
                                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                {player.avatar_url ? (
                                                    <Image
                                                        src={resolveImageUrl(player.avatar_url, '')}
                                                        alt={player.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-200">
                                                        {player.full_name?.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                    {player.full_name}
                                                </div>
                                                {player.rank && (
                                                    <div className="text-[11px] font-medium text-gray-500">
                                                        {formatFullLevel(player.rank)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                                                {player.points ?? player.current_points ?? 0} pts
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
                        <main className="w-full max-w-[1360px] mx-auto mt-[288px] flex flex-col items-center px-4 pb-12">
                            <div className="w-full z-10 flex flex-col gap-6">
                                {/* Header Card */}
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                                            <FaGift className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">
                                                Phần thưởng & Cơ chế Bonus
                                            </div>
                                            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
                                                {tournament?.name}
                                            </h1>
                                        </div>
                                    </div>

                                    {bonusPoints > 0 && (
                                        <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 border border-amber-200 px-6 py-4 rounded-2xl">
                                            <FaStar className="text-amber-500 text-2xl" />
                                            <div>
                                                <div className="text-xs text-gray-600 font-semibold">Thưởng lần đầu đối đầu</div>
                                                <div className="text-sm text-gray-800">Cộng trực tiếp vào BXH</div>
                                            </div>
                                            <div className="text-2xl font-black text-amber-600 ml-2">
                                                +{bonusPoints} điểm
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Giải thưởng & Phần thưởng */}
                                {prizeList.length > 0 && (
                                    <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <FaTrophy className="text-amber-500 text-lg" />
                                            Cơ cấu giải thưởng & Thưởng của sự kiện
                                        </h2>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {prizeList.map((prize, idx) => {
                                                const Icon = prize.icon;
                                                return (
                                                    <div key={idx} className={`p-4 rounded-2xl ${prize.bg} border border-black/5 flex flex-col justify-between`}>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mb-2">
                                                            <Icon className={prize.color} />
                                                            <span>{prize.label}</span>
                                                        </div>
                                                        <div className="text-lg font-black text-gray-900">
                                                            {formatCurrency(prize.value)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Danh sách cơ thủ */}
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <FaStar className="text-rose-500 text-lg" />
                                            Danh sách cơ thủ tham gia
                                        </h2>
                                        <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                            {registrations?.length || 0} cơ thủ đăng ký
                                        </span>
                                    </div>

                                    {isLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[1, 2, 3, 4, 5, 6].map(i => (
                                                <Skeleton key={i} className="w-full h-16 rounded-2xl" />
                                            ))}
                                        </div>
                                    ) : !registrations || registrations.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500 font-medium">
                                            Chưa có cơ thủ đăng ký sự kiện này
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {registrations.map((player, index) => (
                                                <div 
                                                    key={player.id || index}
                                                    className="p-3.5 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all flex items-center justify-between bg-gray-50/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 text-xs font-bold text-gray-400 text-center">
                                                            #{index + 1}
                                                        </span>
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                                                            {player.avatar_url ? (
                                                                <Image
                                                                    src={resolveImageUrl(player.avatar_url, '')}
                                                                    alt={player.full_name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-200">
                                                                    {player.full_name?.charAt(0)?.toUpperCase() || "?"}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {player.full_name}
                                                            </div>
                                                            {player.rank && (
                                                                <div className="text-xs text-gray-500 font-medium">
                                                                    {formatFullLevel(player.rank)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                                                            {player.points ?? player.current_points ?? 0} pts
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>
                ) : (
                    <div className="w-full h-[450px] bg-[#172339] overflow-hidden">
                        <Skeleton className="w-full h-full" />
                    </div>
                )}
            </div>

            <TournamentNavbar activeTab="bonus" isEvent={true} />
        </div>
    );
}
