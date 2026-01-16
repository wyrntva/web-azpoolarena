import { useState, useEffect } from 'react';
import {
  Card,
  DatePicker,
  Table,
  message,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  Tag,
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { expenseReportAPI } from '../../api/expenseReport.api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const { Title, Text } = Typography;

export default function ExpenseReport() {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchExpenseReport(selectedMonth);
  }, [selectedMonth]);

  const fetchExpenseReport = async (month) => {
    setLoading(true);
    try {
      const monthStr = month.format('YYYY-MM');
      const response = await expenseReportAPI.getMonthlyExpenseReport(monthStr);
      setReportData(response.data);
    } catch (error) {
      message.error('Không thể tải báo cáo chi phí');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (date) => {
    if (date) {
      setSelectedMonth(date);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Danh mục chi phí',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (text, record) => (
        <Space>
          {record.is_salary ? (
            <TeamOutlined style={{ color: '#1890ff' }} />
          ) : (
            <FileTextOutlined style={{ color: '#52c41a' }} />
          )}
          <strong>{text}</strong>
          {record.is_salary && (
            <Tag color="blue">Lương + Thưởng</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Tổng chi phí',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      width: 200,
      render: (amount) => (
        <Text strong style={{ color: '#f5222d', fontSize: '16px' }}>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(amount)}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <DollarOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
            <Title level={3} style={{ margin: 0 }}>
              Báo cáo chi phí
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Text>Chọn tháng:</Text>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              format="MM/YYYY"
              placeholder="Chọn tháng"
              style={{ width: 150 }}
            />
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Tháng"
                    value={dayjs(reportData.month, 'YYYY-MM').format('MM/YYYY')}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Số danh mục chi phí"
                    value={reportData.categories?.length || 0}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Tổng chi phí"
                    value={reportData.total_expenses || 0}
                    precision={0}
                    valueStyle={{ color: '#f5222d', fontWeight: 'bold' }}
                    prefix={<DollarOutlined />}
                    suffix="₫"
                  />
                </Card>
              </Col>
            </Row>

            {/* Expense Table */}
            <Card
              title="Chi tiết chi phí theo danh mục"
              style={{ marginTop: '16px' }}
            >
              <Table
                columns={columns}
                dataSource={reportData.categories}
                rowKey={(record, index) => record.category_id || `salary-${index}`}
                pagination={false}
                bordered
                summary={(pageData) => {
                  const totalAmount = pageData.reduce(
                    (sum, record) => sum + record.total_amount,
                    0
                  );

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2} align="center">
                          <Text strong style={{ fontSize: '16px' }}>
                            TỔNG CỘNG
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text
                            strong
                            style={{
                              color: '#f5222d',
                              fontSize: '18px',
                              fontWeight: 'bold',
                            }}
                          >
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(totalAmount)}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Card>

            {/* Note about salary calculation */}
            <Card
              style={{ marginTop: '16px', backgroundColor: '#e6f7ff' }}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <Space direction="vertical" size={4}>
                <Text strong>
                  <TeamOutlined /> Lưu ý về chi phí lương nhân viên:
                </Text>
                <Text type="secondary">
                  • Chi phí lương nhân viên = Lương theo giờ + Lương cố định + Tổng thưởng
                </Text>
                <Text type="secondary">
                  • Lương theo giờ (hourly): Tính từ chấm công thực tế × 25,000 VND/giờ
                </Text>
                <Text type="secondary">
                  • Lương cố định (fixed): Toàn bộ lương tháng của nhân viên có lương cứng
                </Text>
                <Text type="secondary">
                  • Thưởng: Tổng tất cả các khoản thưởng trong tháng
                </Text>
              </Space>
            </Card>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Text type="secondary">Không có dữ liệu báo cáo</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
