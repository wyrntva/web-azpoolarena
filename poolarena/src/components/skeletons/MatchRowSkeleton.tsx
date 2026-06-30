import React from 'react';
import Skeleton from './Skeleton';

export default function MatchRowSkeleton() {
  return (
    <div
      className="w-full h-[64px] flex items-center rounded-[12px] shadow-sm overflow-hidden animate-fadeIn"
      style={{
        background: 'linear-gradient(to right, transparent 72px, #172339 72px)'
      }}
    >
      {/* Table Number Box Placeholder */}
      <div
        className="w-[72px] h-full bg-[#2f394e] rounded-l-[12px] flex items-center justify-center p-[12px] shrink-0 animate-pulse"
      />

      {/* Match Content */}
      <div className="flex-1 flex items-center h-full min-w-0">
        {/* Player 1 - Right Aligned */}
        <div className="flex items-center justify-end gap-[16px] flex-1 min-w-0 pl-3 pr-[34px]">
          <Skeleton className="w-[100px] h-[16px] rounded bg-slate-700" />
          <Skeleton className="w-8 h-8 rounded bg-slate-700 shrink-0" />
        </div>

        {/* Score Area */}
        <div
          className="w-[200px] shrink-0 flex justify-center items-center gap-[48px]"
        >
          <Skeleton className="w-[24px] h-[24px] rounded bg-slate-700" />
          <span className="text-[#8690A7] font-semibold text-[14px]">vs</span>
          <Skeleton className="w-[24px] h-[24px] rounded bg-slate-700" />
        </div>

        {/* Player 2 - Left Aligned */}
        <div className="flex items-center justify-start gap-[16px] flex-1 min-w-0 pl-[34px] pr-3">
          <Skeleton className="w-8 h-8 rounded bg-slate-700 shrink-0" />
          <Skeleton className="w-[100px] h-[16px] rounded bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
