"use client";

import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, Pagination } from "antd";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import Image from "next/image";
import api from "@/config/axios";
import { resolveImageUrl, formatFullLevel } from "@/lib/tournament-utils";

const { Option } = Select;

interface PoolArenaUser {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  gender: string | null;
  address: string | null;
  rank: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  points: number;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  created_at: string;
  updated_at: string;
}

interface TournamentRank {
  id: number;
  order: number;
  name: string;
  min_score: number;
  max_score: number;
  default_score: number;
  created_at: string;
  updated_at: string;
}
const PlayerRow = memo(function PlayerRow({
  player,
  index,
  isTop5 = false,
}: {
  player: PoolArenaUser;
  index: number;
  isTop5?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(() =>
    resolveImageUrl(player.avatar_url, '/images/imageprofile.png')
  );

  useEffect(() => {
    setImgSrc(resolveImageUrl(player.avatar_url, '/images/imageprofile.png'));
  }, [player.avatar_url]);

  if (isTop5) {
    return (
      <div className="group">
        <Link href={`/player/${player.id}`} className="block">
          <div className="flex items-center py-[11px] px-2 sm:px-4 rounded-xl hover:bg-[#F0F2F5] hover:scale-[1.01] hover:shadow-md transition-all duration-300 cursor-pointer border border-transparent">
            {/* Mobile Rank Column */}
            <div className="flex md:hidden w-[52px] flex-shrink-0 flex-row items-baseline gap-[4px] justify-center">
              <span 
                className="font-bold italic text-[#575E70] text-[24px] leading-[32px] text-center" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                #
              </span>
              <span 
                className="font-bold italic text-[#575E70] text-[30px] leading-[48px] text-center" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {index + 1}
              </span>
            </div>

            {/* Desktop Rank Column */}
            <div className="hidden md:flex w-16 flex-shrink-0 items-baseline gap-[4px]">
              <span className="font-bold italic text-[#575E70] text-2xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>#</span>
              <span className="font-bold italic text-[#575E70] text-3xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>{index + 1}</span>
            </div>

            {/* Avatar Column */}
            <div className="w-[56px] h-[70px] sm:w-[60px] sm:h-[75px] flex-shrink-0 relative mr-4 sm:mr-8 ml-1 sm:ml-4 transition-transform duration-300 group-hover:scale-110">
              <Image
                src={imgSrc}
                alt={player.full_name}
                fill
                unoptimized
                className="object-contain"
                sizes="60px"
                onError={() => setImgSrc('/images/imageprofile.png')}
              />
            </div>

            {/* Mobile: Stacked Details */}
            <div className="flex md:hidden flex-1 flex-col justify-start min-w-0">
              <h3 className="text-base font-bold text-gray-800 m-0 leading-tight truncate">{player.full_name}</h3>
              <span className="text-xs font-medium text-gray-400 mt-0.5">
                {formatFullLevel(player.rank)}
              </span>
              <span className="text-base font-black italic text-gray-700 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {player.points ?? 0}
              </span>
            </div>

            {/* Desktop: Standard Layout */}
            <div className="hidden md:flex flex-1 items-center justify-between min-w-0">
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-xl font-bold text-gray-800 m-0 leading-tight truncate">{player.full_name}</h3>
                <span className="text-base font-medium text-gray-400 mt-1">
                  {formatFullLevel(player.rank)}
                </span>
              </div>
              <div className="text-right pl-2">
                <span className="text-2xl font-black italic text-gray-500 transform group-hover:scale-110 inline-block transition-transform duration-300" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {player.points ?? 0}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <Link href={`/player/${player.id}`} className="block">
      {/* Mobile View */}
      <div className="flex md:hidden bg-white rounded-[16px] shadow-md w-full py-3 px-6 items-center justify-between hover:bg-blue-50/10 transition-all duration-300 cursor-pointer border border-transparent group">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          {/* Rank Column */}
          <div className="flex-shrink-0 flex items-baseline gap-[4px]">
            <span className="font-bold italic text-[#575E70] text-[18px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>#</span>
            <span className="font-bold italic text-[#575E70] text-[18px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{index + 1}</span>
          </div>
          {/* Name & Rank Stacked */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h3 className="text-[18px] font-bold text-gray-800 m-0 truncate leading-snug">{player.full_name}</h3>
            <span className="text-sm font-medium text-gray-400 mt-0.5">
              {formatFullLevel(player.rank)}
            </span>
          </div>
        </div>
        {/* Points Column */}
        <div className="text-right pl-6 flex-shrink-0">
          <span className="text-[18px] font-black italic text-gray-700 group-hover:scale-110 inline-block transition-transform duration-300" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {player.points ?? 0}
          </span>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex bg-white rounded-[16px] shadow-md w-full h-[72px] flex items-center px-12 hover:bg-blue-50/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer border border-transparent group">
        <div className="w-16 flex-shrink-0 flex items-baseline gap-[4px]">
          <span className="font-bold italic text-[#575E70] text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>#</span>
          <span className="font-bold italic text-[#575E70] text-[18px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{index + 1}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center ml-4 min-w-0">
          <h3 className="text-base font-bold text-gray-800 m-0 truncate">{player.full_name}</h3>
          <span className="text-xs text-gray-400">
            {formatFullLevel(player.rank)}
          </span>
        </div>
        <div className="text-right pl-2">
          <span className="text-xl font-black italic text-gray-500 group-hover:scale-110 inline-block transition-transform duration-300" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {player.points ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
});

const ITEMS_PER_PAGE = 10000;

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PoolArenaUser[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [ranks, setRanks] = useState<TournamentRank[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedRank, setSelectedRank] = useState<string>("all");
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-public'],
    queryFn: () => api.get('/api/store-settings/public').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const bannerSrc = (() => {
    const raw = storeSettings?.banner_ranking;
    if (!raw) return "/images/tour_banner.png";
    let urls: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) urls = parsed.filter(Boolean);
      else if (typeof parsed === 'string' && parsed.length > 0) urls = [parsed];
    } catch { urls = [raw]; }
    const first = urls[0];
    if (!first) return "/images/tour_banner.png";
    return resolveImageUrl(first, "/images/tour_banner.png");
  })();

  const isInitialLoad = useRef(true);

  const buildLeaderboardParams = useCallback((page: number, rank: string, tab: number) => {
    const params: Record<string, string> = {
      skip: String((page - 1) * ITEMS_PER_PAGE),
      limit: String(ITEMS_PER_PAGE),
    };
    if (rank !== 'all') params.rank = rank;
    if (tab === 1) params.gender = 'female';
    else if (tab === 2) params.gender = 'male';
    return params;
  }, []);

  const parseLeaderboardResponse = (data: any) => ({
    players: data.data ?? [],
    total: data.total ?? data.meta?.total ?? 0,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [leaderboardRes, ranksRes] = await Promise.all([
          api.get('/api/pool-arena/users', { params: buildLeaderboardParams(1, 'all', 0) }),
          api.get('/api/tournament-settings/ranks'),
        ]);

        const { players: initialPlayers, total } = parseLeaderboardResponse(leaderboardRes.data);
        setPlayers(initialPlayers);
        setTotalPlayers(total);
        setRanks(ranksRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setInitialLoading(false);
        isInitialLoad.current = false;
      }
    };

    fetchInitialData();
  }, [buildLeaderboardParams]);

  useEffect(() => {
    if (isInitialLoad.current) return;

    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/api/pool-arena/users', {
          params: buildLeaderboardParams(currentPage, selectedRank, activeTab),
        });
        const { players: updated, total } = parseLeaderboardResponse(res.data);
        setPlayers(updated);
        setTotalPlayers(total);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
    };

    fetchLeaderboard();
  }, [currentPage, selectedRank, activeTab, buildLeaderboardParams]);

  const top5Players = currentPage === 1 ? players.slice(0, 5) : [];
  const otherPlayers = currentPage === 1 ? players.slice(5) : players;

  const handleFilterChange = useCallback((value: string) => {
    setSelectedRank(value);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab: number) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
        <NavBar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans">
      <NavBar />

      {/* Banner */}
      <div className="relative h-[200px] sm:h-[300px] md:h-[400px] w-full bg-gray-200 overflow-hidden">
        <Image
          src={bannerSrc}
          alt="Leaderboard banner"
          fill
          unoptimized
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="h-[4px] w-full bg-[#172339]" />
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 -mt-12 sm:-mt-20 md:-mt-[126px] relative z-10 flex flex-col gap-[12px]">

        {/* Tabs */}
        <div className="absolute -top-[25px] min-[360px]:-top-[30px] sm:-top-[56px] left-[32px] min-[360px]:left-[48px] min-[400px]:left-[60px] sm:left-[90px] flex space-x-0 z-10">
          {['logo', 'Woman', 'Man'].map((item, i) => (
            <div
              key={i}
              onClick={() => handleTabChange(i)}
              className={`${i === 0 ? 'w-[72px] min-[360px]:w-[84px] sm:w-[130px]' : 'w-[52px] min-[360px]:w-[62px] sm:w-[80px]'} sm:h-[56px] py-1 min-[360px]:py-1.5 sm:py-3 rounded-t-xl font-bold text-xs min-[360px]:text-sm sm:text-lg cursor-pointer transition-colors backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-center ${activeTab === i ? 'bg-white text-[#282A2F]' : 'bg-white/40 text-[#282A2F] hover:bg-white/50'}`}
            >
              {i === 0 ? (
                <div className="relative w-[45px] min-[360px]:w-[55px] sm:w-[90px] h-[16px] min-[360px]:h-[20px] sm:h-[28px]">
                  <Image src="/images/logo-dark.png" alt="Pool Arena" fill sizes="110px" className="object-contain" />
                </div>
              ) : (
                item === 'Woman' ? 'Nữ' : 'Nam'
              )}
            </div>
          ))}
        </div>

        {/* Top 5 Card */}
        {currentPage === 1 && (
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-md w-full lg:max-w-[1360px] lg:mx-auto min-h-[360px] sm:min-h-[400px] relative flex flex-col lg:pb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 px-4 sm:px-8 pt-6 mb-4">
              <div className="w-[200px] hidden md:block" />
              <div className="bg-[#172339] text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] xl:py-3 xl:px-6 xl:gap-[10px] -mt-6 shadow-md z-20">
                <h1 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] xl:font-bold uppercase tracking-wide m-0"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  BẢNG XẾP HẠNG
                </h1>
              </div>
              <div className="flex items-center w-full max-w-[313px] xl:max-w-none xl:w-[200px] justify-end">
                <span className="hidden md:inline text-gray-500 text-sm sm:text-base font-medium mr-2">Level</span>
                <Select
                  value={selectedRank}
                  style={{ width: 110 }}
                  onChange={handleFilterChange}
                  variant="borderless"
                  className="bg-gray-100 rounded-md text-sm sm:text-base"
                  popupMatchSelectWidth={false}
                >
                  <Option value="all">Tất cả</Option>
                  {ranks.map((rank) => (
                    <Option key={rank.id} value={rank.name}>{formatFullLevel(rank.name)}</Option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="px-6 sm:px-8 lg:px-6 mt-2 flex-1">
              {top5Players.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 py-8">Chưa có dữ liệu người chơi</div>
              ) : (
                <div className="flex flex-col gap-0 lg:gap-3">
                  {top5Players.map((player, index) => (
                    <React.Fragment key={player.id}>
                      <PlayerRow player={player} index={index} isTop5 />
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remaining players */}
        {otherPlayers.map((player, index) => (
          <PlayerRow
            key={player.id}
            player={player}
            index={currentPage === 1 ? index + 5 : (currentPage - 1) * ITEMS_PER_PAGE + index}
            isTop5={false}
          />
        ))}

        {/* Pagination */}
        {totalPlayers > ITEMS_PER_PAGE && (
          <div className="flex justify-center mt-8 mb-4">
            <Pagination
              current={currentPage}
              total={totalPlayers}
              pageSize={ITEMS_PER_PAGE}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} người chơi`}
            />
          </div>
        )}
      </main>
    </div>
  );
}
