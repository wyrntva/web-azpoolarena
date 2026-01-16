import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  Switch,
  Tag,
} from 'antd';
import { message } from '../../../utils/antdGlobal';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { receiptTypeAPI } from '../../../api/receiptType.api';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await receiptTypeAPI.getReceiptTypes({ active_only: false });
      // Chỉ lấy các danh mục có is_inventory = true
      const inventoryCategories = response.data.filter(cat => cat.is_inventory === true);
      setCategories(inventoryCategories);
    } catch (error) {
      message.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, is_inventory: true });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active !== undefined ? record.is_active : true,
      is_inventory: record.is_inventory !== undefined ? record.is_inventory : true,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await receiptTypeAPI.deleteReceiptType(id);
      message.success('Xóa danh mục thành công');
      fetchCategories();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa danh mục thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await receiptTypeAPI.updateReceiptType(editingCategory.id, values);
        message.success('Cập nhật danh mục thành công');
      } else {
        await receiptTypeAPI.createReceiptType(values);
        message.success('Thêm danh mục thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      align: 'center',
      render: (is_active) => (
        <Tag color={is_active ? 'success' : 'default'}>
          {is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      ),
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
            description="Bạn có chắc muốn xóa danh mục này?"
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm danh mục
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} danh mục`,
        }}
      />

      <Modal
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingCategory ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{ is_active: true, is_inventory: true }}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              { required: true, message: 'Vui lòng nhập tên danh mục' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
            ]}
          >
            <Input placeholder="VD: Thuốc lá, Bim bim, Nước đóng chai..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Nhập mô tả (không bắt buộc)" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Vô hiệu hóa"
            />
          </Form.Item>

          <Form.Item
            name="is_inventory"
            label="Kho hàng"
            valuePropName="checked"
            tooltip="Đánh dấu để danh mục này hiển thị trong phần quản lý kho hàng"
          >
            <Switch
              checkedChildren="Có"
              unCheckedChildren="Không"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
