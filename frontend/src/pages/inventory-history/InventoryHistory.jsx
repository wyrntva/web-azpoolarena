import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  message,
  DatePicker,
  Select,
  Modal,
  Descriptions,
  Row,
  Col,
} from 'antd';
import {
  HistoryOutlined,
  ImportOutlined,
  ExportOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { inventoryAPI } from '../../api/inventory.api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function InventoryHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [transactionType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [inResponse, outResponse] = await Promise.all([
        inventoryAPI.getInventoryIns(),
        inventoryAPI.getInventoryOuts(),
      ]);

      let allTransactions = [
        ...inResponse.data.map(t => ({ ...t, transaction_type: 'in' })),
        ...outResponse.data.map(t => ({ ...t, transaction_type: 'out' })),
      ];

      // Filter by transaction type
      if (transactionType) {
        allTransactions = allTransactions.filter(t => t.transaction_type === transactionType);
      }

      // Filter by date range
      if (dateRange && dateRange.length === 2) {
        allTransactions = allTransactions.filter(t => {
          const transDate = dayjs(t.transaction_date);
          return transDate.isAfter(dateRange[0].startOf('day')) &&
                 transDate.isBefore(dateRange[1].endOf('day'));
        });
      }

      // Sort by date descending
      allTransactions.sort((a, b) =>
        dayjs(b.transaction_date).unix() - dayjs(a.transaction_date).unix()
      );

      setTransactions(allTransactions);
    } catch (error) {
      message.error('Không thể tải lịch sử kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  const showDetails = (record) => {
    setSelectedTransaction(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      width: 120,
    },
    {
      title: 'Loại',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      render: (type) => (
        type === 'in' ? (
          <Tag icon={<ImportOutlined />} color="success">Nhập kho</Tag>
        ) : (
          <Tag icon={<ExportOutlined />} color="error">Xuất kho</Tag>
        )
      ),
      align: 'center',
      width: 120,
    },
    {
      title: 'Số lượng sản phẩm',
      dataIndex: 'details',
      key: 'product_count',
      render: (details) => details?.length || 0,
      align: 'center',
      width: 150,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'details',
      key: 'products',
      render: (details) => {
        if (!details || details.length === 0) return '-';
        const productNames = details.map(d => d.inventory?.product_name).filter(Boolean);
        if (productNames.length === 0) return '-';
        if (productNames.length === 1) return productNames[0];
        return `${productNames[0]} (+${productNames.length - 1} khác)`;
      },
      ellipsis: true,
    },
    {
      title: 'Tổng số lượng',
      dataIndex: 'details',
      key: 'total_quantity',
      render: (details) => {
        if (!details || details.length === 0) return 0;
        const total = details.reduce((sum, d) => sum + (d.quantity || 0), 0);
        return total.toLocaleString();
      },
      align: 'center',
      width: 130,
    },
    {
      title: 'Người tạo',
      dataIndex: 'created_by_user',
      key: 'created_by',
      render: (user) => user?.full_name || user?.username || '-',
      width: 150,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => showDetails(record)}>
            <EyeOutlined /> Xem
          </a>
        </Space>
      ),
    },
  ];

  const statistics = {
    total: transactions.length,
    in: transactions.filter(t => t.transaction_type === 'in').length,
    out: transactions.filter(t => t.transaction_type === 'out').length,
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Tổng giao dịch</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.total}</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Nhập kho</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{statistics.in}</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Xuất kho</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>{statistics.out}</div>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <HistoryOutlined />
            <span>Lịch sử nhập/xuất kho</span>
          </Space>
        }
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Lọc theo loại"
              style={{ width: 150 }}
              value={transactionType}
              onChange={setTransactionType}
              allowClear
            >
              <Select.Option value="in">Nhập kho</Select.Option>
              <Select.Option value="out">Xuất kho</Select.Option>
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} giao dịch`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {selectedTransaction?.transaction_type === 'in' ? (
              <Tag icon={<ImportOutlined />} color="success">Nhập kho</Tag>
            ) : (
              <Tag icon={<ExportOutlined />} color="error">Xuất kho</Tag>
            )}
            <span>Chi tiết phiếu</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTransaction && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Ngày">
                {dayjs(selectedTransaction.transaction_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                {selectedTransaction.created_by_user?.full_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {selectedTransaction.note || '-'}
              </Descriptions.Item>
            </Descriptions>

            <h4>Danh sách sản phẩm:</h4>
            <Table
              size="small"
              dataSource={selectedTransaction.details}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Sản phẩm',
                  dataIndex: 'inventory',
                  render: (inventory) => inventory?.product_name || '-',
                },
                {
                  title: 'Số lượng',
                  dataIndex: 'quantity',
                  align: 'center',
                  render: (quantity) => quantity?.toLocaleString() || 0,
                },
                {
                  title: 'Đơn vị',
                  dataIndex: 'unit_type',
                  align: 'center',
                  render: (type) => type === 'large' ? 'Lớn' : 'Cơ bản',
                },
                {
                  title: 'Giá tiền',
                  dataIndex: 'price',
                  align: 'right',
                  render: (price) => price ? `${price.toLocaleString()} đ` : '-',
                },
                {
                  title: 'Thanh toán',
                  dataIndex: 'payment_method',
                  align: 'center',
                  render: (method) => {
                    if (!method) return '-';
                    return method === 'cash' ? (
                      <Tag color="green">Tiền mặt</Tag>
                    ) : (
                      <Tag color="blue">Chuyển khoản</Tag>
                    );
                  },
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
