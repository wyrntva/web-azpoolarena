import React from 'react';
import Skeleton from './Skeleton';

export default function BannerSkeleton() {
  return (
    <div
      className="mb-6 sm:mb-12 mt-4 sm:mt-6 relative w-full rounded-xl overflow-hidden shadow-sm"
      style={{ aspectRatio: '361 / 74' }}
    >
      <Skeleton className="w-full h-full" />
    </div>
  );
}
