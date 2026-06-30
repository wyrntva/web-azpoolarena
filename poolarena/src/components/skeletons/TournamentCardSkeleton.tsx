import React from 'react';
import Skeleton from './Skeleton';

export default function TournamentCardSkeleton() {
  return (
    <div className="w-full sm:w-[439px] h-[452px] flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white">
      {/* Header part */}
      <div className="relative flex-1 w-full bg-[#F8FAFC] flex flex-col items-center justify-between py-6">
        {/* Top: Logo area */}
        <div className="flex flex-col items-center mt-[30px]">
          <Skeleton className="w-[140px] sm:w-[180px] h-[50px] sm:h-[60px] rounded-lg" />
        </div>

        {/* Middle: Title/Subtitle area */}
        <div className="flex flex-col items-center px-4 w-full gap-2 mb-6 sm:mb-[40px]">
          <Skeleton className="w-3/4 h-[20px] sm:h-[24px] rounded-md" />
          <Skeleton className="w-5/6 h-[24px] sm:h-[28px] rounded-md" />
        </div>

        {/* Bottom: Rank area */}
        <div className="mb-2 sm:mb-4">
          <Skeleton className="w-[100px] h-[16px] sm:h-[18px] rounded-md" />
        </div>

        {/* Participant Badge (Bottom Right) */}
        <div className="absolute bottom-0 right-[12px]">
          <div className="bg-[#E2E8F0] w-[80px] h-[28px] rounded-t-xl animate-pulse" />
        </div>
      </div>

      {/* Footer part */}
      <div className="h-[44px] sm:h-[52px] flex items-center justify-between px-3 sm:px-5 bg-white border-t border-gray-100/50">
        {/* Date/Time */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-[120px] h-[16px] rounded-md" />
        </div>

        {/* Action Button */}
        <Skeleton className="w-[120px] h-[26px] rounded-full" />
      </div>
    </div>
  );
}
