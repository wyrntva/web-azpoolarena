import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Tag,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { inventoryAPI } from '../../api/inventory.api';
import { unitAPI } from '../../api/unit.api';
import { receiptTypeAPI } from '../../api/receiptType.api';

export default function Inventory() {
  const [inventories, setInventories] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInventories();
    fetchUnits();
    fetchCategories();
  }, [statusFilter, searchText]);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (searchText) params.search = searchText;

      const response = await inventoryAPI.getInventories(params);
      setInventories(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách tồn kho');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await unitAPI.getUnits();
      setUnits(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách đơn vị');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await receiptTypeAPI.getReceiptTypes({ active_only: true });
      // Chỉ lấy các danh mục kho hàng (is_inventory = true)
      const inventoryCategories = response.data.filter(cat => cat.is_inventory === true);
      setCategories(inventoryCategories);
    } catch (error) {
      message.error('Không thể tải danh sách danh mục');
    }
  };

  const handleCreate = () => {
    setEditingInventory(null);
    form.resetFields();
    form.setFieldsValue({ quantity: 0, min_quantity: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingInventory(record);
    form.setFieldsValue({
      product_name: record.product_name,
      quantity: record.quantity,
      min_quantity: record.min_quantity,
      category_id: record.category_id,
      base_unit_id: record.base_unit_id,
      conversion_unit_id: record.conversion_unit_id,
      conversion_rate: record.conversion_rate,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await inventoryAPI.deleteInventory(id);
      message.success('Xóa sản phẩm thành công');
      fetchInventories();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa sản phẩm thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingInventory) {
        await inventoryAPI.updateInventory(editingInventory.id, values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await inventoryAPI.createInventory(values);
        message.success('Thêm sản phẩm thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchInventories();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const getStatusTag = (status, quantity, minQuantity) => {
    if (status === 'out_of_stock' || quantity <= 0) {
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Hết hàng
        </Tag>
      );
    } else if (status === 'low_stock' || quantity <= minQuantity) {
      return (
        <Tag icon={<WarningOutlined />} color="warning">
          Sắp hết
        </Tag>
      );
    } else {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Còn hàng
        </Tag>
      );
    }
  };

  const columns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text) => <strong>{text}</strong>,
      ellipsis: true,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category?.name || '-',
      align: 'center',
      width: 120,
    },
    {
      title: 'Số lượng tồn',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => (
        <span style={{
          color: quantity <= 0 ? '#ff4d4f' : quantity <= record.min_quantity ? '#faad14' : '#52c41a',
          fontWeight: 'bold',
          fontSize: 14
        }}>
          {quantity}
        </span>
      ),
      align: 'center',
      width: 120,
    },
    {
      title: 'Số lượng tối thiểu',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
      align: 'center',
      width: 150,
    },
    {
      title: 'Đơn vị cơ bản',
      dataIndex: 'base_unit',
      key: 'base_unit',
      render: (unit) => unit?.name || '-',
      align: 'center',
      width: 120,
    },
    {
      title: 'Đơn vị lớn',
      dataIndex: 'large_unit',
      key: 'large_unit',
      render: (unit, record) => {
        if (!unit) return '-';
        return `${record.conversion_rate} ${record.base_unit?.name} = 1 ${unit.name}`;
      },
      align: 'center',
      width: 180,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.quantity, record.min_quantity),
      width: 130,
      filters: [
        { text: 'Còn hàng', value: 'in_stock' },
        { text: 'Sắp hết', value: 'low_stock' },
        { text: 'Hết hàng', value: 'out_of_stock' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa sản phẩm này?"
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

  const statistics = {
    total: inventories.length,
    inStock: inventories.filter(i => i.status === 'in_stock').length,
    lowStock: inventories.filter(i => i.status === 'low_stock').length,
    outOfStock: inventories.filter(i => i.status === 'out_of_stock').length,
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Tổng sản phẩm</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.total}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Còn hàng</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{statistics.inStock}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Sắp hết</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{statistics.lowStock}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Hết hàng</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>{statistics.outOfStock}</div>
          </div>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>Danh sách tồn kho</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Select.Option value="in_stock">Còn hàng</Select.Option>
              <Select.Option value="low_stock">Sắp hết</Select.Option>
              <Select.Option value="out_of_stock">Hết hàng</Select.Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm sản phẩm
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={inventories}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 50,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
        />
      </Card>

      <Modal
        title={editingInventory ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingInventory ? 'Cập nhật' : 'Thêm'}
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
            name="product_name"
            label="Tên sản phẩm"
            rules={[
              { required: true, message: 'Vui lòng nhập tên sản phẩm' },
              { max: 200, message: 'Tên sản phẩm không quá 200 ký tự' },
            ]}
          >
            <Input placeholder="Nhập tên sản phẩm" />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="Danh mục"
            rules={[
              { required: true, message: 'Vui lòng chọn danh mục' },
            ]}
          >
            <Select placeholder="Chọn danh mục sản phẩm">
              {categories.map(category => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng tồn kho"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 0, message: 'Số lượng phải >= 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập số lượng"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="min_quantity"
            label="Số lượng tối thiểu"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng tối thiểu' },
              { type: 'number', min: 0, message: 'Số lượng phải >= 0' },
            ]}
            help="Hệ thống sẽ cảnh báo khi tồn kho xuống dưới mức này"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập số lượng tối thiểu"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="base_unit_id"
            label="Đơn vị cơ bản"
            rules={[
              { required: true, message: 'Vui lòng chọn đơn vị cơ bản' },
            ]}
          >
            <Select placeholder="Chọn đơn vị cơ bản (VD: Chai, Kg...)">
              {units.map(unit => (
                <Select.Option key={unit.id} value={unit.id}>
                  {unit.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="conversion_unit_id"
            label="Đơn vị lớn (không bắt buộc)"
          >
            <Select placeholder="Chọn đơn vị lớn (VD: Thùng, Tấn...)" allowClear>
              {units.map(unit => (
                <Select.Option key={unit.id} value={unit.id}>
                  {unit.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.conversion_unit_id !== currentValues.conversion_unit_id}>
            {({ getFieldValue }) => (
              <Form.Item
                name="conversion_rate"
                label="Tỷ lệ quy đổi"
                help="VD: Nhập 24 nếu 24 chai = 1 thùng"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập tỷ lệ quy đổi"
                  min={1}
                  disabled={!getFieldValue('conversion_unit_id')}
                />
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
