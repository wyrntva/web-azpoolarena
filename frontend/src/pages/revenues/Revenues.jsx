import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
  Input,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
  BankOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { revenueAPI } from '../../api/revenue.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Revenues() {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  useEffect(() => {
    fetchRevenues();
  }, [dateRange]);

  const fetchRevenues = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      };
      const response = await revenueAPI.getRevenues(params);
      setRevenues(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRevenue(null);
    form.resetFields();
    form.setFieldsValue({
      revenue_date: dayjs(),
      cash_revenue: 0,
      bank_revenue: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRevenue(record);
    form.setFieldsValue({
      revenue_date: dayjs(record.revenue_date),
      cash_revenue: record.cash_revenue,
      bank_revenue: record.bank_revenue,
      note: record.note,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await revenueAPI.deleteRevenue(id);
      message.success('Xóa doanh thu thành công');
      fetchRevenues();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa doanh thu thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        revenue_date: values.revenue_date.format('YYYY-MM-DD'),
      };

      if (editingRevenue) {
        await revenueAPI.updateRevenue(editingRevenue.id, data);
        message.success('Cập nhật doanh thu thành công');
      } else {
        await revenueAPI.createRevenue(data);
        message.success('Thêm doanh thu thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchRevenues();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const calculateTotals = () => {
    const totalCash = revenues.reduce((sum, r) => sum + r.cash_revenue, 0);
    const totalBank = revenues.reduce((sum, r) => sum + r.bank_revenue, 0);
    return {
      totalCash,
      totalBank,
      total: totalCash + totalBank,
    };
  };

  const totals = calculateTotals();

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'revenue_date',
      key: 'revenue_date',
      render: (date) => <strong>{formatDate(date)}</strong>,
      width: 120,
    },
    {
      title: 'Doanh thu tiền mặt',
      dataIndex: 'cash_revenue',
      key: 'cash_revenue',
      render: (amount) => (
        <span style={{ color: '#1890ff' }}>{formatCurrency(amount)}</span>
      ),
      align: 'right',
    },
    {
      title: 'Doanh thu tài khoản',
      dataIndex: 'bank_revenue',
      key: 'bank_revenue',
      render: (amount) => (
        <span style={{ color: '#52c41a' }}>{formatCurrency(amount)}</span>
      ),
      align: 'right',
    },
    {
      title: 'Tổng doanh thu',
      key: 'total',
      render: (_, record) => (
        <strong style={{ color: '#f5222d' }}>
          {formatCurrency(record.cash_revenue + record.bank_revenue)}
        </strong>
      ),
      align: 'right',
    },
    {
      title: 'Người thao tác',
      dataIndex: 'created_by_user',
      key: 'created_by_user',
      render: (user) => user?.full_name || '-',
      width: 150,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa bản ghi doanh thu này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu tiền mặt"
              value={totals.totalCash}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<WalletOutlined />}
              suffix="đ"
              formatter={(value) => formatCurrency(value).replace(' đ', '')}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu tài khoản"
              value={totals.totalBank}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<BankOutlined />}
              suffix="đ"
              formatter={(value) => formatCurrency(value).replace(' đ', '')}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totals.total}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<DollarOutlined />}
              suffix="đ"
              formatter={(value) => formatCurrency(value).replace(' đ', '')}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Quản lý doanh thu</span>
          </Space>
        }
        extra={
          <Space>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates || [dayjs().startOf('month'), dayjs().endOf('month')])}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Cập nhật doanh thu
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={revenues}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Tổng cộng</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <strong style={{ color: '#1890ff' }}>
                    {formatCurrency(totals.totalCash)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <strong style={{ color: '#52c41a' }}>
                    {formatCurrency(totals.totalBank)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <strong style={{ color: '#f5222d', fontSize: 16 }}>
                    {formatCurrency(totals.total)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
                <Table.Summary.Cell index={5} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Modal
        title={editingRevenue ? 'Chỉnh sửa doanh thu' : 'Thêm doanh thu mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingRevenue ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="revenue_date"
            label="Ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="cash_revenue"
            label="Doanh thu tiền mặt"
            rules={[
              { required: true, message: 'Vui lòng nhập doanh thu tiền mặt' },
              { type: 'number', min: 0, message: 'Số tiền phải lớn hơn hoặc bằng 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) => value.replace(/,/g, '')}
              placeholder="Nhập doanh thu tiền mặt"
              prefix={<WalletOutlined />}
              suffix="đ"
            />
          </Form.Item>

          <Form.Item
            name="bank_revenue"
            label="Doanh thu tài khoản"
            rules={[
              { required: true, message: 'Vui lòng nhập doanh thu tài khoản' },
              { type: 'number', min: 0, message: 'Số tiền phải lớn hơn hoặc bằng 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) => value.replace(/,/g, '')}
              placeholder="Nhập doanh thu tài khoản"
              prefix={<BankOutlined />}
              suffix="đ"
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
