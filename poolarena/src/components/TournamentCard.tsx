"use client";

import React, { memo, useState, useEffect } from "react";
import Image from "next/image";
import { LuCalendarRange } from "react-icons/lu";

export interface Tournament {
  id: number;
  slug: string;
  img: string;
  title: string;
  subtitle: string;
  category: string;
  rank: string;
  date: string;
  time: string;
  participants: { current: number; max: number };
  isRegistered: boolean;
  _startDate?: Date | null;
}

interface TournamentCardProps {
  tournament: Tournament;
  variant: "upcoming" | "completed" | "ongoing";
  onCardClick: (tournament: Tournament) => void;
  onRegister?: (tournamentId: number) => void;
  onViewResults?: (tournamentId: number) => void;
}

// Memoize component để tránh re-render không cần thiết
const TournamentCard = memo(function TournamentCard({
  tournament,
  variant,
  onCardClick,
  onRegister,
  onViewResults,
}: TournamentCardProps) {
  const isFull = tournament.participants.current >= tournament.participants.max;
  const [imgSrc, setImgSrc] = useState(tournament.img || "/images/tournament.png");

  useEffect(() => {
    setImgSrc(tournament.img || "/images/tournament.png");
  }, [tournament.img]);

  return (
    <div
      className={`
        w-full sm:w-[439px] h-auto sm:h-[452px] flex flex-col
        group rounded-2xl border-none shadow-lg overflow-hidden cursor-pointer 
        transition-all duration-300
        hover:shadow-2xl
        bg-white
      `}
      onClick={() => onCardClick(tournament)}
    >
      {/* Header (Image + Overlay) */}
      <div className="relative aspect-[439/400] sm:aspect-auto sm:h-[400px] w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={tournament.title}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 439px"
          className="object-cover group-hover:scale-125 transition-transform duration-1000 ease-out"
          priority
          onError={() => setImgSrc("/images/tournament.png")}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-4 sm:py-6">

          {/* Top: Logo giải đấu */}
          <div className="flex flex-col items-center">
            {tournament.category && (tournament.category.startsWith('http') || tournament.category.startsWith('/')) ? (
              <div className="mb-1 sm:mb-2">
                <img
                  src={tournament.category}
                  alt="Logo giải đấu"
                  className="w-auto object-contain max-w-[180px] sm:max-w-[280px] h-[60px] sm:h-[85px]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ) : tournament.category ? (
              <h4 className="text-[#FFC107] font-bold text-base sm:text-xl uppercase tracking-wider">
                {tournament.category}
              </h4>
            ) : null}
          </div>

          {/* Middle: Title */}
          <div className="text-center px-3 sm:px-4">
            <h3
              className="mb-1 sm:mb-2"
              style={{
                color: '#FFF',
                textAlign: 'center',
                fontFamily: 'Montserrat',
                fontSize: 'clamp(14px, 4vw, 20px)',
                fontStyle: 'italic',
                fontWeight: 700,
                lineHeight: '1.4',
              }}
            >
              {tournament.title}
            </h3>
            <p className="text-base sm:text-2xl text-white font-bold italic uppercase leading-tight">
              {tournament.subtitle}
            </p>
          </div>

          {/* Bottom: Rank */}
          <div className="mb-2 sm:mb-4 text-white text-sm sm:text-lg font-normal">
            Hạng {tournament.rank}
          </div>
        </div>

        {/* Participant Badge (Bottom Right) */}
        <div className="absolute bottom-0" style={{ right: '12px' }}>
          <div
            className="rounded-tl-xl rounded-tr-xl flex items-center justify-center"
            style={{
              width: '80px',
              height: '28px',
              backgroundColor: tournament.participants.current >= tournament.participants.max ? '#C6010B' : '#1B03DC',
              color: '#FFF',
              fontFamily: 'Montserrat',
              fontSize: '11px',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '16px',
            }}
          >
            {tournament.participants.current}/{tournament.participants.max} người
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-[44px] sm:h-[52px] flex items-center justify-between px-3 sm:px-5 bg-white group-hover:bg-[#172339] transition-colors duration-500">
        {/* Date/Time */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LuCalendarRange className="text-[#37393E] group-hover:text-white w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500" />
          <span className="text-[#37393E] group-hover:text-white text-xs sm:text-base font-normal transition-colors duration-500">
            {tournament.time} - {tournament.date}
          </span>
        </div>

        {/* Action Button */}
        <div>
          {variant === "upcoming" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegister?.(tournament.id);
              }}
              disabled={isFull}
              className={`rounded-full shadow-none flex items-center justify-center transition-all duration-300
                ${isFull
                  ? "bg-[#808996] cursor-not-allowed"
                  : "bg-[#37393E] hover:bg-[#37393E]/90 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer"}`}
              style={{
                width: '120px',
                height: '26px',
                color: '#FFF',
                fontFamily: 'Montserrat',
                fontSize: '12px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: '18px',
                letterSpacing: '0.28px',
              }}
            >
              {isFull ? "Đã đầy" : "Đăng ký ngay"}
            </button>
          ) : variant === "ongoing" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCardClick(tournament);
              }}
              className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#ED1C1F] hover:bg-[#ED1C1F]/90 transition-all shadow-none flex items-center gap-1.5 animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-white block"></span>
              Xem trực tiếp
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewResults?.(tournament.id);
              }}
              className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#37393E] hover:bg-[#37393E]/90 transition-all shadow-none"
            >
              Kết quả
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default TournamentCard;

