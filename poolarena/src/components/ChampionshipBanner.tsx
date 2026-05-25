'use client';

import React from 'react';
import Image from 'next/image';
import { Typography } from 'antd';

const { Title, Text } = Typography;

interface ChampionshipBannerProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  logoColor?: string;
  height?: string | number;
}

export default function ChampionshipBanner({ className = "" }: { className?: string }) {

  return (
    <div className={`${className} relative h-[144px] w-full`}>
      <Image
        src="/images/home_banner.png"
        alt="Asian Open"
        fill
        sizes="100vw"
        className="object-cover rounded-[12px]"
        priority
      />
    </div>
  );
}