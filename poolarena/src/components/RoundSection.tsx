import React from "react";
import MatchRow from "./MatchRow";

// Reuse the types from MatchRow or define shared types
interface MatchPlayer {
    name: string;
    avatar?: string;
    isWinner?: boolean;
    isBye?: boolean;
}

interface MatchData {
    id: string | number;
    tableNumber: string | number;
    tableNumberColor?: "default" | "green" | "yellow";
    player1: MatchPlayer;
    player2: MatchPlayer;
    score: string;
    meta: {
        matchNo?: string | number;
        race?: string;
        time?: string;
        date?: string;
    };
}

interface RoundSectionProps {
    title: string;
    matches: MatchData[];
}

export const RoundSection: React.FC<RoundSectionProps> = ({ title, matches }) => {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="bg-[#C6010B] h-[48px] flex items-center px-[22px] rounded-[12px] shadow-sm mb-[8px]">
                <span
                    className="text-white font-bold uppercase overflow-hidden whitespace-nowrap text-ellipsis"
                    style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '18px',
                        fontStyle: 'normal',
                        fontWeight: 700,
                        lineHeight: '24px',
                    }}
                >
                    {title}
                </span>
            </div>

            {/* Matches List */}
            <div className="flex flex-col gap-[8px]">
                {matches.map((match) => (
                    <MatchRow
                        key={match.id}
                        tableNumber={match.tableNumber}
                        tableNumberColor={match.tableNumberColor}
                        player1={match.player1}
                        player2={match.player2}
                        score={match.score}
                        meta={match.meta}
                    />
                ))}
            </div>
        </div>
    );
};
