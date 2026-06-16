import React, { useState } from "react";
import Image from "next/image";
import { Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { formatLevel } from "@/lib/tournament-utils";

const { Title, Text } = Typography;

const defaultAvatar = "/images/imageprofile.png";

interface Player {
  id: number;
  name: string;
  avatar: string | null;
  score: number;
  rank: string;
}

interface PlayerListSectionProps {
  players: Player[];
  onClose: () => void;
}

export const PlayerListSection: React.FC<PlayerListSectionProps> = ({
  players,
  onClose,
}) => {
  const router = useRouter();

  const handlePlayerClick = (playerId: number) => {
    router.push(`/player/${playerId}`);
  };

  return (
    <div className="mb-8 w-full mt-0 sm:mt-[49px]">
      {/* Player Cards Grid */}
      <div className="w-full bg-white rounded-[12px] shadow-lg px-6 pb-3">
        <div className="w-full max-w-[648px] h-[56px] px-6 bg-slate-800 rounded-bl-[32px] rounded-br-[32px] mx-auto gap-2.5 flex items-center justify-center">
          <div className="text-center text-white text-2xl font-bold leading-loose">
            POOLARENA.PLAYER
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {players.map((player) => (
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
                  unoptimized
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
        </div>
      </div>
    </div>
  );
};
