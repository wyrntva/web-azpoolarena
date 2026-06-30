import React from 'react';
import Skeleton from './Skeleton';

export default function NewsFeaturedSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_15px_45px_rgba(23,35,57,0.04)] border border-gray-100 flex flex-col lg:grid lg:grid-cols-12 w-full min-h-[350px] lg:min-h-[420px]">
      {/* Left side: Image */}
      <div className="lg:col-span-7 relative h-[250px] sm:h-[350px] lg:h-full bg-gray-50">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Right side: Content */}
      <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="w-[60px] h-[14px] rounded-md" />
            <Skeleton className="w-[100px] h-[14px] rounded-md" />
            <Skeleton className="w-[80px] h-[14px] rounded-md" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="w-full h-[24px] sm:h-[30px] rounded-md" />
            <Skeleton className="w-4/5 h-[24px] sm:h-[30px] rounded-md" />
          </div>

          {/* Excerpt */}
          <div className="space-y-2 pt-2">
            <Skeleton className="w-full h-[14px] rounded-sm" />
            <Skeleton className="w-full h-[14px] rounded-sm" />
            <Skeleton className="w-full h-[14px] rounded-sm" />
            <Skeleton className="w-3/4 h-[14px] rounded-sm" />
          </div>
        </div>

        {/* Read more */}
        <div className="pt-6 border-t border-gray-100 flex items-center">
          <Skeleton className="w-[120px] h-[16px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
