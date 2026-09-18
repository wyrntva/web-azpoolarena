"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import {
  ChampionshipBanner,
  TournamentNavbar,
  TournamentInfoCard,
  PlayerListSection,
  PrizeSection,
  CountdownTimer,
} from "@/components";
import NavBar from "@/components/NavBar";
import TournamentDetailSkeleton from "@/components/skeletons/TournamentDetailSkeleton";

const RegisterTournamentModal = dynamic(
  () => import("@/components/RegisterTournamentModal").then(m => m.RegisterTournamentModal),
  { ssr: false }
);
import { useAppSelector } from "@/stores/hooks";
import { tournamentAPI } from "@/api/tournament.api";
import { sortRanks, resolveImageUrl, formatCurrency, generateSlug, formatLevelRange } from "@/lib/tournament-utils";
import { LuCalendarRange } from "react-icons/lu";
import Image from "next/image";

interface RegisteredPlayer {
  id: number;
  full_name: string;
  phone_number: string;
  rank: string | null;
  avatar_url: string | null;
  points?: number;
  registered_at: string | null;
}

interface Player {
  id: number;
  name: string;
  avatar: string | null;
  score: number;
  rank: string;
}

const TOURNAMENT_TYPE_MAP: Record<string, string> = {
  'knockout': 'Loại trực tiếp',
  'double_elimination': 'Nhánh thắng thua',
};

const EVENT_ZALO_QR_MAP: Record<string, { url: string; title?: string; subtitle?: string }> = {
  'tet-trung-thu-20260917': {
    url: 'https://zalo.me/g/ytqpxk355',
    title: 'Nhóm Zalo Sự Kiện Tết Trung Thu',
    subtitle: 'Quét mã QR hoặc nhấn vào nút bên cạnh để tham gia nhóm Zalo sự kiện',
  },
};

interface TournamentDetail {
  id: string;
  title: string;
  category?: string;
  _isEvent?: boolean;
  startTime: string;
  endTime: string;
  matchCreationTime?: string;
  location: string;
  type: string;
  tournamentType: string;
  participants: {
    current: number;
    max: number;
  };
  format: string;
  rank: string;
  phone: string;
  registrationFee: string;
  registrationFeeAmount: number;
  freeRegistrationFee?: boolean;
  canRegister?: boolean;
  logo?: string | null;
  banner?: string;
  sponsorLogos?: string[];
  prizes: {
    total: string;
    first: string;
    second: string;
    contribution: string;
    top5_8?: string;
    top9_16?: string;
    top17_32?: string;
    top33_64?: string;
    top65_128?: string;
    top129_256?: string;
  };
  startDate: Date | null;
  status: string;
}

const COMPETITION_FORMAT_MAP: Record<string, string> = {
  '9_bi_xep_thap': '9 Ball - Xếp thấp',
  '9_bi_xep_cao': '9 Ball - Xếp cao',
  '10_bi': '10 Ball',
  '8_bi': '8 Ball',
};

