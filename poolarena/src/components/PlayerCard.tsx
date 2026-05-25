'use client';

import React, { memo } from 'react';
import { Card, Typography, Divider, Row, Col, Tag, Button } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import { PlayerProfile } from './index';

const { Text } = Typography;

interface PlayerStats {
  wins?: number;
  losses?: number;
  winRate?: number;
  points?: number;
  level?: number;
  streak?: number;
}

interface PlayerCardProps {
  id?: string;
  name: string;
  rank?: string;
  avatarUrl?: string;
  stats?: PlayerStats;
  isOnline?: boolean;
  isFriend?: boolean;
  onAddFriend?: () => void;
  onViewProfile?: () => void;
}

// Memoize component để tránh re-render không cần thiết
const PlayerCard = memo(function PlayerCard({
  id,
  name,
  rank = "Hạng E",
  avatarUrl,
  stats = {
    wins: 42,
    losses: 18,
    winRate: 70,
    points: 1250,
    level: 5,
    streak: 3
  },
  isOnline = false,
  isFriend = false,
  onAddFriend,
  onViewProfile
}: PlayerCardProps) {
  return (
    <Card className="overflow-hidden shadow-md">
      {/* Header with online status */}
      {isOnline !== undefined && (
        <div className="absolute top-2 right-2">
          <Tag color={isOnline ? "success" : "default"}>
            {isOnline ? "Online" : "Offline"}
          </Tag>
        </div>
      )}
      
      {/* Player Profile */}
      <div className="mb-4">
        <PlayerProfile 
          name={name}
          rank={rank}
          avatarUrl={avatarUrl}
        />
      </div>
      
      <Divider className="my-3" />
      
      {/* Player Stats */}
      <div className="mb-4">
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div className="text-center">
              <Text className="text-gray-500 block text-xs">Thắng/Thua</Text>
              <Text className="font-medium">
                <span className="text-green-600">{stats.wins}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-red-600">{stats.losses}</span>
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="text-center">
              <Text className="text-gray-500 block text-xs">Tỷ lệ thắng</Text>
              <Text className="font-medium">{stats.winRate}%</Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="text-center">
              <Text className="text-gray-500 block text-xs">Điểm</Text>
              <Text className="font-medium text-blue-600">{stats.points}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="text-center">
              <Text className="text-gray-500 block text-xs">Chuỗi thắng</Text>
              <div className="flex items-center justify-center">
                <FireOutlined className="text-orange-500 mr-1" />
                <Text className="font-medium">{stats.streak}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isFriend && onAddFriend && (
          <Button 
            type="default" 
            size="small" 
            block
            onClick={onAddFriend}
          >
            Kết bạn
          </Button>
        )}
        {onViewProfile && (
          <Button 
            type="primary" 
            size="small" 
            block
            onClick={onViewProfile}
            className="bg-blue-600 hover:bg-blue-700 border-none"
          >
            Xem hồ sơ
          </Button>
        )}
      </div>
    </Card>
  );
});

export default PlayerCard; 