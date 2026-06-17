"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import TournamentList from "@/components/TournamentList";
import { Tournament } from "@/components/TournamentCard";
import { tournamentAPI } from "@/api/tournament.api";
import { storeSettingsAPI } from "@/api/storeSettings.api";
import { sortRanks, generateSlug, resolveImageUrl } from "@/lib/tournament-utils";

interface TournamentData {
  id: number;
  name: string;
  slug: string | null;
  location: string | null;
  banner: string | null;
  organizer_logo: string | null;
  sponsor_logos: string[];
  ranks: string[];
  start_date: string | null;
  number_of_players: number;
  registration_count?: number;
  status: string;
  is_pinned?: boolean;
}

function parseBannerUrls(bannerTournament: string | null | undefined): string[] {
  if (!bannerTournament) return [];
  let urls: string[] = [];
  try {
    const parsed = JSON.parse(bannerTournament);
    if (Array.isArray(parsed)) urls = parsed.filter(Boolean);
    else if (typeof parsed === 'string' && parsed.length > 0) urls = [parsed];
  } catch {
    urls = [bannerTournament];
  }
  return urls.filter(Boolean).map(url => resolveImageUrl(url, ''));
}

export default function TournamentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // React Query caches store-settings across navigations (staleTime: 5 min from QueryClientProvider)
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-public'],
    queryFn: () => storeSettingsAPI.get().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const bannerUrls = parseBannerUrls(storeSettings?.banner_tournament);

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getTournaments();
      const tournaments: TournamentData[] = response.data?.data || [];

      if (!Array.isArray(tournaments)) {
        setUpcomingTournaments([]);
        setCompletedTournaments([]);
        return;
      }

      const now = new Date();
      const ongoing: Tournament[] = [];
      const upcoming: Tournament[] = [];
      const completed: Tournament[] = [];

      tournaments.forEach((tournament) => {
        const startDate = tournament.start_date ? new Date(tournament.start_date) : null;
        const status = tournament.status;

        const isOngoing = status === 'ongoing';
        const isCompleted = status === 'completed' || status === 'finished' ||
          (!['upcoming', 'ongoing'].includes(status) && startDate && startDate <= now && status !== 'ongoing');
        const isUpcoming = !isCompleted && !isOngoing;

        const logoUrl = resolveImageUrl(tournament.organizer_logo, resolveImageUrl(tournament.banner, '/images/tournament.png'));
        const bannerUrl = resolveImageUrl(tournament.banner, '/images/tournament.png');
        const sortedRanks = tournament.ranks?.length > 0 ? sortRanks(tournament.ranks) : [];
        const tournamentSlug = tournament.slug || generateSlug(tournament.name || 'giai-dau-arena-pool', startDate);

        const formatted: Tournament = {
          id: tournament.id,
          slug: tournamentSlug,
          img: bannerUrl,
          title: tournament.location || 'AZ POOL ARENA',
          subtitle: tournament.name || 'GIẢI ĐẤU ARENA POOL',
          category: logoUrl,
          rank: sortedRanks.length > 0 ? sortedRanks.join('-') : 'ALL',
          date: startDate
            ? startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: startDate
            ? startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '09:00',
          participants: {
            current: tournament.registration_count || 0,
            max: tournament.number_of_players || 16,
          },
          isRegistered: false,
          canRegister: (tournament as any).can_register ?? true,
          _startDate: startDate,
          _isPinned: tournament.is_pinned ?? false,
        };

        if (isOngoing) ongoing.push(formatted);
        else if (isUpcoming) upcoming.push(formatted);
        else completed.push(formatted);
      });

      ongoing.sort((a, b) => {
        const pinA = a._isPinned ? 1 : 0;
        const pinB = b._isPinned ? 1 : 0;
        if (pinB !== pinA) return pinB - pinA;
        return (a._startDate?.getTime() ?? 0) - (b._startDate?.getTime() ?? 0);
      });
      upcoming.sort((a, b) => {
        const pinA = a._isPinned ? 1 : 0;
        const pinB = b._isPinned ? 1 : 0;
        if (pinB !== pinA) return pinB - pinA;
        return (a._startDate?.getTime() ?? 0) - (b._startDate?.getTime() ?? 0);
      });
      completed.sort((a, b) => {
        const pinA = a._isPinned ? 1 : 0;
        const pinB = b._isPinned ? 1 : 0;
        if (pinB !== pinA) return pinB - pinA;
        return (b._startDate?.getTime() ?? 0) - (a._startDate?.getTime() ?? 0);
      });

      setOngoingTournaments(ongoing);
      setUpcomingTournaments(upcoming);
      setCompletedTournaments(completed);
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
      setOngoingTournaments([]);
      setUpcomingTournaments([]);
      setCompletedTournaments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Auto-rotate banners every 15 seconds
  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerUrls.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [bannerUrls.length]);

  const handleRegister = useCallback((tournamentId: number) => {
    const tournament = upcomingTournaments.find((t) => t.id === tournamentId);
    if (tournament) {
      router.push(`/tournaments/${tournament.slug || tournament.id}`);
    }
  }, [upcomingTournaments, router]);

  const handleViewResults = useCallback((tournamentId: number) => {
    const tournament = completedTournaments.find((t) => t.id === tournamentId);
    if (tournament) {
      router.push(`/tournaments/${tournament.slug || tournament.id}`);
    }
  }, [completedTournaments, router]);

  const handleCardClick = useCallback((tournament: Tournament) => {
    router.push(`/tournaments/${tournament.slug || tournament.id}`);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Đang tải danh sách giải đấu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F4]">
      <NavBar />

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-0 pb-20 sm:pb-0">
        {/* Tournament Banner — mobile: 361×74 ratio, scales up on larger screens */}
        {bannerUrls.length > 0 && (
          <div
            className="mb-6 sm:mb-12 mt-4 sm:mt-6 relative w-full animate-fadeIn rounded-xl overflow-hidden"
            style={{ aspectRatio: '361 / 74' }}
          >
            {bannerUrls.map((url, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${index === currentBannerIndex ? 'opacity-100' : 'opacity-0'}`}
              >
                <Image
                  src={url}
                  alt={`Tournament Banner ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 361px, (max-width: 1024px) 90vw, 1360px"
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            ))}

            {bannerUrls.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
                {bannerUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${index === currentBannerIndex ? 'bg-white w-4 sm:w-6' : 'bg-white/50 hover:bg-white/75'}`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tournament Sections */}
        <div className="space-y-6 sm:space-y-12">
          {ongoingTournaments.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <h2
                className="text-[#37393E] font-bold italic uppercase tracking-wide animate-slideIn whitespace-nowrap text-[18px] min-[360px]:text-[21px] min-[390px]:text-[23px] min-[430px]:text-[26px] sm:text-[36px] leading-tight flex items-center gap-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                GIẢI ĐẤU ĐANG DIỄN RA
                <span className="flex h-3 w-3 relative sm:h-4 sm:w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-red-500"></span>
                </span>
              </h2>
              <TournamentList
                tournaments={ongoingTournaments}
                variant="ongoing"
                onCardClick={handleCardClick}
              />
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            <h2
              className="text-[#37393E] font-bold italic uppercase tracking-wide animate-slideIn whitespace-nowrap text-[18px] min-[360px]:text-[21px] min-[390px]:text-[23px] min-[430px]:text-[26px] sm:text-[36px] leading-tight"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              GIẢI ĐẤU SẮP DIỄN RA
            </h2>
            {upcomingTournaments.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">Chưa có giải đấu sắp diễn ra</div>
            ) : (
              <TournamentList
                tournaments={upcomingTournaments}
                variant="upcoming"
                onCardClick={handleCardClick}
                onRegister={handleRegister}
              />
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <h2
              className="text-[#37393E] font-bold italic uppercase tracking-wide animate-slideIn whitespace-nowrap text-[18px] min-[360px]:text-[21px] min-[390px]:text-[23px] min-[430px]:text-[26px] sm:text-[36px] leading-tight"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              GIẢI ĐẤU ĐÃ KẾT THÚC
            </h2>
            {completedTournaments.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">Chưa có giải đấu đã kết thúc</div>
            ) : (
              <TournamentList
                tournaments={completedTournaments}
                variant="completed"
                onCardClick={handleCardClick}
                onViewResults={handleViewResults}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
