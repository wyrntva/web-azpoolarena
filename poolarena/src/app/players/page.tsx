'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Typography, Button, Input, Select, Row, Col, Pagination } from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { PlayerCard } from '@/components';
import { useUsers } from '@/hooks/useUsers';
import { useUsersFilterStore } from '@/stores/users.store';

const { Title, Text } = Typography;
const { Option } = Select;

const ITEMS_PER_PAGE = 20;

export default function PlayersPage() {
  const router = useRouter();
  const { data: users, isLoading, isError } = useUsers();
  const { search, rank, online, setSearch, setRank, setOnline } = useUsersFilterStore();
  const [currentPage, setCurrentPage] = useState(1);

  // Memoize filtered users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch = search
        ? u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone_number?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesRank = rank ? (u.rank === rank) : true;
      const matchesOnline = online
        ? online === 'online' ? !!u.is_active : !u.is_active
        : true;
      return matchesSearch && matchesRank && matchesOnline;
    });
  }, [users, search, rank, online]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleViewProfile = useCallback((playerId: string) => {
    router.push(`/player/${playerId}`);
  }, [router]);

  const handleAddFriend = useCallback((playerId: string) => {
    // TODO: implement add friend
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi search
  }, [setSearch]);

  const handleRankChange = useCallback((value: string | undefined) => {
    setRank(value as any);
    setCurrentPage(1);
  }, [setRank]);

  const handleOnlineChange = useCallback((value: string | undefined) => {
    setOnline(value as any);
    setCurrentPage(1);
  }, [setOnline]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/tournaments')}
                className="text-gray-600 hover:text-gray-800"
              >
                Quay lại
              </Button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg mr-3 flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded-full"></div>
                </div>
                <Title level={3} className="mb-0">Người chơi</Title>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm người chơi"
              className="md:w-64"
              value={search}
              onChange={handleSearchChange}
            />
            <Select
              placeholder="Xếp hạng"
              style={{ width: 120 }}
              allowClear
              value={rank}
              onChange={handleRankChange}
            >
              <Option value="S">Hạng S</Option>
              <Option value="A">Hạng A</Option>
              <Option value="B">Hạng B</Option>
              <Option value="C">Hạng C</Option>
              <Option value="D">Hạng D</Option>
              <Option value="E">Hạng E</Option>
              <Option value="K">Hạng K</Option>
            </Select>
            <Select
              placeholder="Trạng thái"
              style={{ width: 120 }}
              allowClear
              value={online}
              onChange={handleOnlineChange}
            >
              <Option value="online">Online</Option>
              <Option value="offline">Offline</Option>
            </Select>
          </div>
        </div>

        {/* Players Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <Title level={4} className="mb-0">Danh sách người chơi</Title>
            {filteredUsers.length > 0 && (
              <Text className="text-gray-500">
                {filteredUsers.length} người chơi
              </Text>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {isError && (
            <Text type="danger">Không thể tải danh sách người chơi.</Text>
          )}

          {!isLoading && !isError && (
            <>
              <Row gutter={[16, 16]}>
                {paginatedUsers.map((u) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={u.id}>
                    <PlayerCard
                      id={String(u.id)}
                      name={u.full_name}
                      rank={u.rank ? `Hạng ${u.rank}` : 'Hạng E'}
                      avatarUrl={undefined}
                      stats={{
                        wins: u.wins ?? 0,
                        losses: u.losses ?? 0,
                        winRate: u.win_rate ?? 0,
                        points: u.total_games ?? 0,
                        streak: 0,
                      }}
                      isOnline={u.is_active}
                      onAddFriend={() => handleAddFriend(String(u.id))}
                      onViewProfile={() => handleViewProfile(String(u.id))}
                    />
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {filteredUsers.length > ITEMS_PER_PAGE && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    current={currentPage}
                    total={filteredUsers.length}
                    pageSize={ITEMS_PER_PAGE}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} người chơi`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Text className="text-gray-400 text-sm">
              © 2024 Pool Arena. All rights reserved.
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
}
