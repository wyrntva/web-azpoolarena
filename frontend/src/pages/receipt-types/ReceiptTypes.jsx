import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Popconfirm,
  message,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { receiptTypeAPI } from '../../api/receiptType.api';
import { formatDateTime } from '../../utils/formatters';

export default function ReceiptTypes() {
  const [receiptTypes, setReceiptTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchReceiptTypes();
  }, []);

  const fetchReceiptTypes = async () => {
    setLoading(true);
    try {
      const response = await receiptTypeAPI.getReceiptTypes({ active_only: false });
      setReceiptTypes(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách loại phiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingType(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active !== undefined ? record.is_active : true,
      is_inventory: record.is_inventory !== undefined ? record.is_inventory : false,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await receiptTypeAPI.deleteReceiptType(id);
      message.success('Xóa loại phiếu thành công');
      fetchReceiptTypes();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa loại phiếu thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingType) {
        await receiptTypeAPI.updateReceiptType(editingType.id, values);
        message.success('Cập nhật loại phiếu thành công');
      } else {
        await receiptTypeAPI.createReceiptType(values);
        message.success('Thêm loại phiếu thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchReceiptTypes();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên loại phiếu',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <TagsOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active) => (
        <Tag color={is_active ? 'success' : 'default'}>
          {is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDateTime(date),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa loại phiếu này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <TagsOutlined />
          <span>Quản lý loại phiếu thu/chi</span>
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm loại phiếu
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={receiptTypes}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} loại phiếu`,
        }}
      />

      <Modal
        title={editingType ? 'Chỉnh sửa loại phiếu' : 'Thêm loại phiếu mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingType ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{ is_active: true, is_inventory: false }}
        >
          <Form.Item
            name="name"
            label="Tên loại phiếu"
            rules={[
              { required: true, message: 'Vui lòng nhập tên loại phiếu' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
            ]}
          >
            <Input placeholder="Ví dụ: Tiền điện, Tiền nước, Doanh thu vé..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: false }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả chi tiết về loại phiếu này"
            />
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
    </Card>
  );
}
