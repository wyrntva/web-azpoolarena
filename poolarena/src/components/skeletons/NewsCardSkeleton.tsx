import React from 'react';
import Skeleton from './Skeleton';

export default function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(23,35,57,0.03)] border border-gray-100/80 flex flex-col h-full min-h-[380px]">
      {/* Image area */}
      <Skeleton className="relative h-[200px] w-full" />

      {/* Content area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Date & Author */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-[80px] h-[14px] rounded-md" />
            <span className="text-gray-300">•</span>
            <Skeleton className="w-[60px] h-[14px] rounded-md" />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Skeleton className="w-full h-[18px] rounded-md" />
            <Skeleton className="w-5/6 h-[18px] rounded-md" />
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5 pt-1">
            <Skeleton className="w-full h-[12px] rounded-sm" />
            <Skeleton className="w-full h-[12px] rounded-sm" />
            <Skeleton className="w-2/3 h-[12px] rounded-sm" />
          </div>
        </div>

        {/* Read more button */}
        <div className="pt-4 border-t border-gray-100/80 flex items-center">
          <Skeleton className="w-[70px] h-[14px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
