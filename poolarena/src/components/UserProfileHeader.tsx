'use client';

import React from 'react';
import { Typography, Avatar } from 'antd';
import Image from 'next/image';

const { Text } = Typography;

interface UserProfileHeaderProps {
  id?: string;
  name: string;
  phoneNumber?: string;
  points?: number;
  rank?: string;
  avatarUrl?: string;
}

export default function UserProfileHeader({
  id = "7",
  name = "Quốc Huy",
  phoneNumber = "0915 555 777",
  points = 700,
  rank = "Hạng C+",
  avatarUrl
}: UserProfileHeaderProps) {
  return (
    <div className="w-full bg-white py-2 px-6 flex items-center justify-between border-b">
      {/* Left Section: ID and User Info */}
      <div className="flex items-center">
        {/* ID Number */}
        <div className="flex items-center mr-3">
          <Text className="text-gray-500 text-sm mr-0.5">#</Text>
          <Text className="font-medium">{id}</Text>
        </div>
        
        {/* Avatar and Name */}
        <div className="flex items-center">
          <Avatar 
            size={28} 
            src={avatarUrl}
            style={{ backgroundColor: '#1677ff' }}
          >
            {name.charAt(0)}
          </Avatar>
          <Text className="ml-2 font-medium">{name}</Text>
        </div>
      </div>
      
      {/* Right Section: Phone and Rank */}
      <div className="flex items-center space-x-6">
        {/* Phone Number */}
        {phoneNumber && (
          <Text className="text-gray-700">{phoneNumber}</Text>
        )}
        
        {/* Rank */}
        <Text className="text-blue-600 font-medium">{rank}</Text>
      </div>
    </div>
  );
} 