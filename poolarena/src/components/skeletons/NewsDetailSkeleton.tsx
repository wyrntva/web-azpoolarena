import React from 'react';
import Skeleton from './Skeleton';

export default function NewsDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F2F4] flex flex-col font-sans animate-fadeIn">
      {/* MOBILE LAYOUT ONLY (block sm:hidden) */}
      <div className="block sm:hidden bg-[#F0F2F4] flex-1">
        {/* Banner Image placeholder */}
        <div className="relative w-full h-[180px] bg-[#CBD5E1] overflow-hidden animate-pulse" />

        {/* Content Area */}
        <div className="px-4 -mt-[70px] pb-12 relative z-10">
          <article className="relative bg-white rounded-2xl shadow-[0_4px_20px_rgba(23,35,57,0.06)] border border-gray-100/50 w-full px-6 pb-6 pt-[54px] flex flex-col gap-4">
            {/* Card Header (Floating Tab) */}
            <div 
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-[#172339] text-white w-[82%] h-[44px] flex items-center justify-center rounded-b-[20px] shadow-[0_4px_6px_rgba(0,0,0,0.1)] z-20"
            >
              <Skeleton className="w-[100px] h-[14px] bg-slate-700 rounded" />
            </div>

            {/* Title placeholder */}
            <Skeleton className="w-[90%] h-[24px] rounded mt-2" />

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3">
              <Skeleton className="w-[130px] h-[14px] rounded" />
              <Skeleton className="w-[110px] h-[14px] rounded" />
            </div>

            {/* Body content placeholders */}
            <div className="flex flex-col gap-2.5 mt-2">
              <Skeleton className="w-full h-[16px] rounded" />
              <Skeleton className="w-[95%] h-[16px] rounded" />
              <Skeleton className="w-[90%] h-[16px] rounded" />
              <Skeleton className="w-[97%] h-[16px] rounded" />
              <Skeleton className="w-[80%] h-[16px] rounded" />
              <Skeleton className="w-full h-[16px] rounded" />
              <Skeleton className="w-[85%] h-[16px] rounded" />
              <Skeleton className="w-[60%] h-[16px] rounded" />
            </div>
          </article>
        </div>
      </div>

      {/* DESKTOP LAYOUT ONLY (hidden sm:block) */}
      <div className="hidden sm:block relative w-full flex-1">
        {/* Banner Background */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[#1E293B] overflow-hidden animate-pulse" />

        <div className="relative z-10 flex flex-col w-full animate-fadeIn">
          <main className="w-full max-w-[1360px] mx-auto pt-[288px] pb-12 px-6 md:px-8 xl:px-12 2xl:px-0 flex flex-col gap-4">
            <article className="relative bg-white rounded-2xl shadow-[0_15px_45px_rgba(23,35,57,0.06)] border border-gray-100 px-10 pb-10 pt-[76px] space-y-6 w-full">
              {/* Card Header (Floating Tab) */}
              <div 
                className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-[#172339] text-white w-[648px] max-w-[82%] h-[56px] flex items-center justify-center rounded-bl-[32px] rounded-br-[32px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] z-20"
              >
                <Skeleton className="w-[150px] h-[20px] bg-slate-700 rounded" />
              </div>

              {/* Title */}
              <Skeleton className="w-3/4 h-[32px] rounded mt-2" />

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-4">
                <Skeleton className="w-[160px] h-[16px] rounded" />
                <Skeleton className="w-[140px] h-[16px] rounded" />
              </div>

              {/* Body Text */}
              <div className="flex flex-col gap-3 mt-4">
                <Skeleton className="w-full h-[18px] rounded" />
                <Skeleton className="w-[98%] h-[18px] rounded" />
                <Skeleton className="w-[95%] h-[18px] rounded" />
                <Skeleton className="w-full h-[18px] rounded" />
                <Skeleton className="w-[97%] h-[18px] rounded" />
                <Skeleton className="w-[90%] h-[18px] rounded" />
                <Skeleton className="w-[85%] h-[18px] rounded" />
                <Skeleton className="w-[93%] h-[18px] rounded" />
                <Skeleton className="w-[70%] h-[18px] rounded" />
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
