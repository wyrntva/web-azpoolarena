import React from "react";
import { Typography } from "antd";
import { TournamentDetailRow } from "./TournamentDetailRow";
import { PrizeSection } from "./PrizeSection";

const { Text } = Typography;

interface TournamentInfoCardProps {
  tournament: {
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
    registrationFee: string;  // Lệ phí tham gia
    logo?: string | null;  // Logo của giải đấu
    prizes: {
      total: string;
      first: string;
      second: string;
      contribution: string;
    };
  };
  onRegister: () => void;
}

export const TournamentInfoCard: React.FC<TournamentInfoCardProps> = ({
  tournament,
  onRegister
}) => {
  return (
    <div className="mb-0 w-full">
      <div className="w-full rounded-[12px] shadow-lg border-0 bg-white pb-6 space-y-4 h-[380px]">
        {/* Header - Still centered relative to 1360px */}
        <div className="w-[648px] h-[56px] flex items-center justify-center bg-slate-800 rounded-bl-[32px] rounded-br-[32px] mx-auto gap-2.5">
          <div className="text-center text-white text-2xl font-bold">
            THÔNG TIN CHUNG
          </div>
        </div>

        {/* Tournament Logo - Only render when logo exists */}
        {tournament.logo ? (
          <div className="w-[300px] h-[100px] relative mx-auto flex items-center justify-center">
            <img
              src={tournament.logo}
              alt="Tournament Logo"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.parentElement!.style.display = 'none';
              }}
            />
          </div>
        ) : null}

        {/* Tournament Details Grid - Precisely 34px from card left edge */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 w-full pl-[34px]">
          <TournamentDetailRow
            icon="clock"
            label="Thời gian bắt đầu"
            value={tournament.startTime}
          />
          <TournamentDetailRow
            icon="environment"
            label="Địa điểm"
            value={tournament.location}
          />
          <TournamentDetailRow
            icon="trophy"
            label="Hạng"
            value={tournament.rank}
          />
          <TournamentDetailRow
            icon="user"
            label="Số người tham gia"
            value={`${tournament.participants.current} /${tournament.participants.max} người`}
          />
          <TournamentDetailRow
            icon="dollar"
            label="Lệ phí"
            value={tournament.registrationFee}
          />
          <TournamentDetailRow
            icon="play"
            label="Thể thức thi đấu"
            value={tournament.format}
          />
          <TournamentDetailRow
            icon="bracket"
            label="Loại giải đấu"
            value={tournament.tournamentType || 'Chưa xác định'}
          />
          <TournamentDetailRow
            icon="phone"
            label="SĐT hỗ trợ"
            value={tournament.phone}
          />
        </div>
      </div>
    </div>
  );
};
