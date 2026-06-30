import React from 'react';
import Skeleton from './Skeleton';
import { ChampionshipBanner } from '@/components';

export default function TournamentDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F2F4] pb-24 font-sans animate-fadeIn">
      {/* MOBILE LAYOUT ONLY (block sm:hidden) */}
      <div className="block sm:hidden bg-[#F0F2F4]">
        {/* Banner Image placeholder */}
        <div className="relative w-full h-[180px] bg-[#CBD5E1] overflow-hidden animate-pulse animate-fadeIn" />

        {/* Main Content Area */}
        <div className="px-4 -mt-[70px] pb-8 relative z-10 flex flex-col gap-5">
          {/* 1. THÔNG TIN CHUNG CARD */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(23,35,57,0.06)] border border-gray-100/50 w-full flex flex-col relative pt-[60px] pb-[40px] px-6">
            {/* Card Header (Floating Tab rounded-b) */}
            <div 
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-[#172339] text-white w-[82%] h-[44px] flex items-center justify-center rounded-b-[20px] shadow-[0_4px_6px_rgba(0,0,0,0.1)] z-20"
            >
              <span 
                className="font-bold text-[14px] tracking-[0.5px] uppercase text-center" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Thông tin chung
              </span>
            </div>

            {/* Logo Placeholder */}
            <div className="flex justify-center h-[50px] items-center mb-4">
              <Skeleton className="w-[180px] h-[50px] rounded-md" />
            </div>

            {/* Info rows */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col py-3 px-4 w-full gap-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="w-[120px] h-[16px] rounded-md" />
                </div>
                <Skeleton className="w-2/3 h-[20px] rounded-md mt-1" />
              </div>
            ))}
          </div>

          {/* 2. PRIZE CARD */}
          <div className="bg-[#172339] rounded-2xl p-6 w-full flex flex-col gap-6 shadow-md -mt-[36px] pb-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="w-[120px] h-[16px] bg-slate-700 rounded-md" />
              <Skeleton className="w-1/2 h-[28px] bg-slate-600 rounded-md mt-1" />
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-700">
              <Skeleton className="w-full h-[40px] bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT ONLY (hidden sm:block) */}
      <div className="hidden sm:block relative w-full">
        {/* Banner Background */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[#172339] overflow-hidden animate-pulse" />

        <div className="relative z-10 flex flex-col w-full">
          <main className="w-full max-w-[1360px] mx-auto pt-[288px] flex flex-col gap-4">
            
            {/* 1. TournamentInfoCard Skeleton */}
            <div className="mb-0 w-full">
              <div className="w-full rounded-[12px] shadow-lg border-0 bg-white pb-6 space-y-4 h-[380px]">
                {/* Header Tab */}
                <div className="w-[648px] h-[56px] flex items-center justify-center bg-slate-800 rounded-bl-[32px] rounded-br-[32px] mx-auto gap-2.5">
                  <div className="text-center text-white text-2xl font-bold uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    THÔNG TIN CHUNG
                  </div>
                </div>

                {/* Logo slot placeholder */}
                <div className="w-[300px] h-[100px] relative mx-auto flex items-center justify-center mb-4">
                  <Skeleton className="w-[180px] h-[50px] rounded-md" />
                </div>

                {/* Grid rows */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 w-full pl-[34px]">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2 w-[311px] h-[80px] px-[16px] py-[12px]">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-5 h-5 rounded-full" />
                        <Skeleton className="w-[120px] h-[16px] rounded" />
                      </div>
                      <Skeleton className="w-[180px] h-[16px] rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. PrizeSection Skeleton */}
            <div className="bg-[#172339] rounded-[12px] pt-[16px] pb-[24px] text-white w-full -mt-[30px] relative z-20">
              <div className="flex flex-col w-full px-[16px]">
                <div className="flex justify-between w-full">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[324px] h-[84px] px-[16px] py-[12px] flex flex-col gap-2">
                      <Skeleton className="w-[100px] h-[16px] bg-slate-700 rounded" />
                      <Skeleton className="w-[160px] h-[24px] bg-slate-600 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col mt-[28px] gap-2 items-center">
                {/* Countdown placeholder */}
                <div className="text-center">
                  <Skeleton className="w-[220px] h-[20px] bg-slate-700 rounded" />
                </div>

                {/* Button placeholder */}
                <div className="text-center mt-2">
                  <Skeleton className="w-[398px] h-[40px] bg-slate-600 rounded-full" />
                </div>
              </div>
            </div>

            {/* 3. ChampionshipBanner Component (Renders natively since it does not fetch remote data) */}
            <ChampionshipBanner className="my-8" />

            {/* 4. Sponsors skeleton */}
            <div className="w-full flex justify-between">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-[220px] h-[100px] bg-[#7383A6] animate-pulse rounded-md" />
              ))}
            </div>

            {/* 5. PlayerListSection Skeleton */}
            <div className="mb-8 w-full mt-0 sm:mt-[49px]">
              <div className="w-full bg-white rounded-[12px] shadow-lg px-6 pb-3">
                {/* Header Tab */}
                <div className="w-full max-w-[648px] h-[56px] px-6 bg-slate-800 rounded-bl-[32px] rounded-br-[32px] mx-auto gap-2.5 flex items-center justify-center">
                  <div className="text-center text-white text-2xl font-bold leading-loose uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    POOLARENA.PLAYER
                  </div>
                </div>

                {/* 3-column Grid matching PlayerListSection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center p-4 rounded-lg">
                      <div className="mr-4 w-[80px] h-[80px] flex-shrink-0 relative">
                        <Skeleton className="w-full h-full rounded bg-slate-100" />
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <Skeleton className="w-[120px] h-[16px] rounded" />
                        <Skeleton className="w-[140px] h-[14px] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
