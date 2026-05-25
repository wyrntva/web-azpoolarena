'use client';

import React, { memo } from 'react';
import { Row, Col } from 'antd';
import TournamentCard, { Tournament } from './TournamentCard';

interface TournamentListProps {
  tournaments: Tournament[];
  variant: 'upcoming' | 'completed';
  onCardClick: (tournament: Tournament) => void;
  onRegister?: (tournamentId: number) => void;
  onViewResults?: (tournamentId: number) => void;
  gridConfig?: {
    xs?: number;
    sm?: number;
    lg?: number;
    xl?: number;
  };
}

// Memoize component để tránh re-render không cần thiết
const TournamentList = memo(function TournamentList({
  tournaments,
  variant,
  onCardClick,
  onRegister,
  onViewResults,
  gridConfig = {
    xs: 24,
    sm: 12,
    xl: 8
  }
}: TournamentListProps) {
  return (
    <Row gutter={[24, 24]}>
      {tournaments.map((tournament, index) => (
        <Col
          xs={gridConfig.xs}
          sm={gridConfig.sm}
          lg={gridConfig.lg}
          xl={gridConfig.xl}
          key={tournament.id}
        >
          {/* Sử dụng CSS animation thay vì framer-motion để giảm bundle size và cải thiện performance */}
          <div
            className="animate-fadeIn"
            style={{
              animationDelay: `${Math.min(index * 50, 300)}ms`, // Cap delay tối đa 300ms
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
        </Col>
      ))}
    </Row>
  );
});

export default TournamentList;
