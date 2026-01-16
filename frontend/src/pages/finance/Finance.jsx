import { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { receiptAPI } from '../../api/receipt.api';
import { receiptTypeAPI } from '../../api/receiptType.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PageHeader, StatCard, DataTable, FilterBar, ActionButtons } from '../../components/shared';
import { COLORS } from '../../constants/theme';

export default function Finance() {
  const [receipts, setReceipts] = useState([]);
  const [receiptTypes, setReceiptTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  useEffect(() => {
    fetchReceiptTypes();
    fetchReceipts();
  }, []);

  const fetchReceiptTypes = async () => {
    try {
      const response = await receiptTypeAPI.getReceiptTypes({ active_only: true });
      setReceiptTypes(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách loại phiếu');
    }
  };

  const fetchReceipts = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await receiptAPI.getReceipts(filterParams);
      setReceipts(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách phiếu thu/chi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingReceipt(null);
    form.resetFields();
    form.setFieldsValue({ receipt_date: dayjs() });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingReceipt(record);
    form.setFieldsValue({
      receipt_date: dayjs(record.receipt_date),
      amount: record.amount,
      receipt_type_id: record.receipt_type_id,
      is_income: record.is_income,
      payment_method: record.payment_method,
      note: record.note,
    });
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      await receiptAPI.deleteReceipt(record.id);
      message.success('Xóa phiếu thành công');
      fetchReceipts(filters);
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa phiếu thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        receipt_date: values.receipt_date.format('YYYY-MM-DD'),
      };

      if (editingReceipt) {
        await receiptAPI.updateReceipt(editingReceipt.id, data);
        message.success('Cập nhật phiếu thành công');
      } else {
        await receiptAPI.createReceipt(data);
        message.success('Thêm phiếu thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchReceipts(filters);
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const handleFilter = (values) => {
    const filterParams = {};
    if (values.start_date) {
      filterParams.start_date = values.start_date.format('YYYY-MM-DD');
    }
    if (values.end_date) {
      filterParams.end_date = values.end_date.format('YYYY-MM-DD');
    }
    if (values.receipt_type_id) {
      filterParams.receipt_type_id = values.receipt_type_id;
    }
    if (values.is_income !== undefined) {
      filterParams.is_income = values.is_income;
    }
    setFilters(filterParams);
    fetchReceipts(filterParams);
  };

  const handleResetFilter = () => {
    setFilters({});
    fetchReceipts();
  };

  const calculateTotals = () => {
    const income = receipts
      .filter((r) => r.is_income)
      .reduce((sum, r) => sum + r.amount, 0);
    const expense = receipts
      .filter((r) => !r.is_income)
      .reduce((sum, r) => sum + r.amount, 0);
    return { income, expense, net: income - expense };
  };

  const totals = calculateTotals();

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'receipt_date',
      key: 'receipt_date',
      render: (date) => formatDate(date),
      width: 120,
    },
    {
      title: 'Loại',
      dataIndex: 'is_income',
      key: 'is_income',
      render: (is_income) => (
        <Tag
          icon={is_income ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          color={is_income ? 'success' : 'error'}
        >
          {is_income ? 'Thu' : 'Chi'}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Loại phiếu',
      dataIndex: 'receipt_type_id',
      key: 'receipt_type_id',
      render: (typeId) => {
        const type = receiptTypes.find((t) => t.id === typeId);
        return type?.name || '-';
      },
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => (
        <Tag
          icon={method === 'cash' ? <WalletOutlined /> : <BankOutlined />}
          color={method === 'cash' ? 'blue' : 'green'}
        >
          {method === 'cash' ? 'Tiền mặt' : 'Tài khoản'}
        </Tag>
      ),
      width: 130,
    },
    {
      title: 'Người tạo',
      dataIndex: 'created_by_user',
      key: 'created_by_user',
      render: (user) => user?.full_name || '-',
      width: 150,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <strong style={{ color: record.is_income ? COLORS.success : COLORS.error }}>
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
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <ActionButtons
          record={record}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleteConfirmDescription="Bạn có chắc muốn xóa phiếu này?"
        />
      ),
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Quản lý phiếu thu/chi"
        subtitle="Theo dõi và quản lý các phiếu thu chi hàng ngày"
        icon={<DollarOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
            Thêm phiếu
          </Button>
        }
        breadcrumbs={[
          { title: 'Thu chi' },
          { title: 'Phiếu thu/chi' },
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Tổng thu"
            value={totals.income}
            icon={<ArrowUpOutlined />}
            color={COLORS.success}
            suffix="đ"
            formatter={(value) => formatCurrency(value).replace(' đ', '')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Tổng chi"
            value={totals.expense}
            icon={<ArrowDownOutlined />}
            color={COLORS.error}
            suffix="đ"
            formatter={(value) => formatCurrency(value).replace(' đ', '')}
          />
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <StatCard
            title="Chênh lệch"
            value={totals.net}
            icon={<DollarOutlined />}
            color={totals.net >= 0 ? COLORS.success : COLORS.error}
            suffix="đ"
            formatter={(value) => formatCurrency(value).replace(' đ', '')}
          />
        </Col>
      </Row>

      <FilterBar form={filterForm} onFinish={handleFilter} onReset={handleResetFilter}>
        <Form.Item name="start_date" label="Từ ngày">
          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="end_date" label="Đến ngày">
          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="receipt_type_id" label="Loại phiếu">
          <Select placeholder="Chọn loại" style={{ width: 200 }} allowClear>
            {receiptTypes.map((type) => (
              <Select.Option key={type.id} value={type.id}>
                {type.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="is_income" label="Loại">
          <Select placeholder="Chọn loại" style={{ width: 120 }} allowClear>
            <Select.Option value={true}>Thu</Select.Option>
            <Select.Option value={false}>Chi</Select.Option>
          </Select>
        </Form.Item>
      </FilterBar>

      <DataTable
        columns={columns}
        dataSource={receipts}
        loading={loading}
      />

      <Modal
        title={editingReceipt ? 'Chỉnh sửa phiếu' : 'Thêm phiếu mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingReceipt ? 'Cập nhật' : 'Thêm'}
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
            name="receipt_date"
            label="Ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="is_income"
            label="Loại phiếu"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select placeholder="Chọn loại">
              <Select.Option value={true}>
                <Tag color="success" icon={<ArrowUpOutlined />}>
                  Phiếu thu
                </Tag>
              </Select.Option>
              <Select.Option value={false}>
                <Tag color="error" icon={<ArrowDownOutlined />}>
                  Phiếu chi
                </Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="receipt_type_id"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục">
              {receiptTypes.map((type) => (
                <Select.Option key={type.id} value={type.id}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="payment_method"
            label="Phương thức thanh toán"
            rules={[{ required: true, message: 'Vui lòng chọn phương thức' }]}
          >
            <Select placeholder="Chọn phương thức thanh toán">
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
              { type: 'number', min: 0, message: 'Số tiền phải lớn hơn 0' },
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
    </div>
  );
}
