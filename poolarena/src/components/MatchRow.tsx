import { Avatar } from "antd";
import React from "react";
import { formatLevel } from "@/lib/tournament-utils";

interface MatchPlayer {
  name: string;
  avatar?: string;
  rank?: string | null;
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
  isFinal?: boolean;
}

export default function MatchRow({
  tableNumber,
  tableNumberColor = "default",
  player1,
  player2,
  score,
  meta,
  isFinal = false,
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

  // Track scores for red flash effect when they change
  const scoreParts = score.includes(" vs ") ? score.split(" vs ") : [score, ""];
  const p1ScoreVal = scoreParts[0];
  const p2ScoreVal = scoreParts[1];

  const prevP1ScoreRef = React.useRef(p1ScoreVal);
  const prevP2ScoreRef = React.useRef(p2ScoreVal);
  const [p1Flash, setP1Flash] = React.useState(false);
  const [p2Flash, setP2Flash] = React.useState(false);

  React.useEffect(() => {
    if (p1ScoreVal !== prevP1ScoreRef.current) {
      prevP1ScoreRef.current = p1ScoreVal;
      setP1Flash(true);
      const timer = setTimeout(() => setP1Flash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [p1ScoreVal]);

  React.useEffect(() => {
    if (p2ScoreVal !== prevP2ScoreRef.current) {
      prevP2ScoreRef.current = p2ScoreVal;
      setP2Flash(true);
      const timer = setTimeout(() => setP2Flash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [p2ScoreVal]);

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
        paddingRight: '4px', // Prevent italic clipping
      };
    }

    return {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: player.isWinner ? 700 : 500,
      lineHeight: player.isWinner ? '24px' : 'normal',
      color: isFinal && player.isWinner ? '#FFD700' : (isLoser ? '#ACB3C3' : '#FFF'),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  };

  return (
    <div
      className="w-full h-[64px] flex items-center rounded-[12px] shadow-sm overflow-hidden"
      style={{
        background: 'linear-gradient(to right, transparent 72px, #172339 72px)'
      }}
    >
      {/* Table Number Box */}
      <div
        className={`w-[72px] h-full ${tableNumBg} rounded-l-[12px] flex items-center justify-center p-[12px] gap-[4px] font-bold italic shrink-0`}
        style={{
          color: textColor,
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '14px',
          lineHeight: '24px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          transition: 'background-color 0.5s ease-in-out, color 0.5s ease-in-out',
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
            {player1.name}{player1.rank && !player1.isBye ? ` - ${formatLevel(player1.rank)}` : ""}
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
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '48px' }}
        >
          {score.includes(" vs ") ? (
            <>
              <div style={{
                borderRadius: '6px',
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span
                  className={p1Flash ? "animate-score-flash" : ""}
                  style={{
                    width: '30px',
                    textAlign: 'center',
                    display: 'inline-block',
                    color: player1.isWinner ? '#ED1C1F' : (matchHasResult && player2.isWinner ? '#ACB3C3' : '#FFFFFF'),
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '18px',
                    fontStyle: 'italic',
                    fontWeight: 700,
                    lineHeight: '24px',
                  }}
                >
                  {p1ScoreVal}
                </span>
              </div>
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
              <div style={{
                borderRadius: '6px',
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span
                  className={p2Flash ? "animate-score-flash" : ""}
                  style={{
                    width: '30px',
                    textAlign: 'center',
                    display: 'inline-block',
                    color: player2.isWinner ? '#ED1C1F' : (matchHasResult && player1.isWinner ? '#ACB3C3' : '#FFFFFF'),
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '18px',
                    fontStyle: 'italic',
                    fontWeight: 700,
                    lineHeight: '24px',
                  }}
                >
                  {p2ScoreVal}
                </span>
              </div>
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
            {player2.name}{player2.rank && !player2.isBye ? ` - ${formatLevel(player2.rank)}` : ""}
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
