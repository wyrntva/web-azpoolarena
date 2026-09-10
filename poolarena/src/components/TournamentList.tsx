'use client';

import React, { memo } from 'react';
import { Row, Col } from 'antd';
import TournamentCard, { Tournament } from './TournamentCard';

interface TournamentListProps {
  tournaments: Tournament[];
  variant: 'upcoming' | 'completed' | 'ongoing';
  onCardClick: (tournament: Tournament) => void;
  onRegister?: (tournamentId: number) => void;
  onViewResults?: (tournamentId: number) => void;
  gridConfig?: {
    xs?: number;
    sm?: number;
    lg?: number;
    xl?: number;
  };
  delayOffset?: number;
}

const TournamentList = memo(function TournamentList({
  tournaments,
  variant,
  onCardClick,
  onRegister,
  onViewResults,
  delayOffset = 0
}: TournamentListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
      {tournaments.map((tournament, index) => (
        <div
          key={tournament.id}
          className="w-full animate-slideInFromLeft"
          style={{
            animationDelay: `${Math.min((delayOffset + index) * 80, 1600)}ms`,
            animationFillMode: 'backwards'
          }}
        >
          <TournamentCard
            tournament={tournament}
            variant={variant}
            onCardClick={onCardClick}
            onRegister={onRegister}
            onViewResults={onViewResults}
          />
        </div>
      ))}
    </div>
  );
});

export default TournamentList;
