'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { storeSettingsAPI } from '@/api/storeSettings.api';
import { resolveImageUrl } from '@/lib/tournament-utils';

interface ChampionshipBannerProps {
  className?: string;
  style?: React.CSSProperties;
  /** Fallback image if store settings not available */
  fallbackSrc?: string;
}

/**
 * Shared banner component that reads the same `banner_tournament` setting
 * as the main tournaments listing page, so both always show the same image.
 * Fixed size: 1360×144px on desktop, scales down proportionally on mobile.
 */
export default function ChampionshipBanner({
  className = '',
  style,
  fallbackSrc = '/images/home_banner.webp',
}: ChampionshipBannerProps) {
  const [bannerUrls, setBannerUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    storeSettingsAPI.get()
      .then(res => {
        const raw = res.data?.banner_tournament;
        if (!raw) return;
        let urls: string[] = [];
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) urls = parsed.filter(Boolean);
          else if (typeof parsed === 'string' && parsed.length > 0) urls = [parsed];
        } catch {
          urls = [raw];
        }
        const resolved = urls.map(u => resolveImageUrl(u, '')).filter(Boolean);
        if (resolved.length > 0) setBannerUrls(resolved);
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  // Auto-rotate if multiple banners
  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const id = setInterval(() => setCurrentIndex(prev => (prev + 1) % bannerUrls.length), 15000);
    return () => clearInterval(id);
  }, [bannerUrls.length]);

  const displayUrls = bannerUrls.length > 0 ? bannerUrls : [fallbackSrc];

  return (
    <div
      className={`relative w-full h-auto aspect-[361/74] sm:aspect-auto sm:h-[144px] overflow-hidden rounded-xl ${className}`}
      style={style}
    >
      {displayUrls.map((url, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-500 ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={url}
            alt={`Tournament Banner ${i + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1360px) 90vw, 1360px"
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Dot indicators (only when multiple banners) */}
      {displayUrls.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {displayUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5 hover:bg-white/75'}`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}