import { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  DatePicker,
  Row,
  Col,
  Tag,
  Table,
  Space,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { inventoryAPI } from '../../api/inventory.api';
import dayjs from 'dayjs';
import { PageHeader, DataTable, ActionButtons } from '../../components/shared';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function InventoryCheck() {
  const [inventories, setInventories] = useState([]);
  const [checkReports, setCheckReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInventories();
    fetchCheckReports();
  }, []);

  const fetchInventories = async () => {
    try {
      const response = await inventoryAPI.getInventories();
      setInventories(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
    }
  };

  const fetchCheckReports = async () => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getInventoryChecks();
      setCheckReports(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách phiếu kiểm kê');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    const initialItems = inventories.map(item => ({
      product_id: item.id,
      product_name: item.product_name,
      system_quantity: item.quantity,
      actual_quantity: item.quantity,
      unit: item.base_unit?.name || '',
    }));

    form.setFieldsValue({
      check_date: dayjs(),
      items: initialItems,
    });
    setModalVisible(true);
  };

  const handleView = (record) => {
    setViewingReport(record);
    setViewModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      await inventoryAPI.deleteInventoryCheck(record.id);
      message.success('Xóa phiếu kiểm kê thành công');
      fetchCheckReports();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa phiếu kiểm kê thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const processedItems = values.items.map(item => ({
        inventory_id: item.product_id,
        system_quantity: item.system_quantity,
        actual_quantity: item.actual_quantity,
        difference: item.actual_quantity - item.system_quantity,
      }));

      const payload = {
        check_date: values.check_date.format('YYYY-MM-DD'),
        note: values.note,
        items: processedItems,
      };

      await inventoryAPI.createInventoryCheck(payload);
      message.success('Tạo phiếu kiểm kê thành công');
      setModalVisible(false);
      form.resetFields();
      fetchCheckReports();
      fetchInventories();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Tạo phiếu kiểm kê thất bại');
    }
  };

  const reportColumns = [
    {
      title: 'Ngày kiểm kê',
      dataIndex: 'check_date',
      key: 'check_date',
      render: (date) => formatDate(date),
      width: 120,
    },
    {
      title: 'Người tạo',
      dataIndex: 'created_by_user',
      key: 'created_by_user',
      render: (user) => user?.full_name || '-',
    },
    {
      title: 'Số mặt hàng',
      dataIndex: 'items',
      key: 'items_count',
      align: 'center',
      render: (items) => items?.length || 0,
    },
    {
      title: 'Tổng chênh lệch',
      dataIndex: 'items',
      key: 'total_difference',
      align: 'right',
      render: (items) => {
        if (!items || items.length === 0) return '-';
        const totalDiff = items.reduce((sum, item) => sum + (item.difference || 0), 0);
        return (
          <strong style={{ color: totalDiff === 0 ? COLORS.success : totalDiff > 0 ? COLORS.info : COLORS.error }}>
            {totalDiff > 0 ? '+' : ''}{totalDiff}
          </strong>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'items',
      key: 'status',
      align: 'center',
      render: (items) => {
        if (!items || items.length === 0) return '-';
        const hasDifference = items.some(item => item.difference !== 0);
        return hasDifference ? (
          <Tag icon={<CloseCircleOutlined />} color="warning">
            Có chênh lệch
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Khớp
          </Tag>
        );
      },
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
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Xem
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa phiếu kiểm kê này?"
            onConfirm={() => handleDelete(record)}
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
    <div className="fade-in">
      <PageHeader
        title="Kiểm kê kho"
        subtitle="Tạo phiếu kiểm kê và so sánh tồn kho thực tế với hệ thống"
        icon={<FileTextOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
            Tạo phiếu kiểm kê
          </Button>
        }
        breadcrumbs={[
          { title: 'Kho hàng' },
          { title: 'Kiểm kê kho' },
        ]}
      />

      <DataTable
        title="Danh sách phiếu kiểm kê"
        columns={reportColumns}
        dataSource={checkReports}
        loading={loading}
      />

      {/* Modal tạo phiếu kiểm kê */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            <FileTextOutlined style={{ color: COLORS.primary, marginRight: 8 }} />
            Tạo phiếu kiểm kê
          </span>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Tạo phiếu"
        cancelText="Hủy"
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="check_date"
                label="Ngày kiểm kê"
                rules={[{ required: true, message: 'Vui lòng chọn ngày kiểm kê' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="note" label="Ghi chú">
                <Input placeholder="Nhập ghi chú (không bắt buộc)" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
            Danh sách sản phẩm kiểm kê:
          </div>

          <Form.Item shouldUpdate style={{ marginBottom: 0 }}>
            {() => {
              const items = form.getFieldValue('items') || [];

              const checkColumns = [
                {
                  title: 'Sản phẩm',
                  dataIndex: 'product_name',
                  key: 'product_name',
                  render: (text) => <strong>{text}</strong>,
                  width: '25%',
                },
                {
                  title: 'Đơn vị',
                  dataIndex: 'unit',
                  key: 'unit',
                  align: 'center',
                  width: '10%',
                },
                {
                  title: 'SL hệ thống',
                  dataIndex: 'system_quantity',
                  key: 'system_quantity',
                  align: 'center',
                  width: '15%',
                  render: (qty) => (
                    <Tag color="blue" style={{ fontWeight: 600 }}>
                      {qty}
                    </Tag>
                  ),
                },
                {
                  title: 'SL thực tế',
                  dataIndex: 'actual_quantity',
                  key: 'actual_quantity',
                  width: '20%',
                  render: (_, record, index) => (
                    <Form.Item
                      name={['items', index, 'actual_quantity']}
                      style={{ marginBottom: 0 }}
                      rules={[
                        { required: true, message: 'Nhập SL' },
                        { type: 'number', min: 0, message: 'SL >= 0' },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="Nhập SL thực tế"
                      />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Chênh lệch',
                  key: 'difference',
                  align: 'center',
                  width: '15%',
                  render: (_, record, index) => {
                    const actualQty = form.getFieldValue(['items', index, 'actual_quantity']);
                    const systemQty = record.system_quantity;
                    const diff = (actualQty || 0) - systemQty;

                    return (
                      <Tag
                        color={diff === 0 ? 'success' : diff > 0 ? 'processing' : 'error'}
                        style={{ fontWeight: 600, fontSize: 13 }}
                      >
                        {diff > 0 ? '+' : ''}{diff}
                      </Tag>
                    );
                  },
                },
              ];

              return (
                <div
                  style={{
                    maxHeight: 400,
                    overflow: 'auto',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: BORDER_RADIUS.md,
                  }}
                >
                  <Table
                    columns={checkColumns}
                    dataSource={items}
                    rowKey="product_id"
                    pagination={false}
                    size="small"
                  />
                </div>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xem chi tiết phiếu kiểm kê */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            <EyeOutlined style={{ color: COLORS.info, marginRight: 8 }} />
            Chi tiết phiếu kiểm kê
          </span>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setViewingReport(null);
        }}
        footer={
          <Button type="primary" onClick={() => setViewModalVisible(false)}>
            Đóng
          </Button>
        }
        width={900}
      >
        {viewingReport && (
          <div>
            <Row gutter={16} style={{ marginBottom: SPACING.lg }}>
              <Col span={8}>
                <div style={{ marginBottom: 4, color: COLORS.textSecondary }}>Ngày kiểm kê:</div>
                <strong>{formatDate(viewingReport.check_date)}</strong>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4, color: COLORS.textSecondary }}>Người tạo:</div>
                <strong>{viewingReport.created_by_user?.full_name || '-'}</strong>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4, color: COLORS.textSecondary }}>Ghi chú:</div>
                <strong>{viewingReport.note || '-'}</strong>
              </Col>
            </Row>

            <Table
              columns={[
                {
                  title: 'Sản phẩm',
                  dataIndex: 'product_name',
                  key: 'product_name',
                  render: (text, record) => (
                    <strong>
                      {inventories.find(i => i.id === record.inventory_id)?.product_name || text}
                    </strong>
                  ),
                },
                {
                  title: 'SL hệ thống',
                  dataIndex: 'system_quantity',
                  key: 'system_quantity',
                  align: 'center',
                  render: (qty) => (
                    <Tag color="blue" style={{ fontWeight: 600 }}>
                      {qty}
                    </Tag>
                  ),
                },
                {
                  title: 'SL thực tế',
                  dataIndex: 'actual_quantity',
                  key: 'actual_quantity',
                  align: 'center',
                  render: (qty) => (
                    <Tag color="green" style={{ fontWeight: 600 }}>
                      {qty}
                    </Tag>
                  ),
                },
                {
                  title: 'Chênh lệch',
                  dataIndex: 'difference',
                  key: 'difference',
                  align: 'center',
                  render: (diff) => (
                    <Tag
                      color={diff === 0 ? 'success' : diff > 0 ? 'processing' : 'error'}
                      style={{ fontWeight: 600, fontSize: 14 }}
                    >
                      {diff > 0 ? '+' : ''}{diff}
                    </Tag>
                  ),
                },
              ]}
              dataSource={viewingReport.items || []}
              rowKey={(record, index) => index}
              pagination={false}
              size="small"
              summary={(pageData) => {
                const totalDiff = pageData.reduce((sum, item) => sum + (item.difference || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ backgroundColor: COLORS.bgLayout }}>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong>Tổng chênh lệch:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="center">
                        <Tag
                          color={totalDiff === 0 ? 'success' : totalDiff > 0 ? 'processing' : 'error'}
                          style={{ fontWeight: 700, fontSize: 15 }}
                        >
                          {totalDiff > 0 ? '+' : ''}{totalDiff}
                        </Tag>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
