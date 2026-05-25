"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Spin } from "antd";
import {
  ChampionshipBanner,
  TournamentNavbar,
  TournamentInfoCard,
  PlayerListSection,
  PrizeSection,
} from "@/components";
import NavBar from "@/components/NavBar";
import { tournamentAPI } from "@/api/tournament.api";
import { sortRanks, resolveImageUrl, formatCurrency, generateSlug } from "@/lib/tournament-utils";

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

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

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
        rank: sortedRanks.length > 0 ? `Hạng ${sortedRanks.join('-')}` : 'Tất cả hạng',
        phone: data.support_phone || 'Chưa có',
        registrationFee: `${formatCurrency(data.registration_fee)}${data.free_table_fee ? ' - FREE tiền bàn' : ' - Thua trả tiền bàn'}`,
        logo: resolveImageUrl(data.organizer_logo, resolveImageUrl(data.banner, '')),
        banner: resolveImageUrl(data.banner, '/images/tour_banner.png'),
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
      };

      setTournament(formatted);
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      router.push('/tournaments');
    }
  };

  const fetchRegistrations = async (slug: string) => {
    try {
      const response = await tournamentAPI.getTournamentRegistrationsBySlug(slug);
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
      <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Đang tải thông tin giải đấu...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy giải đấu</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] pb-24">
      <NavBar />
      <div
        className="flex flex-col bg-[length:1920px_450px] bg-no-repeat"
        style={{ backgroundImage: `url(${tournament.banner || '/images/tour_banner.png'})` }}
      >
        <main className="w-full max-w-[1360px] mx-auto mt-[288px] flex flex-col gap-4">
          <TournamentInfoCard tournament={tournament} onRegister={() => {}} />

          <PrizeSection
            prizes={tournament.prizes}
            targetDate={tournament.startDate}
            onRegister={() => {}}
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

      <TournamentNavbar activeTab="info" />
    </div>
  );
}
