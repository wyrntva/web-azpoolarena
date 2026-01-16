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
  Input,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  DollarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { safeAPI } from '../../api/safe.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Safe() {
  const [safes, setSafes] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSafe, setEditingSafe] = useState(null);
  const [form] = Form.useForm();
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  useEffect(() => {
    fetchSafes();
    fetchBalance();
  }, [selectedMonth]);

  const fetchSafes = async () => {
    setLoading(true);
    try {
      const params = {
        month: selectedMonth.month() + 1,
        year: selectedMonth.year(),
      };
      const response = await safeAPI.getSafes(params);
      setSafes(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách cân két');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const params = {
        month: selectedMonth.month() + 1,
        year: selectedMonth.year(),
      };
      const response = await safeAPI.getBalance(params);
      setBalance(response.data);
    } catch (error) {
      message.error('Không thể tải số dư két');
    }
  };

  const handleCreate = () => {
    setEditingSafe(null);
    form.resetFields();
    form.setFieldsValue({ safe_date: dayjs() });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSafe(record);
    form.setFieldsValue({
      safe_date: dayjs(record.safe_date),
      amount: record.amount,
      note: record.note,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await safeAPI.deleteSafe(id);
      message.success('Xóa phiếu cân két thành công');
      fetchSafes();
      fetchBalance();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa phiếu cân két thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        safe_date: values.safe_date.format('YYYY-MM-DD'),
      };

      if (editingSafe) {
        await safeAPI.updateSafe(editingSafe.id, data);
        message.success('Cập nhật phiếu cân két thành công');
      } else {
        await safeAPI.createSafe(data);
        message.success('Thêm phiếu cân két thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchSafes();
      fetchBalance();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'safe_date',
      key: 'safe_date',
      render: (date) => <strong>{formatDate(date)}</strong>,
      width: 120,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <strong style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 14 }}>
          {amount >= 0 ? '+' : ''}{formatCurrency(amount)}
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
            description="Bạn có chắc muốn xóa phiếu cân két này?"
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

  const totalAdjustments = safes.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Số tiền hiện tại trong két"
              value={balance?.balance || 0}
              precision={0}
              prefix={<SafetyOutlined />}
              suffix="đ"
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Số tiền hiện tại trong tài khoản"
              value={balance?.bank_balance || 0}
              precision={0}
              prefix={<BankOutlined />}
              suffix="đ"
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Tài chính - Quản lý cân két</span>
          </Space>
        }
        extra={
          <Space>
            <DatePicker
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date || dayjs())}
              picker="month"
              format="MM/YYYY"
              placeholder="Chọn tháng"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm phiếu cân két
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={safes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} phiếu`,
          }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Tổng điều chỉnh</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <strong style={{ color: totalAdjustments >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
                    {totalAdjustments >= 0 ? '+' : ''}{formatCurrency(totalAdjustments)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
                <Table.Summary.Cell index={3} />
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <Modal
          title={editingSafe ? 'Chỉnh sửa phiếu cân két' : 'Thêm phiếu cân két mới'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText={editingSafe ? 'Cập nhật' : 'Thêm'}
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
              name="safe_date"
              label="Ngày cân két"
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Số tiền (+ để thêm, - để trừ)"
              rules={[
                { required: true, message: 'Vui lòng nhập số tiền' },
                { type: 'number', message: 'Số tiền phải là số' },
              ]}
              help="Nhập số dương (+) để cộng tiền vào két, số âm (-) để trừ tiền khỏi két"
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value.replace(/,/g, '')}
                placeholder="Nhập số tiền (VD: 100000 hoặc -50000)"
                suffix="đ"
              />
            </Form.Item>

            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú (không bắt buộc)" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
