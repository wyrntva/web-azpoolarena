import { Row, Col, Card, Progress } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  FallOutlined,
  WalletOutlined,
  TeamOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { PageHeader, StatCard } from '../../components/shared';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';

export default function Dashboard() {
  // Mock data - bạn có thể thay thế bằng data thực từ API
  const stats = {
    revenue: 125000000,
    revenueGrowth: { value: 12.5, isPositive: true },
    expense: 85000000,
    expenseGrowth: { value: 8.2, isPositive: false },
    customers: 342,
    customerGrowth: { value: 18, isPositive: true },
    orders: 156,
    orderGrowth: { value: 5.3, isPositive: true },
  };

  const quickStats = [
    {
      label: 'Tiền mặt',
      value: 45000000,
      icon: <WalletOutlined />,
      color: COLORS.success,
      percent: 65,
    },
    {
      label: 'Tài khoản',
      value: 80000000,
      icon: <WalletOutlined />,
      color: COLORS.info,
      percent: 85,
    },
    {
      label: 'Nhân viên',
      value: 24,
      icon: <TeamOutlined />,
      color: COLORS.warning,
      percent: 100,
    },
    {
      label: 'Sản phẩm',
      value: 128,
      icon: <ShopOutlined />,
      color: COLORS.primary,
      percent: 92,
    },
  ];

  const recentActivities = [
    { title: 'Phiếu thu #1234', time: '5 phút trước', amount: '+2,500,000đ', type: 'income' },
    { title: 'Phiếu chi #5678', time: '15 phút trước', amount: '-1,200,000đ', type: 'expense' },
    { title: 'Nhập kho #9012', time: '1 giờ trước', amount: '-5,000,000đ', type: 'expense' },
    { title: 'Doanh thu #3456', time: '2 giờ trước', amount: '+8,900,000đ', type: 'income' },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Tổng quan"
        subtitle={`Chào mừng trở lại! Hôm nay là ${new Date().toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`}
        icon={<RiseOutlined />}
      />

      {/* Main Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: SPACING.lg }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng doanh thu"
            value={stats.revenue}
            icon={<DollarOutlined />}
            color={COLORS.success}
            suffix="đ"
            formatter={(value) => formatCurrency(value).replace(' đ', '')}
            trend={stats.revenueGrowth}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng chi phí"
            value={stats.expense}
            icon={<FallOutlined />}
            color={COLORS.error}
            suffix="đ"
            formatter={(value) => formatCurrency(value).replace(' đ', '')}
            trend={stats.expenseGrowth}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Khách hàng"
            value={stats.customers}
            icon={<UserOutlined />}
            color={COLORS.info}
            trend={stats.customerGrowth}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đơn hàng"
            value={stats.orders}
            icon={<ShoppingCartOutlined />}
            color={COLORS.warning}
            trend={stats.orderGrowth}
          />
        </Col>
      </Row>

      {/* Quick Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: SPACING.lg }}>
        {quickStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              className="hover-card"
              style={{
                boxShadow: SHADOWS.card,
                borderRadius: BORDER_RADIUS.lg,
                border: 'none',
              }}
              styles={{ body: { padding: SPACING.lg } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: COLORS.textSecondary }}>
                    {stat.label}
                  </p>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: 24, fontWeight: 600, color: stat.color }}>
                    {typeof stat.value === 'number' && stat.value > 1000
                      ? formatCurrency(stat.value).replace(' đ', '')
                      : stat.value}
                  </h3>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <Progress
                percent={stat.percent}
                strokeColor={stat.color}
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Activities & Performance */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                Hoạt động gần đây
              </span>
            }
            style={{
              boxShadow: SHADOWS.card,
              borderRadius: BORDER_RADIUS.lg,
              border: 'none',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: SPACING.md,
                    backgroundColor: COLORS.bgLayout,
                    borderRadius: BORDER_RADIUS.md,
                    transition: 'all 0.3s ease',
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: activity.type === 'income' ? COLORS.successLight : COLORS.errorLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: activity.type === 'income' ? COLORS.success : COLORS.error,
                      }}
                    >
                      {activity.type === 'income' ? <RiseOutlined /> : <FallOutlined />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: COLORS.textPrimary }}>
                        {activity.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: COLORS.textSecondary }}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: activity.type === 'income' ? COLORS.success : COLORS.error,
                    }}
                  >
                    {activity.amount}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                Hiệu suất tháng này
              </span>
            }
            style={{
              boxShadow: SHADOWS.card,
              borderRadius: BORDER_RADIUS.lg,
              border: 'none',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: COLORS.textSecondary }}>Mục tiêu doanh thu</span>
                  <span style={{ fontWeight: 600 }}>75%</span>
                </div>
                <Progress percent={75} strokeColor={COLORS.success} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: COLORS.textSecondary }}>Mục tiêu khách hàng</span>
                  <span style={{ fontWeight: 600 }}>68%</span>
                </div>
                <Progress percent={68} strokeColor={COLORS.info} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: COLORS.textSecondary }}>Hiệu quả chi phí</span>
                  <span style={{ fontWeight: 600 }}>85%</span>
                </div>
                <Progress percent={85} strokeColor={COLORS.warning} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: COLORS.textSecondary }}>Năng suất nhân viên</span>
                  <span style={{ fontWeight: 600 }}>92%</span>
                </div>
                <Progress percent={92} strokeColor={COLORS.primary} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
