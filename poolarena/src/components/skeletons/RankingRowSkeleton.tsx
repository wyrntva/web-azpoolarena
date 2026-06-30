import React from 'react';
import Skeleton from './Skeleton';

export default function RankingRowSkeleton({ isTop1 = false }: { isTop1?: boolean }) {
  return (
    <div
      className={`w-full flex items-center bg-white rounded-xl overflow-hidden border ${
        isTop1
          ? "h-[140px] pt-2 pb-0 pl-4 pr-4 gap-4 sm:h-[200px] sm:pt-3 sm:pl-6 sm:pr-[90px] sm:gap-6 self-stretch border-4 border-[#FAC600] shadow-[0_4px_6px_0_rgba(138,138,138,0.10)]"
          : "h-auto py-3 px-4 gap-2 sm:h-[90px] sm:pt-1 sm:pb-0 sm:px-6 sm:gap-6 border-transparent shadow-[0_4px_6px_0_rgba(138,138,138,0.10)]"
      }`}
    >
      {/* Rank Label Placeholder */}
      {!isTop1 && (
        <div className="w-[60px] sm:w-[70px]">
          <Skeleton className="w-[30px] h-[20px] rounded" />
        </div>
      )}

      {/* Player Info */}
      <div className="flex flex-1 items-center gap-2 sm:gap-6 h-full min-w-0">
        <div className="self-center sm:self-end">
          <div className={`${isTop1 ? "w-[96px] h-[120px] sm:w-[144px] sm:h-[180px]" : "w-[48px] h-[60px] sm:w-[68px] sm:h-[85px]"} flex-shrink-0 relative`}>
            <Skeleton className="w-full h-full rounded" />
          </div>
        </div>
        <div className={`flex flex-col py-2 min-w-0 flex-1 ${isTop1 ? "gap-2" : "gap-1.5"}`}>
          <Skeleton className={`rounded ${isTop1 ? "w-[120px] sm:w-[220px] h-[20px] sm:h-[30px]" : "w-[100px] sm:w-[160px] h-[16px] sm:h-[22px]"}`} />
          <Skeleton className={`rounded ${isTop1 ? "w-[80px] sm:w-[150px] h-[14px] sm:h-[20px]" : "w-[60px] sm:w-[100px] h-[12px] sm:h-[16px]"}`} />
          <Skeleton className="w-[40px] h-[14px] rounded block sm:hidden mt-1" />
        </div>
      </div>

      {/* Points (Desktop Only) */}
      <div className="hidden sm:block">
        <Skeleton className={`rounded ${isTop1 ? "w-[60px] h-[36px]" : "w-[40px] h-[24px]"}`} />
      </div>
    </div>
  );
}
