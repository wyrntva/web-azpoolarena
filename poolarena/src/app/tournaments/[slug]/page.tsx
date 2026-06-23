"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { Spin } from "antd";
import {
  ChampionshipBanner,
  TournamentNavbar,
  TournamentInfoCard,
  PlayerListSection,
  PrizeSection,
  CountdownTimer,
} from "@/components";
import NavBar from "@/components/NavBar";

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

interface TournamentDetail {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
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

export default function TournamentDetailPage() {
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

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/login?redirect=/tournaments/${tournamentSlug}`);
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

  useEffect(() => {
    if (!tournamentSlug) return;
    setLoading(true);
    Promise.all([fetchTournament(), fetchRegistrations(tournamentSlug)]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentSlug]);

  const fetchTournament = async () => {
    if (!tournamentSlug || tournamentSlug === '[object Object]') {
      router.push('/tournaments');
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

      const startDate = data.start_date ? new Date(data.start_date) : null;
      const endDate = data.end_date ? new Date(data.end_date) : null;
      const sortedRanks = data.ranks?.length > 0 ? sortRanks(data.ranks) : [];
      const competitionFormat = data.competition_format;

      const formatted: TournamentDetail = {
        id: data.id.toString(),
        title: data.name || 'GIẢI ĐẤU ARENA POOL',
        startTime: startDate
          ? `${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}, ${startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : 'Chưa xác định',
        endTime: endDate
          ? `${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}, ${endDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : 'Chưa xác định',
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
      console.error('Failed to fetch tournament:', error);
      router.push('/tournaments');
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
      <div className="min-h-screen bg-[#F0F2F4] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Đang tải thông tin giải đấu...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy giải đấu</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
      <NavBar />

      {/* MOBILE LAYOUT ONLY (block sm:hidden) */}
      <div className="block sm:hidden bg-[#F0F2F4]">
        {/* Banner Image */}
        <div className="relative w-full h-[180px] bg-gray-200 overflow-hidden">
          <Image
            src={bannerSrc}
            alt={tournament.title}
            fill
            unoptimized
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
                  {tournament.participants.current}/{tournament.participants.max} người
                </div>
              </div>

              {/* Registration Fee */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none" className="flex-shrink-0">
                    <path d="M10.5 20.25C15.8848 20.25 20.25 15.8848 20.25 10.5C20.25 5.11522 15.8848 0.75 10.5 0.75C5.11522 0.75 0.75 5.11522 0.75 10.5C0.75 15.8848 5.11522 20.25 10.5 20.25Z" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.1001 7.71417C12.9319 7.42238 12.6875 7.18182 12.393 7.01825C12.0986 6.85469 11.7653 6.77426 11.4286 6.7856H9.5715C9.07895 6.7856 8.60658 6.98126 8.2583 7.32954C7.91002 7.67782 7.71436 8.1502 7.71436 8.64274C7.71436 9.13529 7.91002 9.60766 8.2583 9.95594C8.60658 10.3042 9.07895 10.4999 9.5715 10.4999H11.4286C11.9212 10.4999 12.3936 10.6955 12.7418 11.0438C13.0901 11.3921 13.2858 11.8645 13.2858 12.357C13.2858 12.8496 13.0901 13.3219 12.7418 13.6702C12.3936 14.0185 11.9212 14.2142 11.4286 14.2142H9.5715C9.23488 14.2255 8.90152 14.1451 8.6071 13.9815C8.31268 13.8179 8.06828 13.5774 7.90007 13.2856" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.5 14.2143V16.0714M10.5 4.92859V6.78573" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Lệ phí
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.registrationFee}
                </div>
              </div>

              {/* Format */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <circle cx="12" cy="2.6" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="9.7" cy="7.2" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="14.3" cy="7.2" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="7.4" cy="11.8" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="12" cy="11.8" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="16.6" cy="11.8" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="9.7" cy="16.4" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="14.3" cy="16.4" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                    <circle cx="12" cy="21.0" r="1.9" fill="none" stroke="var(--Grey-400, #575E70)" strokeWidth="1.5" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Thể thức thi đấu
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.format}
                </div>
              </div>

              {/* Tournament Type */}
              <div className="flex flex-col py-3 px-4 w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="19" viewBox="0 0 21 19" fill="none" className="flex-shrink-0">
                    <path d="M15.2033 14.9974H8.93707C8.8236 15.6692 8.559 16.3064 8.16337 16.861C7.76767 17.4157 7.2513 17.8732 6.65303 18.1991C6.05483 18.5251 5.39035 18.711 4.7098 18.7427C4.02927 18.7745 3.3504 18.6514 2.7244 18.3825C2.09839 18.1137 1.5416 17.7062 1.096 17.1909C0.650407 16.6756 0.327637 16.0657 0.15204 15.4075C-0.0235579 14.7492 -0.0473931 14.0597 0.0823119 13.3909C0.212024 12.722 0.491902 12.0914 0.90084 11.5465C0.96 11.4677 1.03409 11.4013 1.1189 11.3512C1.2037 11.3011 1.29756 11.2681 1.3951 11.2542C1.49265 11.2403 1.59198 11.2458 1.68741 11.2702C1.78285 11.2948 1.87252 11.3378 1.95131 11.397C2.03011 11.4562 2.09647 11.5303 2.14663 11.615C2.19679 11.6998 2.22975 11.7937 2.24363 11.8912C2.25752 11.9888 2.25205 12.0881 2.22756 12.1835C2.20306 12.279 2.16 12.3687 2.10084 12.4474C1.70947 12.9658 1.49872 13.598 1.50084 14.2474C1.50084 15.0431 1.81691 15.8062 2.37952 16.3687C2.94213 16.9314 3.70519 17.2474 4.50084 17.2474C5.29649 17.2474 6.05955 16.9314 6.6222 16.3687C7.18477 15.8062 7.50082 15.0431 7.50082 14.2474C7.50082 14.0485 7.57987 13.8577 7.7205 13.7171C7.8612 13.5765 8.05192 13.4974 8.25082 13.4974H15.2033C15.3685 13.2115 15.6233 12.988 15.9283 12.8617C16.2334 12.7353 16.5716 12.7131 16.8906 12.7986C17.2096 12.884 17.4914 13.0723 17.6924 13.3343C17.8934 13.5963 18.0024 13.9172 18.0024 14.2474C18.0024 14.5777 17.8934 14.8986 17.6924 15.1606C17.4914 15.4225 17.2096 15.6109 16.8906 15.6964C16.5716 15.7818 16.2334 15.7597 15.9283 15.6333C15.6233 15.5069 15.3685 15.2834 15.2033 14.9974ZM4.50084 15.7474C4.76064 15.7475 5.01601 15.6802 5.24194 15.5519C5.46787 15.4236 5.6566 15.2389 5.78968 15.0157C5.92274 14.7926 5.99557 14.5387 6.00105 14.279C6.00653 14.0192 5.94441 13.7626 5.82084 13.534L9.1743 8.08341C9.27833 7.91406 9.31095 7.71029 9.2649 7.51694C9.21885 7.32359 9.09787 7.15641 8.92867 7.05216C8.5278 6.80534 8.1906 6.46769 7.94438 6.06644C7.69823 5.66526 7.54987 5.2117 7.5114 4.74253C7.47292 4.27336 7.54545 3.80172 7.72305 3.36576C7.90057 2.92979 8.1783 2.54173 8.53358 2.23296C8.88893 1.92418 9.31192 1.70336 9.76845 1.58835C10.2249 1.47333 10.7021 1.46736 11.1613 1.5709C11.6205 1.67444 12.0489 1.8846 12.4118 2.18437C12.7747 2.48415 13.0621 2.86512 13.2505 3.29651C13.3301 3.47889 13.4788 3.62219 13.6641 3.69489C13.8493 3.76758 14.0558 3.76373 14.2381 3.68416C14.4205 3.6046 14.5639 3.45585 14.6365 3.27063C14.7093 3.0854 14.7054 2.87889 14.6258 2.69651C14.3557 2.07891 13.9502 1.5299 13.4394 1.09003C12.9286 0.650164 12.3254 0.330679 11.6746 0.155179C11.0237 -0.0203212 10.3417 -0.0473512 9.67905 0.0760838C9.01635 0.199519 8.38987 0.470269 7.84582 0.868324C7.30177 1.26639 6.8541 1.78158 6.53595 2.37586C6.21772 2.97014 6.03712 3.62832 6.00742 4.30177C5.97772 4.97522 6.09967 5.64674 6.36435 6.26669C6.62902 6.88671 7.0296 7.43931 7.53645 7.88369L4.54209 12.7474C4.52803 12.7474 4.5149 12.7474 4.50084 12.7474C4.10302 12.7474 3.72148 12.9055 3.44018 13.1868C3.15888 13.4681 3.00084 13.8496 3.00084 14.2474C3.00084 14.6452 3.15888 15.0268 3.44018 15.3081C3.72148 15.5894 4.10302 15.7474 4.50084 15.7474ZM16.5008 9.74744C15.9226 9.74751 15.3497 9.85859 14.8133 10.0747L11.8208 5.20995C11.9768 4.92099 12.0337 4.58884 11.9827 4.26447C11.9317 3.94008 11.7756 3.6414 11.5385 3.41426C11.3014 3.18711 10.9963 3.04404 10.67 3.00702C10.3438 2.96999 10.0144 3.04104 9.73238 3.20928C9.45038 3.37751 9.23138 3.63363 9.10898 3.93832C8.98658 4.24302 8.96753 4.57947 9.05475 4.89602C9.14205 5.21258 9.33075 5.49179 9.59198 5.69069C9.8532 5.88966 10.1725 5.99744 10.5008 5.99744H10.5421L13.8964 11.449C14.0008 11.6181 14.1681 11.7388 14.3614 11.7847C14.5548 11.8306 14.7585 11.7979 14.9277 11.6937C15.3226 11.4503 15.7685 11.3017 16.2304 11.2597C16.6924 11.2177 17.1578 11.2835 17.5901 11.4517C18.0224 11.62 18.4098 11.8862 18.7218 12.2294C19.0338 12.5726 19.262 12.9835 19.3885 13.4299C19.5149 13.8762 19.5361 14.3457 19.4503 14.8016C19.3647 15.2575 19.1745 15.6873 18.8947 16.0572C18.6148 16.4272 18.253 16.7272 17.8376 16.9337C17.4223 17.1403 16.9647 17.2476 16.5008 17.2474C16.3019 17.2474 16.1112 17.3265 15.9705 17.4671C15.8299 17.6077 15.7508 17.7985 15.7508 17.9974C15.7508 18.1963 15.8299 18.3871 15.9705 18.5278C16.1112 18.6685 16.3019 18.7474 16.5008 18.7474C17.6943 18.7474 18.8389 18.2734 19.6828 17.4295C20.5268 16.5855 21.0008 15.4409 21.0008 14.2474C21.0008 13.054 20.5268 11.9094 19.6828 11.0655C18.8389 10.2215 17.6943 9.74744 16.5008 9.74744Z" fill="var(--Grey-400, #575E70)" />
                  </svg>
                  <span 
                    className="text-[#575E70] text-[16px] leading-[24px] font-normal" 
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Loại giải đấu
                  </span>
                </div>
                <div 
                  className="text-[#37393E] text-[16px] leading-[24px] font-semibold mt-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tournament.tournamentType || 'Chưa xác định'}
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

            {/* Total Prize Box (transparent layout with exact 12px 16px padding) */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Tổng giải thưởng</span>
              <span className="text-[24px] font-black italic text-white leading-[32px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tournament.prizes.total}
              </span>
            </div>

            {/* First Prize */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Vô địch</span>
              <span className="text-[20px] font-extrabold italic text-white leading-[28px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tournament.prizes.first}
              </span>
            </div>

            {/* Second Prize */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Giải nhì</span>
              <span className="text-[20px] font-extrabold italic text-white leading-[28px] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tournament.prizes.second}
              </span>
            </div>

            {/* Third Prize */}
            <div className="flex flex-col py-3 px-4 w-full">
              <span className="text-[16px] text-[#BAE3FF] font-normal leading-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Đồng giải ba</span>
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
              disabled={isAlreadyRegistered || tournament.canRegister === false || tournament.participants.current >= tournament.participants.max}
              className={`w-full text-white font-medium text-[16px] leading-[24px] h-[40px] py-2 px-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                isAlreadyRegistered
                  ? "bg-[#00B814] cursor-not-allowed"
                  : (tournament.canRegister === false || tournament.participants.current >= tournament.participants.max)
                  ? "bg-[#808996] cursor-not-allowed"
                  : "bg-[#D22E39] hover:bg-[#b5242e] hover:shadow-lg active:scale-[0.98]"
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {isAlreadyRegistered
                ? "Đã đăng ký"
                : tournament.canRegister === false
                ? "Khóa đăng ký"
                : tournament.participants.current >= tournament.participants.max
                ? "Đã đầy"
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
            <PlayerListSection players={players} onClose={() => {}} />
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
            unoptimized
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
              className="-mt-[30px] relative z-20"
            />

            <ChampionshipBanner className="my-8" />

            {/* Sponsors */}
            <div className="w-full">
              <SponsorLogos logos={tournament.sponsorLogos || []} />
            </div>

            <PlayerListSection players={players} onClose={() => {}} />
          </main>
        </div>
      </div>

      <TournamentNavbar activeTab="info" />

      {/* Payment / Registration Modal */}
      <RegisterTournamentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
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
