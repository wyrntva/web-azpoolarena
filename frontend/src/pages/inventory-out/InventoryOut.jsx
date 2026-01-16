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
  message,
  Select,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ExportOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { inventoryAPI } from '../../api/inventory.api';
import dayjs from 'dayjs';

export default function InventoryOut() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    try {
      const response = await inventoryAPI.getInventories();
      setInventories(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      export_date: dayjs(),
      items: [{ product_id: null, unit_type: 'base', quantity: 0 }],
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      // Tính toán số lượng thực tế dựa trên đơn vị
      const processedItems = values.items.map(item => {
        const product = inventories.find(p => p.id === item.product_id);
        let actualQuantity = item.quantity;

        // Nếu chọn đơn vị lớn, nhân với tỷ lệ quy đổi
        if (item.unit_type === 'large' && product?.conversion_rate) {
          actualQuantity = item.quantity * product.conversion_rate;
        }

        return {
          product_id: item.product_id,
          quantity: actualQuantity,
          unit_type: item.unit_type,
          input_quantity: item.quantity,
        };
      });

      const payload = {
        export_date: values.export_date.format('YYYY-MM-DD'),
        note: values.note,
        items: processedItems,
      };

      await inventoryAPI.createInventoryOut(payload);
      message.success('Xuất kho thành công');
      setModalVisible(false);
      form.resetFields();
      fetchInventories();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xuất kho thất bại');
    }
  };

  const getUnitDisplay = (productId, unitType) => {
    const product = inventories.find(p => p.id === productId);
    if (!product) return '';

    if (unitType === 'large' && product.large_unit) {
      return `${product.large_unit.name} (${product.conversion_rate} ${product.base_unit?.name})`;
    }
    return product.base_unit?.name || '';
  };

  const columns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      render: (qty, record) => (
        <span style={{
          color: qty <= 0 ? '#ff4d4f' : qty <= record.min_quantity ? '#faad14' : '#52c41a',
          fontWeight: 'bold',
        }}>
          {qty} {record.base_unit?.name || ''}
        </span>
      ),
    },
    {
      title: 'Đơn vị cơ bản',
      dataIndex: 'base_unit',
      key: 'base_unit',
      align: 'center',
      render: (unit) => unit?.name || '-',
    },
    {
      title: 'Đơn vị lớn',
      dataIndex: 'large_unit',
      key: 'large_unit',
      align: 'center',
      render: (unit, record) => {
        if (!unit) return '-';
        return `1 ${unit.name} = ${record.conversion_rate} ${record.base_unit?.name}`;
      },
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <ExportOutlined />
            <span>Xuất kho</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo phiếu xuất
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={inventories}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
        />
      </Card>

      <Modal
        title="Tạo phiếu xuất kho"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Xuất kho"
        cancelText="Hủy"
        width={800}
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
                name="export_date"
                label="Ngày xuất"
                rules={[{ required: true, message: 'Vui lòng chọn ngày xuất' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú (không bắt buộc)" />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 8 }}>
                  <strong>Danh sách sản phẩm xuất:</strong>
                </div>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={`Sản phẩm ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="link"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          Xóa
                        </Button>
                      ) : null
                    }
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'product_id']}
                          label="Sản phẩm"
                          rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                        >
                          <Select
                            placeholder="Chọn sản phẩm"
                            showSearch
                            optionFilterProp="children"
                          >
                            {inventories.map(item => (
                              <Select.Option key={item.id} value={item.id}>
                                {item.product_name} (Tồn: {item.quantity})
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => {
                          const prevProductId = prevValues?.items?.[field.name]?.product_id;
                          const currProductId = currentValues?.items?.[field.name]?.product_id;
                          return prevProductId !== currProductId;
                        }}>
                          {() => {
                            const productId = form.getFieldValue(['items', field.name, 'product_id']);
                            const product = inventories.find(p => p.id === productId);

                            return (
                              <Form.Item
                                {...field}
                                name={[field.name, 'unit_type']}
                                label="Đơn vị"
                                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
                              >
                                <Select placeholder="Chọn đơn vị">
                                  <Select.Option value="base">
                                    {product?.base_unit?.name || 'Đơn vị cơ bản'}
                                  </Select.Option>
                                  {product?.large_unit && (
                                    <Select.Option value="large">
                                      {product.large_unit.name} ({product.conversion_rate} {product.base_unit?.name})
                                    </Select.Option>
                                  )}
                                </Select>
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="Số lượng"
                          rules={[
                            { required: true, message: 'Vui lòng nhập số lượng' },
                            { type: 'number', min: 1, message: 'Số lượng phải > 0' },
                          ]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Nhập số lượng"
                            min={1}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <div style={{ paddingTop: 30 }}>
                          {(() => {
                            const productId = form.getFieldValue(['items', field.name, 'product_id']);
                            const unitType = form.getFieldValue(['items', field.name, 'unit_type']);
                            const quantity = form.getFieldValue(['items', field.name, 'quantity']);
                            const product = inventories.find(p => p.id === productId);

                            if (!product || !quantity) return '';

                            if (unitType === 'large' && product.conversion_rate) {
                              const actualQty = quantity * product.conversion_rate;
                              const remaining = product.quantity - actualQty;
                              const color = remaining < 0 ? '#ff4d4f' : '#1890ff';
                              return (
                                <span style={{ color }}>
                                  = {actualQty} {product.base_unit?.name} (Còn: {remaining})
                                </span>
                              );
                            } else {
                              const remaining = product.quantity - quantity;
                              const color = remaining < 0 ? '#ff4d4f' : '#1890ff';
                              return (
                                <span style={{ color }}>
                                  Còn: {remaining} {product.base_unit?.name}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ product_id: null, unit_type: 'base', quantity: 0 })}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm sản phẩm
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
