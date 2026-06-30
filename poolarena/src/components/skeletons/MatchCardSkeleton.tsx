import React from 'react';
import Skeleton from './Skeleton';

export default function MatchCardSkeleton() {
  return (
    <div className="flex flex-col gap-0 w-full animate-fadeIn">
      {/* Meta row */}
      <div className="flex items-center justify-between px-1" style={{ paddingTop: "8px", paddingBottom: "4px" }}>
        <Skeleton className="w-[45px] h-[12px] rounded" />
        <Skeleton className="w-[130px] h-[12px] rounded" />
      </div>

      {/* Card Body */}
      <div className="w-full flex items-stretch overflow-hidden shadow-sm" style={{ height: "80px", borderRadius: "12px", background: "linear-gradient(to right, transparent 72px, #172339 72px)" }}>
        {/* Table number box placeholder */}
        <div
          className="bg-[#CBD5E1] flex-shrink-0 animate-pulse"
          style={{
            width: "72px",
            alignSelf: "stretch",
            borderTopLeftRadius: "12px",
            borderBottomLeftRadius: "12px",
          }}
        />

        {/* Players column */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", flex: "1 0 0", background: "#172339" }}>
          {/* Player 1 row */}
          <div className="flex items-center justify-between w-full" style={{ height: "40px", paddingLeft: "8px", paddingRight: "12px" }}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton className="w-6 h-6 rounded-full bg-[#374151]" />
              <Skeleton className="w-[100px] h-[14px] rounded bg-[#374151]" />
            </div>
            <Skeleton className="w-4 h-5 rounded bg-[#374151]" />
          </div>

          {/* Player 2 row */}
          <div className="flex items-center justify-between w-full" style={{ height: "40px", paddingLeft: "8px", paddingRight: "12px" }}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton className="w-6 h-6 rounded-full bg-[#374151]" />
              <Skeleton className="w-[80px] h-[14px] rounded bg-[#374151]" />
            </div>
            <Skeleton className="w-4 h-5 rounded bg-[#374151]" />
          </div>
        </div>
      </div>
    </div>
  );
}
