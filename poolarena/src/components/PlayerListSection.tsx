import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  onClose?: () => void;
}

export const PlayerListSection: React.FC<PlayerListSectionProps> = ({
  players,
  maxPlayers,
  currentUserId,
  showFullList = true,
  onClose,
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
                  {players.length}/{maxPlayers || 24} người
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
                * Toàn bộ người chơi sẽ được hiển thị đầy đủ ở đây khi đã đủ số lượng người tham gia hoặc giải đã kết thúc đăng ký.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
