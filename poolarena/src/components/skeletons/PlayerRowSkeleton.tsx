import React from 'react';
import Skeleton from './Skeleton';

export default function PlayerRowSkeleton({ isTop5 = false }: { isTop5?: boolean }) {
  if (isTop5) {
    return (
      <div className="flex items-center py-[11px] px-2 sm:px-4 rounded-xl border border-transparent">
        {/* Rank Column placeholder */}
        <div className="w-[52px] md:w-16 flex-shrink-0 flex items-center justify-center md:justify-start gap-1">
          <Skeleton className="w-[30px] h-[30px] rounded-md" />
        </div>

        {/* Avatar Column placeholder */}
        <div className="w-[56px] h-[70px] sm:w-[60px] sm:h-[75px] flex-shrink-0 relative mr-4 sm:mr-8 ml-1 sm:ml-4">
          <Skeleton className="w-full h-full rounded-md" />
        </div>

        {/* Details Stack */}
        <div className="flex flex-1 items-center justify-between min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            <Skeleton className="w-[120px] sm:w-[160px] h-[18px] sm:h-[20px] rounded" />
            <Skeleton className="w-[80px] sm:w-[100px] h-[12px] sm:h-[14px] rounded" />
          </div>
          <div className="pl-2">
            <Skeleton className="w-[40px] sm:w-[60px] h-[24px] sm:h-[30px] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex bg-white rounded-[16px] shadow-md h-[56px] md:h-[72px] items-center px-6 md:px-12 justify-between">
      {/* Rank */}
      <div className="w-16 flex-shrink-0 flex items-center gap-1">
        <Skeleton className="w-[20px] h-[18px] rounded" />
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-center ml-4 gap-1.5 min-w-0">
        <Skeleton className="w-[140px] md:w-[180px] h-[16px] rounded" />
        <Skeleton className="w-[70px] md:w-[90px] h-[12px] rounded" />
      </div>

      {/* Points */}
      <div className="text-right pl-6 md:pl-2 flex-shrink-0">
        <Skeleton className="w-[40px] h-[20px] rounded" />
      </div>
    </div>
  );
}
