import { Card, Progress } from 'flowbite-react';
import { formatCurrency } from '../../utils/formatters';

const Dashboard = () => {
  // Mock data - thay thế bằng data thực từ API
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
    { label: 'Tiền mặt', value: 45000000, color: 'green', percent: 65 },
    { label: 'Tài khoản', value: 80000000, color: 'blue', percent: 85 },
    { label: 'Nhân viên', value: 24, color: 'yellow', percent: 100 },
    { label: 'Sản phẩm', value: 128, color: 'purple', percent: 92 },
  ];

  const recentActivities = [
    { title: 'Phiếu thu #1234', time: '5 phút trước', amount: '+2,500,000đ', type: 'income' },
    { title: 'Phiếu chi #5678', time: '15 phút trước', amount: '-1,200,000đ', type: 'expense' },
    { title: 'Nhập kho #9012', time: '1 giờ trước', amount: '-5,000,000đ', type: 'expense' },
    { title: 'Doanh thu #3456', time: '2 giờ trước', amount: '+8,900,000đ', type: 'income' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tổng quan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Chào mừng trở lại! Hôm nay là {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.revenue).replace(' ₫', '')}
              </h3>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {stats.revenueGrowth.value}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-xl font-bold text-green-600">
              VND
            </div>
          </div>
        </Card>

        {/* Total Expense */}
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng chi phí</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(stats.expense).replace(' ₫', '')}
              </h3>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {stats.expenseGrowth.value}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-xl font-bold text-red-600">
              EXP
            </div>
          </div>
        </Card>

        {/* Customers */}
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Khách hàng</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {stats.customers}
              </h3>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {stats.customerGrowth.value}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
              USR
            </div>
          </div>
        </Card>

        {/* Orders */}
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Đơn hàng</p>
              <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.orders}
              </h3>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {stats.orderGrowth.value}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center text-xl font-bold text-yellow-600">
              ORD
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {typeof stat.value === 'number' && stat.value > 1000
                    ? formatCurrency(stat.value).replace(' ₫', '')
                    : stat.value}
                </h3>
              </div>
              {/* Icon removed */}
            </div>
            <Progress progress={stat.percent} color={stat.color} size="sm" />
          </Card>
        ))}
      </div>

      {/* Recent Activities & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hoạt động gần đây
          </h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'income'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                      }`}
                  >
                    {activity.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${activity.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                  {activity.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hiệu suất tháng này
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mục tiêu doanh thu</span>
                <span className="text-sm font-semibold">75%</span>
              </div>
              <Progress progress={75} color="green" size="sm" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mục tiêu khách hàng</span>
                <span className="text-sm font-semibold">68%</span>
              </div>
              <Progress progress={68} color="blue" size="sm" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Hiệu quả chi phí</span>
                <span className="text-sm font-semibold">85%</span>
              </div>
              <Progress progress={85} color="yellow" size="sm" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Năng suất nhân viên</span>
                <span className="text-sm font-semibold">92%</span>
              </div>
              <Progress progress={92} color="purple" size="sm" />
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;