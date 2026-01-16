import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  message,
  Input,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  WalletOutlined,
  BankOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { exchangeAPI } from '../../api/exchange.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ACCOUNT_TYPES = {
  cash: { label: 'Tiền mặt', icon: <WalletOutlined />, color: 'blue' },
  bank: { label: 'Tài khoản', icon: <BankOutlined />, color: 'green' },
};

export default function Exchanges() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExchange, setEditingExchange] = useState(null);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  useEffect(() => {
    fetchExchanges();
  }, [dateRange]);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      };
      const response = await exchangeAPI.getExchanges(params);
      setExchanges(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách chuyển tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingExchange(null);
    form.resetFields();
    form.setFieldsValue({ exchange_date: dayjs() });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingExchange(record);
    form.setFieldsValue({
      exchange_date: dayjs(record.exchange_date),
      amount: record.amount,
      from_account: record.from_account,
      to_account: record.to_account,
      note: record.note,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await exchangeAPI.deleteExchange(id);
      message.success('Xóa giao dịch thành công');
      fetchExchanges();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa giao dịch thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (values.from_account === values.to_account) {
        message.error('Tài khoản nguồn và đích không thể giống nhau');
        return;
      }

      const data = {
        ...values,
        exchange_date: values.exchange_date.format('YYYY-MM-DD'),
      };

      if (editingExchange) {
        await exchangeAPI.updateExchange(editingExchange.id, data);
        message.success('Cập nhật giao dịch thành công');
      } else {
        await exchangeAPI.createExchange(data);
        message.success('Thêm giao dịch thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchExchanges();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'exchange_date',
      key: 'exchange_date',
      render: (date) => <strong>{formatDate(date)}</strong>,
      width: 120,
    },
    {
      title: 'Từ tài khoản',
      dataIndex: 'from_account',
      key: 'from_account',
      render: (account) => {
        const accountInfo = ACCOUNT_TYPES[account];
        return (
          <Tag color={accountInfo?.color} icon={accountInfo?.icon}>
            {accountInfo?.label || account}
          </Tag>
        );
      },
      width: 150,
    },
    {
      title: '',
      key: 'arrow',
      width: 50,
      align: 'center',
      render: () => <ArrowRightOutlined style={{ color: '#999' }} />,
    },
    {
      title: 'Đến tài khoản',
      dataIndex: 'to_account',
      key: 'to_account',
      render: (account) => {
        const accountInfo = ACCOUNT_TYPES[account];
        return (
          <Tag color={accountInfo?.color} icon={accountInfo?.icon}>
            {accountInfo?.label || account}
          </Tag>
        );
      },
      width: 150,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <strong style={{ color: '#1890ff', fontSize: 14 }}>
          {formatCurrency(amount)}
        </strong>
      ),
      align: 'right',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
    {
      title: 'Người thao tác',
      dataIndex: 'created_by_user',
      key: 'created_by_user',
      render: (user) => user?.full_name || '-',
      width: 150,
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
            description="Bạn có chắc muốn xóa giao dịch này?"
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

  const totalAmount = exchanges.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card
      title={
        <Space>
          <SwapOutlined />
          <span>Quản lý đổi tiền</span>
        </Space>
      }
      extra={
        <Space>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(
                dates || [dayjs().startOf('month'), dayjs().endOf('month')]
              )
            }
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm phiếu đổi tiền
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={exchanges}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} giao dịch`,
        }}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <strong>Tổng cộng</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong style={{ color: '#1890ff', fontSize: 16 }}>
                  {formatCurrency(totalAmount)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
              <Table.Summary.Cell index={3} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <Modal
        title={editingExchange ? 'Chỉnh sửa phiếu đổi tiền' : 'Thêm phiếu đổi tiền mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingExchange ? 'Cập nhật' : 'Thêm'}
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
            name="exchange_date"
            label="Ngày đổi"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="from_account"
            label="Từ tài khoản"
            rules={[{ required: true, message: 'Vui lòng chọn tài khoản nguồn' }]}
          >
            <Select placeholder="Chọn tài khoản nguồn">
              <Select.Option value="cash">
                <Tag color="blue" icon={<WalletOutlined />}>
                  Tiền mặt
                </Tag>
              </Select.Option>
              <Select.Option value="bank">
                <Tag color="green" icon={<BankOutlined />}>
                  Tài khoản
                </Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <ArrowRightOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          </div>

          <Form.Item
            name="to_account"
            label="Đến tài khoản"
            rules={[
              { required: true, message: 'Vui lòng chọn tài khoản đích' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('from_account') !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Tài khoản đích phải khác tài khoản nguồn')
                  );
                },
              }),
            ]}
          >
            <Select placeholder="Chọn tài khoản đích">
              <Select.Option value="cash">
                <Tag color="blue" icon={<WalletOutlined />}>
                  Tiền mặt
                </Tag>
              </Select.Option>
              <Select.Option value="bank">
                <Tag color="green" icon={<BankOutlined />}>
                  Tài khoản
                </Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Số tiền"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) => value.replace(/,/g, '')}
              placeholder="Nhập số tiền"
              suffix="đ"
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
