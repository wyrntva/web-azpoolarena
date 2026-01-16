import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
} from 'antd';
import { message } from '../../utils/antdGlobal';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { unitAPI } from '../../api/unit.api';

export default function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await unitAPI.getUnits();
      setUnits(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách đơn vị');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUnit(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUnit(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await unitAPI.deleteUnit(id);
      message.success('Xóa đơn vị thành công');
      fetchUnits();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa đơn vị thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUnit) {
        await unitAPI.updateUnit(editingUnit.id, values);
        message.success('Cập nhật đơn vị thành công');
      } else {
        await unitAPI.createUnit(values);
        message.success('Thêm đơn vị thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchUnits();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên đơn vị',
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
            description="Bạn có chắc muốn xóa đơn vị này?"
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
      <Card
        title={
          <Space>
            <AppstoreOutlined />
            <span>Quản lý đơn vị</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm đơn vị
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={units}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} đơn vị`,
          }}
        />
      </Card>

      <Modal
        title={editingUnit ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingUnit ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Tên đơn vị"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đơn vị' },
              { max: 50, message: 'Tên đơn vị không quá 50 ký tự' },
            ]}
          >
            <Input placeholder="VD: Chai, Thùng, Kg, Lít..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Nhập mô tả (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
