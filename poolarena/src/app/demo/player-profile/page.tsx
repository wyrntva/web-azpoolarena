'use client';

import React from 'react';
import { Card, Typography, Space, Divider, Row, Col } from 'antd';
import { PlayerProfile } from '@/components';

const { Title, Text } = Typography;

export default function PlayerProfileDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Title level={2} className="mb-6">Player Profile Component</Title>
        
        <Card className="mb-8">
          <Title level={4} className="mb-4">Default Example</Title>
          <PlayerProfile name="Quốc Huy" />
          <Text className="block mt-4 text-gray-600">
            Default props: name="Quốc Huy", rank="Hạng E"
          </Text>
        </Card>

        <Card className="mb-8">
          <Title level={4} className="mb-4">With Avatar Image</Title>
          <PlayerProfile 
            name="Quốc Huy"
            rank="Hạng E"
            avatarUrl="https://randomuser.me/api/portraits/men/32.jpg"
          />
        </Card>

        <Divider>Different Styles</Divider>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <PlayerProfile 
                name="Nguyễn Văn A"
                rank="Hạng A"
                avatarUrl="https://randomuser.me/api/portraits/men/41.jpg"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <PlayerProfile 
                name="Trần Thị B"
                rank="Hạng B"
                avatarUrl="https://randomuser.me/api/portraits/women/44.jpg"
              />
            </Card>
          </Col>
        </Row>

        <Card className="mt-8 bg-gray-800">
          <PlayerProfile 
            name="Lê Văn C"
            rank="Hạng S"
            className="text-white"
          />
          <Text className="block mt-4 text-gray-400">
            With custom className for dark background
          </Text>
        </Card>
      </div>
    </div>
  );
} 