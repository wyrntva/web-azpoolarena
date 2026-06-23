'use client';

import React from 'react';
import { Typography, Avatar } from 'antd';
import Image from 'next/image';

const { Title, Text } = Typography;

interface PlayerProfileProps {
  name: string;
  rank?: string;
  avatarUrl?: string;
  className?: string;
}

export default function PlayerProfile({
  name = "Quốc Huy",
  rank = "Lv .5",
  avatarUrl,
  className = ""
}: PlayerProfileProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Player Avatar */}
      <div className="mr-4">
        {avatarUrl ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden">
            <Image
              src={avatarUrl}
              alt={name}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <Avatar
            size={64}
            style={{ backgroundColor: '#1677ff' }}
          >
            {name.charAt(0)}
          </Avatar>
        )}
      </div>

      {/* Player Info */}
      <div>
        <Title level={4} className="m-0 font-medium">
          {name}
        </Title>
        <Text className="text-gray-500">
          {rank}
        </Text>
      </div>
    </div>
  );
} 