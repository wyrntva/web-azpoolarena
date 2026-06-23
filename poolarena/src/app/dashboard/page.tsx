'use client';

import React from 'react';
import { Card, Typography, Row, Col, Statistic, Button, Space } from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  LogoutOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import TournamentCard from '@/components/TournamentCard';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const featuredTournament = {
    title: "GIẢI ĐẤU ARENA POOL",
    subtitle: "CHAMPIONSHIP SONG TỬ",
    category: "SAUDI JUNIOR",
    date: "13/04/2024",
    time: "09h00",
    participants: { current: 32, max: 52 },
    isRegistered: false
  };

  const handleTournamentRegister = () => {
    // TODO: Handle tournament registration
  };

  return (
    <div className="min-h-screen bg-[#F0F2F4]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-0 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg mr-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-full"></div>
              </div>
              <Title level={3} className="mb-0">Pool Arena</Title>
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800"
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-0 py-8">
        <div className="mb-8">
          <Title level={2}>Chào mừng trở lại!</Title>
          <Text className="text-gray-600">Quản lý hoạt động bida của bạn</Text>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng trận đấu"
                value={25}
                prefix={<PlayCircleOutlined className="text-blue-600" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tỷ lệ thắng"
                value={68}
                suffix="%"
                prefix={<TrophyOutlined className="text-green-600" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Xếp hạng"
                value={12}
                prefix={<UserOutlined className="text-orange-600" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Điểm số"
                value={1247}
                prefix={<TrophyOutlined className="text-purple-600" />}
              />
            </Card>
          </Col>
        </Row>

        {/* Featured Tournament Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Title level={3}>Giải đấu nổi bật</Title>
              <Text className="text-gray-600">Đừng bỏ lỡ cơ hội tham gia giải đấu hấp dẫn</Text>
            </div>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 border-none"
            >
              Xem tất cả
            </Button>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <TournamentCard
                tournament={{
                  ...featuredTournament,
                  id: 1,
                  slug: "giai-dau-arena-pool-13042024",
                  img: "/images/tournament.webp",
                  rank: "Gold"
                }}
                variant="upcoming"
                onCardClick={(tournament) => router.push(`/tournaments/${tournament.slug}`)}
                onRegister={handleTournamentRegister}
              />
            </Col>
            <Col xs={24} sm={12} lg={16}>
              <Row gutter={[16, 16]} className="h-full">
                {/* Quick Actions */}
                <Col xs={24} lg={12}>
                  <Card title="Trận đấu gần đây" className="h-full">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-[#F0F2F4] rounded-lg">
                        <div>
                          <Text strong>vs Nguyễn Văn A</Text>
                          <br />
                          <Text className="text-gray-500 text-sm">2 giờ trước</Text>
                        </div>
                        <Text className="text-green-600 font-semibold">Thắng</Text>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#F0F2F4] rounded-lg">
                        <div>
                          <Text strong>vs Trần Thị B</Text>
                          <br />
                          <Text className="text-gray-500 text-sm">1 ngày trước</Text>
                        </div>
                        <Text className="text-red-600 font-semibold">Thua</Text>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#F0F2F4] rounded-lg">
                        <div>
                          <Text strong>vs Lê Văn C</Text>
                          <br />
                          <Text className="text-gray-500 text-sm">3 ngày trước</Text>
                        </div>
                        <Text className="text-green-600 font-semibold">Thắng</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Thống kê tuần này" className="h-full">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Text>Trận đấu:</Text>
                        <Text strong>8 trận</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text>Thắng:</Text>
                        <Text strong className="text-green-600">5 trận</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text>Thua:</Text>
                        <Text strong className="text-red-600">3 trận</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text>Thời gian chơi:</Text>
                        <Text strong>12 giờ</Text>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button type="primary" block>
                        Xem chi tiết
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        {/* Quick Navigation */}
        <Row gutter={[16, 16]} className="mt-8">
          <Col xs={24} sm={8}>
            <Card
              hoverable
              className="text-center cursor-pointer h-24 flex items-center justify-center"
              onClick={() => router.push('/')}
            >
              <div>
                <TrophyOutlined className="text-2xl text-blue-600 mb-2" />
                <Text strong>Giải đấu</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              className="text-center cursor-pointer h-24 flex items-center justify-center"
              onClick={() => router.push('/ranking')}
            >
              <div>
                <UserOutlined className="text-2xl text-green-600 mb-2" />
                <Text strong>Bảng xếp hạng</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              className="text-center cursor-pointer h-24 flex items-center justify-center"
              onClick={() => router.push('/games')}
            >
              <div>
                <PlayCircleOutlined className="text-2xl text-purple-600 mb-2" />
                <Text strong>Trận đấu</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
} 