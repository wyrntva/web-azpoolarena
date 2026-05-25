'use client';

import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import { UserProfileHeader } from '@/components';

const { Title, Text } = Typography;

export default function UserHeaderDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Title level={2} className="mb-6">User Profile Header Component</Title>
        
        <Card className="mb-8">
          <Title level={4} className="mb-4">Default Example</Title>
          <div className="border rounded overflow-hidden">
            <UserProfileHeader name="Quốc Huy" />
          </div>
          <Text className="block mt-4 text-gray-600">
            Default props: id="7", name="Quốc Huy", phoneNumber="0915 555 777", rank="Hạng C+"
          </Text>
        </Card>

        <Card className="mb-8">
          <Title level={4} className="mb-4">Custom Example</Title>
          <div className="border rounded overflow-hidden">
            <UserProfileHeader 
              id="42"
              name="Nguyễn Văn A"
              phoneNumber="0987 654 321"
              rank="Hạng A"
            />
          </div>
        </Card>

        <Card className="mb-8">
          <Title level={4} className="mb-4">Without Phone Number</Title>
          <div className="border rounded overflow-hidden">
            <UserProfileHeader 
              id="15"
              name="Trần Thị B"
              phoneNumber=""
              rank="Hạng B"
            />
          </div>
        </Card>
      </div>
    </div>
  );
} 