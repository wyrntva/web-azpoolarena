import { Player } from "@/types/player.types";
import React from "react";

interface PointCardProps {
  player: Player;
  handicap: number;
  handicapPosition: "left" | "right";
  handlePlusPoint: (player: Player) => void;
}

export default function PointCard({ 
  player,
  handicap, 
  handicapPosition,
  handlePlusPoint
}: PointCardProps) {
  return (
    <div className="bg-[#172339] rounded-lg p-6 text-white relative w-[409px] flex flex-col items-center justify-between" onClick={() => handlePlusPoint(player)}>
      {/* Player Name */}
      <div className="text-4xl font-semibold text-center">
        {player.name}
      </div>
      
      {/* Player Score */}
      <div className="text-[250px] font-bold text-red-500">
        {player.score}
      </div>
      
      {/* Player Handicap - Bottom Corner */}
      <div className={`absolute bottom-0 ${handicapPosition === 'left' ? 'left-0' : 'right-0'}`}>
        <div className="bg-white text-gray-800 text-3xl font-medium px-3 py-2 rounded border border-gray-300">
          {handicap}
        </div>
      </div>
    </div>
  );
}
