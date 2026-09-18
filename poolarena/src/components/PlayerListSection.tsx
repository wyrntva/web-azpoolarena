"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QRCode } from "antd";
import { formatLevel } from "@/lib/tournament-utils";

const defaultAvatar = "/images/imageprofile.webp";

interface Player {
  id: number;
  name: string;
  avatar: string | null;
  score: number;
  rank: string;
}

interface PlayerListSectionProps {
  players: Player[];
  maxPlayers?: number;
  currentUserId?: number | null;
  showFullList?: boolean;
  isEvent?: boolean;
  onClose?: () => void;
  qrCodeUrl?: string;
  qrCodeTitle?: string;
  qrCodeSubtitle?: string;
}

export const PlayerListSection: React.FC<PlayerListSectionProps> = ({
  players,
  maxPlayers,
  currentUserId,
  showFullList = true,
  isEvent = false,
  onClose,
  qrCodeUrl,
  qrCodeTitle = "Nhóm Zalo Sự Kiện",
  qrCodeSubtitle = "Quét mã QR hoặc nhấn để tham gia nhóm Zalo sự kiện",
}) => {
  const router = useRouter();

  const handlePlayerClick = (playerId: number) => {
    router.push(`/player/${playerId}`);
  };

  // Determine which players to display
  let displayedPlayers = players;
  if (!showFullList) {
    const userPlayer = currentUserId ? players.find((p) => p.id === currentUserId) : null;
    displayedPlayers = userPlayer ? [userPlayer] : [];
  }

  const effectiveQrUrl = qrCodeUrl || (isEvent ? "https://zalo.me/g/ytqpxk355" : undefined);

  return (
    <div className="mb-8 w-full mt-0 sm:mt-[49px]">
      {/* Player Cards Grid */}
      <div className="w-full bg-white rounded-[12px] shadow-lg px-6 pb-4">
        <div className="w-full max-w-[648px] h-[56px] px-6 bg-slate-800 rounded-bl-[32px] rounded-br-[32px] mx-auto gap-2.5 flex items-center justify-center">
          <div className="text-center text-white text-2xl font-bold leading-loose">
            POOLARENA.PLAYER
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* QR Code Card right inside Player Grid - First Position */}
          {effectiveQrUrl && (
            <div className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-all duration-300 hover:translate-x-2 cursor-pointer">
              <a
                href={effectiveQrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-4 w-[80px] h-[80px] flex-shrink-0 flex items-center justify-center hover:scale-105 transition-transform"
                title="Quét hoặc nhấn để tham gia nhóm Zalo"
              >
                <QRCode
                  value={effectiveQrUrl}
                  size={76}
                  bordered={false}
                  color="#172339"
                />
              </a>

              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0068FF] uppercase tracking-wider mb-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 48 48" className="flex-shrink-0">
                    <path fill="#0068FF" d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10 c4.722,0,8.883-2.348,11.417-5.931V36H15z" />
                    <path fill="#eee" d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19 c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742 c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083 C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z" />
                    <path fill="#0068FF" d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75 S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z" />
                    <path fill="#0068FF" d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z" />
                    <path fill="#0068FF" d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75 S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5 c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z" />
                    <path fill="#0068FF" d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5 c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z" />
                  </svg>
                  <span>Nhóm Zalo</span>
                </div>
                <div
                  className="!text-[#37393E] !text-[15px] !font-bold !leading-[22px] !font-sans truncate"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {qrCodeTitle}
                </div>
                <a
                  href={effectiveQrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="!text-[#0068FF] !text-[13px] !font-semibold !leading-[20px] !font-sans flex items-center gap-1 hover:underline mt-0.5"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <span>Quét mã / Bấm vào đây</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          )}

          {/* Display players list */}
          {displayedPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => handlePlayerClick(player.id)}
              className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-all duration-300 hover:translate-x-2 cursor-pointer"
            >
              {/* Player Avatar - Left Side */}
              <div className="mr-4 w-[80px] h-[80px] flex-shrink-0 relative">
                <Image
                  src={player.avatar || defaultAvatar}
                  alt={player.name}
                  fill
                  sizes="80px"
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
              </div>

              {/* Player Information - Right Side */}
              <div className="flex-1">
                {/* Player Name */}
                <div
                  className="!text-[#37393E] !text-[16px] !font-bold !leading-[24px] !font-sans truncate overflow-hidden"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {player.name}
                </div>

                {/* Player Score and Rank */}
                <div
                  className="!text-[#575E70] !text-[16px] !font-medium !leading-[24px] !font-sans"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Điểm: {player.score.toLocaleString()} - {formatLevel(player.rank)}
                </div>
              </div>
            </div>
          ))}

          {/* Empty state when full list is shown but no players yet */}
          {showFullList && displayedPlayers.length === 0 && (
            <div className="col-span-full py-8 text-center text-[#575E70] text-[15px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Chưa có người chơi nào đăng ký tham gia.
            </div>
          )}

          {/* Display "Số người tham gia" block if registration list is hidden */}
          {!showFullList && (
            <div className="flex items-center p-4 rounded-lg">
              {/* Icon - Left Side */}
              <div className="mr-4 w-[80px] h-[80px] flex-shrink-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#575E70" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 21.5V19.3333C4 18.1841 4.57946 17.0819 5.61091 16.2692C6.64236 15.4565 8.04131 15 9.5 15H15C16.4587 15 17.8576 15.4565 18.8891 16.2692C19.9205 17.0819 20.5 18.1841 20.5 19.3333V21.5" stroke="#575E70" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Information - Right Side */}
              <div className="flex-1">
                <div
                  className="!text-[#575E70] !text-[16px] !font-normal !leading-[24px] !font-sans"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Số người tham gia
                </div>
                <div
                  className="!text-[#37393E] !text-[16px] !font-semibold !leading-[24px] !font-sans mt-1"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {isEvent ? `${players.length} người` : `${players.length}/${maxPlayers || 24} người`}
                </div>
              </div>
            </div>
          )}

          {/* Display informative text block in the grid next to the participants card */}
          {!showFullList && (
            <div className="flex items-center p-4 rounded-lg">
              <div
                style={{
                  color: "#575E70",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "16px",
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "24px",
                }}
              >
                {isEvent
                  ? "* Toàn bộ người chơi sẽ được hiển thị đầy đủ ở đây khi sự kiện bắt đầu hoặc đã kết thúc đăng ký."
                  : "* Toàn bộ người chơi sẽ được hiển thị đầy đủ ở đây khi đã đủ số lượng người tham gia hoặc giải đã kết thúc đăng ký."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