function SponsorLogos({ logos }: { logos: string[] }) {
  if (logos.length === 0) {
    return (
      <div className="w-full flex justify-between">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-[220px] h-[100px] bg-[#7383A6]" />
        ))}
      </div>
    );
  }

  const rows: string[][] = [];
  for (let i = 0; i < logos.length; i += 6) {
    rows.push(logos.slice(i, i + 6));
  }

  return (
    <div className="flex flex-col" style={{ gap: '8px' }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="w-full flex justify-between">
          {row.map((logo, logoIndex) => (
            <div key={rowIndex * 6 + logoIndex} className="w-[220px] h-[100px] flex items-center justify-center">
              <img
                src={logo}
                alt={`Sponsor ${rowIndex * 6 + logoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) parent.className = 'w-[220px] h-[100px] bg-[#7383A6]';
                }}
              />
            </div>
          ))}
          {row.length < 6 && [...Array(6 - row.length)].map((_, i) => (
            <div key={`empty-${i}`} className="w-[220px] h-[100px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentSlug = typeof params.slug === 'string'
    ? params.slug
    : Array.isArray(params.slug) ? params.slug[0] : String(params.slug || '');

  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [rawTournament, setRawTournament] = useState<TournamentDetail | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bannerSrc, setBannerSrc] = useState<string>("/images/tour_banner.webp");

  useEffect(() => {
    if (rawTournament?.banner) {
      setBannerSrc(rawTournament.banner);
    } else {
      setBannerSrc("/images/tour_banner.webp");
    }
  }, [rawTournament?.banner]);

  const isAlreadyRegistered = !!user && players.some((p) => p.id === user.id);

  const handleRegistrationSuccess = () => {
    if (user) {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === user.id)) return prev;
        return [
          ...prev,
          {
            id: user.id,
            name: user.full_name || 'Không có tên',
            avatar: resolveImageUrl(user.avatar_url, ''),
            score: user.points ?? 0,
            rank: user.rank || 'N/A',
          },
        ];
      });
    }
    fetchRegistrations(tournamentSlug);
    fetchTournament();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tournament-registered', { detail: { slug: tournamentSlug } }));
    }
  };

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/login?redirect=/events/${tournamentSlug}`);
      return;
    }
    if (isAlreadyRegistered) return;
    setIsRegisterModalOpen(true);
  };

  const tournament = rawTournament ? {
    ...rawTournament,
    participants: {
      ...rawTournament.participants,
      current: players.length
    }
  } : null;

  // Events always show the full player list immediately upon registration
  const showFullList = true;

  const eventZaloConfig = EVENT_ZALO_QR_MAP[tournamentSlug] || (tournamentSlug.includes('tet-trung-thu') ? {
    url: 'https://zalo.me/g/ytqpxk355',
    title: 'Nhóm Zalo Sự Kiện Tết Trung Thu',
    subtitle: 'Quét mã QR hoặc nhấn vào nút bên cạnh để tham gia nhóm Zalo sự kiện',
  } : undefined);

  useEffect(() => {
    if (!tournamentSlug) return;
    setLoading(true);
    Promise.all([fetchTournament(), fetchRegistrations(tournamentSlug)]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentSlug]);

  const fetchTournament = async () => {
    if (!tournamentSlug || tournamentSlug === '[object Object]') {
      router.push('/events');
      return;
    }

    try {
      let data: any;
      try {
        const response = await tournamentAPI.getTournament(tournamentSlug);
        data = response.data;
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;

        // Fallback: try numeric ID lookup, then full scan
        const parsedId = parseInt(tournamentSlug);
        if (!isNaN(parsedId)) {
          try {
            const byIdResponse = await tournamentAPI.getTournamentById(String(parsedId));
            data = byIdResponse.data;
          } catch {
            throw error;
          }
        } else {
          // Slug is text but not found — scan all tournaments
          const allRes = await tournamentAPI.getTournaments();
          const all: any[] = allRes.data?.data || allRes.data || [];
          const found = all.find((t: any) => {
            if (t.slug === tournamentSlug) return true;
            const startDate = t.start_date ? new Date(t.start_date) : null;
            return generateSlug(t.name || '', startDate) === tournamentSlug;
          });
          if (found) data = found;
          else throw error;
        }
      }

      if (!data) return;

      // If this item is actually a tournament and not an event, redirect to tournaments detail
      if (data.category === 'tournament') {
        router.replace(`/tournaments/${data.slug || data.id}`);
        return;
      }

      const startDate = data.start_date ? new Date(data.start_date) : null;
      const endDate = data.end_date ? new Date(data.end_date) : null;
      const formatTimeStr = (t: string | null | undefined) => {
        if (!t) return null;
        // time string from DB is like "HH:MM:SS" or "HH:MM"
        return t.substring(0, 5).replace(':', 'h');
      };
      const mcStart = formatTimeStr(data.match_creation_time);
      const mcEnd = formatTimeStr(data.match_creation_time_end);
      const matchCreationTimeStr = mcStart
        ? (mcEnd ? `${mcStart} - ${mcEnd}` : mcStart)
        : null;
      const sortedRanks = data.ranks?.length > 0 ? sortRanks(data.ranks) : [];
      const competitionFormat = data.competition_format;

      const formatted: TournamentDetail = {
        id: data.id.toString(),
        title: data.name || 'SỰ KIỆN ARENA POOL',
        category: 'event',
        _isEvent: true,
        startTime: startDate
          ? `${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}, ${startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : 'Chưa xác định',
        endTime: endDate
          ? `${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}, ${endDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : 'Chưa xác định',
        matchCreationTime: matchCreationTimeStr ?? 'Chưa xác định',
        location: data.location || 'AZ POOL ARENA',
        type: competitionFormat || 'Chưa xác định',
        tournamentType: TOURNAMENT_TYPE_MAP[data.tournament_type] ?? data.tournament_type ?? 'Chưa xác định',
        participants: {
          current: data.registration_count || 0,
          max: data.number_of_players || 16,
        },
        format: COMPETITION_FORMAT_MAP[competitionFormat] ?? competitionFormat ?? 'Chưa xác định',
        rank: formatLevelRange(sortedRanks),
        phone: data.support_phone || 'Chưa có',
        registrationFee: data.free_registration_fee
          ? `FREE lệ phí${data.free_table_fee ? ' - FREE tiền bàn' : ' - Thua trả tiền bàn'}`
          : `${formatCurrency(data.registration_fee)}${data.free_table_fee ? ' - FREE tiền bàn' : ' - Thua trả tiền bàn'}`,
        registrationFeeAmount: data.registration_fee || 0,
        freeRegistrationFee: data.free_registration_fee || false,
        canRegister: data.can_register ?? true,
        logo: resolveImageUrl(data.detail_logo, ''),
        banner: resolveImageUrl(data.banner, '/images/tour_banner.webp'),
        sponsorLogos: Array.isArray(data.sponsor_logos)
          ? data.sponsor_logos.map((logo: string) => resolveImageUrl(logo, ''))
          : [],
        prizes: {
          total: formatCurrency(data.total_prize),
          first: formatCurrency(data.first_prize),
          second: formatCurrency(data.second_prize),
          contribution: formatCurrency(data.third_prize),
          top5_8: data.top_5_8_prize ? formatCurrency(data.top_5_8_prize) : undefined,
          top9_16: data.top_9_16_prize ? formatCurrency(data.top_9_16_prize) : undefined,
          top17_32: data.top_17_32_prize ? formatCurrency(data.top_17_32_prize) : undefined,
          top33_64: data.top_33_64_prize ? formatCurrency(data.top_33_64_prize) : undefined,
          top65_128: data.top_65_128_prize ? formatCurrency(data.top_65_128_prize) : undefined,
          top129_256: data.top_129_256_prize ? formatCurrency(data.top_129_256_prize) : undefined,
        },
        startDate,
        status: data.status || 'upcoming',
      };

      setRawTournament(formatted);
    } catch (error) {
      console.error('Failed to fetch event:', error);
      router.push('/events');
    }
  };

  const fetchRegistrations = async (slug: string) => {
    try {
      let response;
      const parsedId = parseInt(slug);
      if (!isNaN(parsedId)) {
        response = await tournamentAPI.getTournamentRegistrations(parsedId);
      } else {
        response = await tournamentAPI.getTournamentRegistrationsBySlug(slug);
      }
      const registeredPlayers: RegisteredPlayer[] = response.data || [];

      setPlayers(registeredPlayers.map((player) => ({
        id: player.id,
        name: player.full_name || 'Không có tên',
        avatar: resolveImageUrl(player.avatar_url, ''),
        score: player.points ?? 0,
        rank: player.rank || 'N/A',
      })));
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      setPlayers([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
        <NavBar />
        <TournamentDetailSkeleton />
        <TournamentNavbar activeTab="info" isEvent={true} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy sự kiện</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
      <NavBar />
      <h1 className="sr-only">{tournament.title}</h1>

      {/* MOBILE LAYOUT ONLY (block sm:hidden) */}
      <div className="block sm:hidden bg-[#F0F2F4]">
        {/* Banner Image */}
        <div className="relative w-full h-[180px] bg-gray-200 overflow-hidden">
          <Image
            src={bannerSrc}
            alt={tournament.title}
            fill
            className="object-cover"
            priority
            onError={() => setBannerSrc('/images/tour_banner.webp')}
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Main Content Area */}
        <div className="px-4 -mt-[70px] pb-8 relative z-10 flex flex-col gap-5">
          
          {/* 1. THÔNG TIN CHUNG CARD */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(23,35,57,0.06)] border border-gray-100/50 w-full h-auto flex flex-col relative pt-[60px] pb-[40px] px-6">
            {/* Card Header (Floating Tab rounded-b) */}
            <div 
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-[#172339] text-white w-[82%] h-[44px] flex items-center justify-center rounded-b-[20px] shadow-[0_4px_6px_rgba(0,0,0,0.1)] z-20"
            >
              <span 
                className="font-bold text-[14px] tracking-[0.5px] uppercase text-center" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Thông tin chung
              </span>
            </div>
            
            {/* Card Body (Layout gap of 8px) */}
            <div className="flex-1 flex flex-col gap-2">
              
              {/* Logo Placeholder / Image */}
              {tournament.logo ? (
                <div className="flex justify-center h-[50px] relative items-center flex-shrink-0">
                  <img
                    src={tournament.logo}
                    alt="Tournament Logo"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-[180px] h-[50px] bg-gray-100 rounded-md mx-auto flex-shrink-0" />
              )}

              {/* Start Time */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none" className="flex-shrink-0">
                    <path d="M12.75 2.75V0.75M12.75 2.75V4.75M12.75 2.75H8.25M0.75 8.75V17.75C0.75 18.8546 1.64543 19.75 2.75 19.75H16.75C17.8546 19.75 18.75 18.8546 18.75 17.75V8.75H0.75Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0.75 8.75V4.75C0.75 3.64543 1.64543 2.75 2.75 2.75H4.75" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.75 0.75V4.75" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.75 8.75V4.75C18.75 3.64543 17.8546 2.75 16.75 2.75H16.25" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5033 11.75H8.51228" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.80212 11.75H4.81111" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.80212 14.75H4.81111" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Thời gian bắt đầu
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.startTime}
                </div>
              </div>

              {/* End Time */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none" className="flex-shrink-0">
                    <path d="M12.75 2.75V0.75M12.75 2.75V4.75M12.75 2.75H8.25M0.75 8.75V17.75C0.75 18.8546 1.64543 19.75 2.75 19.75H16.75C17.8546 19.75 18.75 18.8546 18.75 17.75V8.75H0.75Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0.75 8.75V4.75C0.75 3.64543 1.64543 2.75 2.75 2.75H4.75" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.75 0.75V4.75" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.75 8.75V4.75C18.75 3.64543 17.8546 2.75 16.75 2.75H16.25" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5033 11.75H8.51228" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.80212 11.75H4.81111" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.80212 14.75H4.81111" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Thời gian kết thúc
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.endTime}
                </div>
              </div>

              {/* Match Creation Time */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none" className="flex-shrink-0">
                    <path d="M12.75 2.75V0.75M12.75 2.75V4.75M12.75 2.75H8.25M0.75 8.75V17.75C0.75 18.8546 1.64543 19.75 2.75 19.75H16.75C17.8546 19.75 18.75 18.8546 18.75 17.75V8.75H0.75Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0.75 8.75V4.75C0.75 3.64543 1.64543 2.75 2.75 2.75H4.75" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.75 0.75V4.75" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.75 8.75V4.75C18.75 3.64543 17.8546 2.75 16.75 2.75H16.25" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5033 11.75H8.51228" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.80212 11.75H4.81111" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.80212 14.75H4.81111" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Thời gian tạo trận đấu
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.matchCreationTime || 'Chưa xác định'}
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none" className="flex-shrink-0">
                    <path d="M14.407 14.4067L10.164 18.6497C9.78899 19.0243 9.28059 19.2348 8.7505 19.2348C8.22042 19.2348 7.71202 19.0243 7.337 18.6497L3.093 14.4067C1.97422 13.2879 1.21234 11.8624 0.903691 10.3106C0.595043 8.75873 0.753494 7.15022 1.35901 5.68844C1.96452 4.22665 2.9899 2.97725 4.30548 2.09821C5.62107 1.21918 7.16777 0.75 8.75 0.75C10.3322 0.75 11.8789 1.21918 13.1945 2.09821C14.5101 2.97725 15.5355 4.22665 16.141 5.68844C16.7465 7.15022 16.905 8.75873 16.5963 10.3106C16.2877 11.8624 15.5258 13.2879 14.407 14.4067V14.4067Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="8.75" cy="7.75" r="3" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Địa điểm
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.location}
                </div>
              </div>

              {/* Rank */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20" fill="none" className="flex-shrink-0">
                    <path d="M3.68262 12.7283L3.68262 9.63033L10.733 9.63032M17.7835 12.7283L17.7835 9.63032L10.733 9.63032M10.733 9.63032L10.733 6.92926" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.72106 18.9076L2.95614 18.9076C2.68258 18.9076 2.43991 18.8988 2.2237 18.8679C1.06327 18.7399 0.75 18.1926 0.75 16.7007L0.75 14.9352C0.75 13.4434 1.06327 12.8961 2.2237 12.7681C2.4399 12.7372 2.68258 12.7283 2.95614 12.7283L4.72106 12.7283C4.99462 12.7283 5.23729 12.7372 5.4535 12.7681C6.61393 12.8961 6.9272 13.4434 6.9272 14.9352L6.9272 16.7007C6.9272 18.1926 6.61393 18.7399 5.4535 18.8679C5.23729 18.8988 4.99462 18.9076 4.72106 18.9076Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.6166 6.92932L9.85165 6.92932C9.57809 6.92932 9.33541 6.92049 9.11921 6.8896C7.95878 6.7616 7.64551 6.21429 7.64551 4.72244L7.64551 2.95694C7.64551 1.46509 7.95878 0.917784 9.11921 0.789785C9.33541 0.758889 9.57809 0.750061 9.85165 0.750061L11.6166 0.750061C11.8901 0.750061 12.1328 0.758888 12.349 0.789785C13.5094 0.917784 13.8227 1.46509 13.8227 2.95694L13.8227 4.72244C13.8227 6.21429 13.5094 6.7616 12.349 6.8896C12.1328 6.92049 11.8901 6.92932 11.6166 6.92932Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5091 18.9076L16.7442 18.9076C16.4707 18.9076 16.228 18.8988 16.0118 18.8679C14.8514 18.7399 14.5381 18.1926 14.5381 16.7007L14.5381 14.9352C14.5381 13.4434 14.8514 12.8961 16.0118 12.7681C16.228 12.7372 16.4707 12.7283 16.7442 12.7283L18.5091 12.7283C18.7827 12.7283 19.0254 12.7372 19.2416 12.7681C20.402 12.8961 20.7153 13.4434 20.7153 14.9352L20.7153 16.7007C20.7153 18.1926 20.402 18.7399 19.2416 18.8679C19.0254 18.8988 18.7827 18.9076 18.5091 18.9076Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Level
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.rank}
                </div>
              </div>

              {/* Participants */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 21.5V19.3333C4 18.1841 4.57946 17.0819 5.61091 16.2692C6.64236 15.4565 8.04131 15 9.5 15H15C16.4587 15 17.8576 15.4565 18.8891 16.2692C19.9205 17.0819 20.5 18.1841 20.5 19.3333V21.5" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Số người tham gia
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.participants.current} người
                </div>
              </div>

              {/* Support Phone */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                    <path d="M2.86765 0.75H7.10294L9.22059 6.04412L6.57353 7.63235C7.70749 9.93162 9.56838 11.7925 11.8676 12.9265L13.4559 10.2794L18.75 12.3971V16.6324C18.75 17.194 18.5269 17.7326 18.1298 18.1298C17.7326 18.5269 17.194 18.75 16.6324 18.75C12.5022 18.499 8.60663 16.7451 5.68076 13.8192C2.75489 10.8934 1.00099 6.99784 0.75 2.86765C0.75 2.30601 0.973109 1.76738 1.37024 1.37024C1.76738 0.973109 2.30601 0.75 2.86765 0.75" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    SĐT hỗ trợ
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.phone}
                </div>
              </div>

            </div>
          </div>

          {/* 2. PRIZE & COUNTDOWN & BUTTON CARD */}
          <div className="bg-[#172339] text-white rounded-2xl p-4 w-full h-auto flex flex-col justify-between shadow-[0_10px_30px_rgba(23,35,57,0.15)] relative overflow-hidden -mt-[36px] pb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -z-10" />

            {/* Total Prize Box */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Tổng giải thưởng</span>
              <span className="text-[24px] font-black italic text-white leading-[32px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tournament.prizes.total}
              </span>
            </div>

            {/* First Prize */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Top 1</span>
              <span className="text-[20px] font-extrabold italic text-white leading-[28px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tournament.prizes.first}
              </span>
            </div>

            {/* Second Prize */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Top 2</span>
              <span className="text-[20px] font-extrabold italic text-white leading-[28px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tournament.prizes.second}
              </span>
            </div>

            {/* Third Prize */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Top 3</span>
              <span className="text-[20px] font-extrabold italic text-white leading-[28px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tournament.prizes.contribution}
              </span>
            </div>

            {/* Optional Additional Prizes */}
            {tournament.prizes.top5_8 && (
              <div className="flex flex-col py-3 px-4 w-full">
                <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Top 5-8</span>
                <span className="text-[20px] font-extrabold italic text-white leading-[28px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {tournament.prizes.top5_8}
                </span>
              </div>
            )}

            {/* Countdown timer */}
            <div className="flex flex-col items-center justify-center py-1">
              <CountdownTimer targetDate={tournament.startDate} status={tournament.status} />
            </div>

            {/* Button */}
            <button
              onClick={handleRegisterClick}
              disabled={isAlreadyRegistered || tournament.canRegister === false}
              className={`w-full text-white font-medium text-[16px] leading-[24px] h-[40px] py-2 px-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                isAlreadyRegistered
                  ? "bg-[#00B814] cursor-not-allowed"
                  : tournament.canRegister === false
                  ? "bg-[#808996] cursor-not-allowed"
                  : "bg-[#D22E39] hover:bg-[#b5242e] hover:shadow-lg active:scale-[0.98]"
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {isAlreadyRegistered
                ? "Đã đăng ký"
                : tournament.canRegister === false
                ? "Khóa đăng ký"
                : "Đăng ký ngay"}
            </button>
          </div>

          {/* 3. CHAMPIONSHIP BANNER (Mobile: exact 361x74 ratio, same as tournaments listing page) */}
          <ChampionshipBanner />

          {/* 4. SPONSOR LOGOS (3-Column Grid on Mobile with transparent background) */}
          <div className="w-full px-1">
            <div className="grid grid-cols-3 gap-3 w-full">
              {(tournament.sponsorLogos && tournament.sponsorLogos.length > 0 ? tournament.sponsorLogos : [...Array(6)]).map((logo, i) => (
                <div key={i} className="w-full aspect-[120/54] flex items-center justify-center p-1">
                  {logo ? (
                    <img
                      src={logo}
                      alt={`Sponsor ${i + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100/10 rounded-lg flex items-center justify-center text-[10px] text-gray-400/50">Logo</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. PLAYER LIST SECTION */}
          <div className="w-full">
            <PlayerListSection
              players={players}
              maxPlayers={tournament?.participants.max}
              currentUserId={user?.id}
              showFullList={showFullList}
              isEvent={true}
              onClose={() => {}}
              qrCodeUrl={eventZaloConfig?.url}
              qrCodeTitle={eventZaloConfig?.title}
              qrCodeSubtitle={eventZaloConfig?.subtitle}
            />
          </div>

        </div>
      </div>

      {/* DESKTOP LAYOUT ONLY (hidden sm:block) */}
      <div className="hidden sm:block relative w-full">
        {/* Banner Background */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[#172339] overflow-hidden">
          <Image
            src={bannerSrc}
            alt={tournament.title}
            fill
            className="object-cover object-top"
            priority
            onError={() => setBannerSrc('/images/tour_banner.webp')}
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>
        
        <div className="relative z-10 flex flex-col w-full">
          <main className="w-full max-w-[1360px] mx-auto pt-[288px] flex flex-col gap-4">
            <TournamentInfoCard tournament={tournament} onRegister={handleRegisterClick} />

            <PrizeSection
              prizes={tournament.prizes}
              targetDate={tournament.startDate}
              participants={tournament.participants}
              status={tournament.status}
              onRegister={handleRegisterClick}
              isRegistered={isAlreadyRegistered}
              canRegister={tournament.canRegister}
              isEvent={true}
              className="-mt-[30px] relative z-20"
            />

            <ChampionshipBanner className="my-8" />

            {/* Sponsors */}
            <div className="w-full">
              <SponsorLogos logos={tournament.sponsorLogos || []} />
            </div>

            <PlayerListSection
              players={players}
              maxPlayers={tournament?.participants.max}
              currentUserId={user?.id}
              showFullList={showFullList}
              isEvent={true}
              onClose={() => {}}
              qrCodeUrl={eventZaloConfig?.url}
              qrCodeTitle={eventZaloConfig?.title}
              qrCodeSubtitle={eventZaloConfig?.subtitle}
            />
          </main>
        </div>
      </div>

      <TournamentNavbar activeTab="info" isEvent={true} />

      {/* Payment / Registration Modal */}
      <RegisterTournamentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
        tournament={{
          id: tournament.id,
          title: tournament.title,
          registrationFeeAmount: tournament.registrationFeeAmount,
          freeRegistrationFee: tournament.freeRegistrationFee,
        }}
        user={
          user
            ? {
                id: user.id,
                fullName: user.full_name || "Không có tên",
                phoneNumber: user.phone_number || "",
                rank: user.rank || "N/A",
              }
            : null
        }
      />
    </div>
  );
}
