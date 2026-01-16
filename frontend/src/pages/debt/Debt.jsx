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
  Tag,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  WalletOutlined,
  BankOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { debtAPI } from '../../api/debt.api';
import { userAPI } from '../../api/user.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Debt() {
  const [debts, setDebts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [payingDebt, setPayingDebt] = useState(null);
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    fetchDebts();
    fetchUsers();
  }, []);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const response = await debtAPI.getDebts({ is_paid: false });
      setDebts(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách công nợ');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      // Sort users by created_at ascending (earliest created first)
      const sortedUsers = (response.data || []).sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA - dateB;
      });
      setUsers(sortedUsers);
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên');
    }
  };

  const handleCreate = () => {
    setEditingDebt(null);
    form.resetFields();
    form.setFieldsValue({ debt_date: dayjs() });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingDebt(record);
    form.setFieldsValue({
      debt_date: dayjs(record.debt_date),
      amount: record.amount,
      debtor_name: record.debtor_name,
      note: record.note,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await debtAPI.deleteDebt(id);
      message.success('Xóa công nợ thành công');
      fetchDebts();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa công nợ thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        debt_date: values.debt_date.format('YYYY-MM-DD'),
      };

      if (editingDebt) {
        await debtAPI.updateDebt(editingDebt.id, data);
        message.success('Cập nhật công nợ thành công');
      } else {
        await debtAPI.createDebt(data);
        message.success('Thêm công nợ thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchDebts();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const handlePayDebt = (record) => {
    setPayingDebt(record);
    paymentForm.resetFields();
    setPaymentModalVisible(true);
  };

  const handlePaymentSubmit = async (values) => {
    try {
      await debtAPI.payDebt(payingDebt.id, values);
      message.success('Thu nợ thành công. Đã tự động tạo phiếu thu trong hệ thống.');
      setPaymentModalVisible(false);
      paymentForm.resetFields();
      fetchDebts();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thu nợ thất bại');
    }
  };

  const columns = [
    {
      title: 'Ngày nợ',
      dataIndex: 'debt_date',
      key: 'debt_date',
      render: (date) => <strong>{formatDate(date)}</strong>,
      width: 120,
    },
    {
      title: 'Người nợ',
      dataIndex: 'debtor_name',
      key: 'debtor_name',
      render: (name) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <strong style={{ color: '#ff4d4f', fontSize: 14 }}>
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
      title: 'Người tạo',
      dataIndex: 'created_by_user',
      key: 'created_by_user',
      render: (user) => user?.full_name || '-',
      width: 150,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handlePayDebt(record)}
          >
            Thu nợ
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa công nợ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span>Quản lý công nợ</span>
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm công nợ
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={debts}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 50,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} khoản nợ`,
        }}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <strong>Tổng công nợ</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                  {formatCurrency(totalDebt)}
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
        title={editingDebt ? 'Chỉnh sửa công nợ' : 'Thêm công nợ mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingDebt ? 'Cập nhật' : 'Thêm'}
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
            name="debt_date"
            label="Ngày nợ"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="debtor_name"
            label="Người nợ"
            rules={[{ required: true, message: 'Vui lòng chọn người nợ' }]}
          >
            <Select
              placeholder="Chọn người nợ"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((user) => ({
                value: user.full_name,
                label: `${user.full_name} (${user.username})`,
              }))}
            />
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

      <Modal
        title="Thu nợ"
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        onOk={() => paymentForm.submit()}
        okText="Thu nợ"
        cancelText="Hủy"
        width={500}
      >
        {payingDebt && (
          <div style={{ marginBottom: 20 }}>
            <p>
              <strong>Người nợ:</strong> {payingDebt.debtor_name}
            </p>
            <p>
              <strong>Số tiền:</strong>{' '}
              <span style={{ color: '#ff4d4f', fontSize: 16 }}>
                {formatCurrency(payingDebt.amount)}
              </span>
            </p>
          </div>
        )}
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handlePaymentSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="payment_method"
            label="Hình thức thu nợ"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức thu' }]}
          >
            <Select placeholder="Chọn hình thức thu nợ">
              <Select.Option value="cash">
                <Tag color="blue" icon={<WalletOutlined />}>
                  Tiền mặt
                </Tag>
              </Select.Option>
              <Select.Option value="bank">
                <Tag color="green" icon={<BankOutlined />}>
                  Chuyển khoản
                </Tag>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
