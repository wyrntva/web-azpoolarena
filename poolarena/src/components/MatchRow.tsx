import { Avatar } from "antd";
import React from "react";

interface MatchPlayer {
  name: string;
  avatar?: string;
  isWinner?: boolean;
  isBye?: boolean;
}

interface MatchRowProps {
  tableNumber: string | number;
  tableNumberColor?: "default" | "green" | "yellow";
  player1: MatchPlayer;
  player2: MatchPlayer;
  score: string;
  meta: {
    matchNo?: string | number; // Match number, e.g. 1 → "#1"
    race?: string;             // Race info, e.g. "chạm 8 chấp 1"
    time?: string;             // e.g. "11:45"
    date?: string;             // e.g. "13/05"
  };
}

export default function MatchRow({
  tableNumber,
  tableNumberColor = "default",
  player1,
  player2,
  score,
  meta,
}: MatchRowProps) {
  // Determine table number box colors
  let tableNumBg = "bg-[#2f394e]";
  let textColor = "#7C8FB5";
  if (tableNumberColor === "green") {
    tableNumBg = "bg-[#60DB80]";
    textColor = "#FFF";
  }
  if (tableNumberColor === "yellow") {
    tableNumBg = "bg-[#E5BD4F]";
    textColor = "#FFF";
  }

  // Display table number or '-' if not assigned
  const displayTableNumber = tableNumber != null && tableNumber !== "" && tableNumber !== "-" ? `Bàn ${tableNumber}` : "-";

  // Determine if match has a result (at least one player won)
  const matchHasResult = !!player1.isWinner || !!player2.isWinner;

  // Player name style helper
  // Winner: #FFF, bold 700, line-height 24px
  // Loser: #ACB3C3, medium 500, line-height normal
  // Not started / ongoing: #FFF, medium 500, line-height normal
  const getPlayerNameStyle = (player: MatchPlayer, opponent: MatchPlayer): React.CSSProperties => {
    const isLoser = matchHasResult && !player.isWinner && opponent.isWinner;

    // BYE / placeholder style: italic, weight 400
    if (player.isBye) {
      return {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '16px',
        fontStyle: 'italic',
        fontWeight: 400,
        lineHeight: '24px',
        color: '#FFF',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };
    }

    return {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: player.isWinner ? 700 : 500,
      lineHeight: player.isWinner ? '24px' : 'normal',
      color: isLoser ? '#ACB3C3' : '#FFF',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  };

  return (
    <div className="w-full h-[64px] bg-[#172339] flex items-center rounded-[12px] shadow-sm overflow-hidden">
      {/* Table Number Box */}
      <div
        className={`w-[72px] h-full ${tableNumBg} flex items-center justify-center p-[12px] gap-[4px] font-bold italic shrink-0`}
        style={{
          color: textColor,
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '14px',
          lineHeight: '24px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {displayTableNumber}
      </div>

      {/* Match Content - 3-column flex: Player1 | Score | Player2 */}
      <div className="flex-1 flex items-center h-full min-w-0">
        {/* Player 1 - Right Aligned */}
        <div className="flex items-center justify-end gap-[16px] flex-1 min-w-0 pl-3 pr-[34px]">
          <span
            className="truncate"
            style={getPlayerNameStyle(player1, player2)}
          >
            {player1.name}
          </span>
          {!player1.isBye && (
            <Avatar
              size={32}
              shape="square"
              src={player1.avatar || "/images/generic-profile_mini_dcryfs.webp"}
              className="bg-transparent shrink-0"
            />
          )}
        </div>

        {/* Score - Fixed width, grid 3-col for perfect centering */}
        <div
          className="w-[200px] shrink-0 items-center text-white font-bold text-[16px] gap-[60px]"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '58px' }}
        >
          {score.includes(" vs ") ? (
            <>
              <span
                style={{
                  width: '30px',
                  textAlign: 'center',
                  display: 'inline-block',
                  color: player1.isWinner ? '#ED1C1F' : (matchHasResult && player2.isWinner ? '#ACB3C3' : '#FFFFFF'),
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '20px',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  lineHeight: '24px',
                }}
              >
                {score.split(" vs ")[0]}
              </span>
              <span
                style={{
                  color: '#8690A7',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '16px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >vs</span>
              <span
                style={{
                  width: '30px',
                  textAlign: 'center',
                  display: 'inline-block',
                  color: player2.isWinner ? '#ED1C1F' : (matchHasResult && player1.isWinner ? '#ACB3C3' : '#FFFFFF'),
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '20px',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  lineHeight: '24px',
                }}
              >
                {score.split(" vs ")[1]}
              </span>
            </>
          ) : (
            <span className="text-white text-center">{score}</span>
          )}
        </div>

        {/* Player 2 - Left Aligned */}
        <div className="flex items-center justify-start gap-[16px] flex-1 min-w-0 pl-[34px] pr-3">
          {!player2.isBye && (
            <Avatar
              size={32}
              shape="square"
              src={player2.avatar || "/images/generic-profile_mini_dcryfs.webp"}
              className="bg-transparent shrink-0"
            />
          )}
          <span
            className="truncate"
            style={getPlayerNameStyle(player2, player1)}
          >
            {player2.name}
          </span>
        </div>
      </div>

      {/* Meta Info - Right Side */}
      <div
        className="w-[150px] h-full bg-[#2f394e] flex flex-col justify-center items-center px-2 shrink-0"
        style={{
          color: '#7C8FB5',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '12.8px',
          fontWeight: 500,
          lineHeight: '16px',
          textAlign: 'center'
        }}
      >
        {/* Line 1: Date & Time */}
        {(meta.time || meta.date) && (
          <div>{[meta.time, meta.date].filter(Boolean).join(", ")}</div>
        )}
        {/* Line 2: Match No & Race */}
        {meta.matchNo && (
          <div>
            #{meta.matchNo}{meta.race ? ` / ${meta.race}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
