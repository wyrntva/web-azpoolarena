import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export default function Skeleton({ className = '', width, height, borderRadius }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;
  if (borderRadius !== undefined) style.borderRadius = borderRadius;

  return (
    <div
      className={`animate-pulse bg-[#E2E8F0] dark:bg-[#1E293B] ${className}`}
      style={style}
    />
  );
}
