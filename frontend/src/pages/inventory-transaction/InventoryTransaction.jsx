import { useState, useEffect } from 'react';
import {
  Tabs,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  MinusCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { inventoryAPI } from '../../api/inventory.api';
import dayjs from 'dayjs';
import { PageHeader, DataTable } from '../../components/shared';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function InventoryTransaction() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('in'); // 'in' or 'out'
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getInventories();
      setInventories(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (type) => {
    setTransactionType(type);
    form.resetFields();
    form.setFieldsValue({
      [type === 'in' ? 'import_date' : 'export_date']: dayjs(),
      items: [{ product_id: null, unit_type: 'base', quantity: 0, price: null, payment_method: null }],
    });
    setModalVisible(true);
  };

  const handleSubmitIn = async (values) => {
    try {
      const processedItems = values.items.map(item => ({
        inventory_id: item.product_id,
        quantity: item.quantity,
        unit_type: item.unit_type,
        price: item.price || null,
        payment_method: item.payment_method || null,
      }));

      const payload = {
        import_date: values.import_date.format('YYYY-MM-DD'),
        note: values.note,
        items: processedItems,
      };

      await inventoryAPI.createInventoryIn(payload);
      message.success('Nhập kho thành công');
      setModalVisible(false);
      form.resetFields();
      fetchInventories();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Nhập kho thất bại');
    }
  };

  const handleSubmitOut = async (values) => {
    try {
      const processedItems = values.items.map(item => {
        const product = inventories.find(p => p.id === item.product_id);
        let actualQuantity = item.quantity;

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

  const handleSubmit = (values) => {
    if (transactionType === 'in') {
      handleSubmitIn(values);
    } else {
      handleSubmitOut(values);
    }
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
        <Tag
          color={qty <= 0 ? 'error' : qty <= record.min_quantity ? 'warning' : 'success'}
          style={{ fontWeight: 600 }}
        >
          {qty} {record.base_unit?.name || ''}
        </Tag>
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

  const tabItems = [
    {
      key: 'in',
      label: (
        <span>
          <ImportOutlined /> Nhập kho
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: SPACING.md, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreate('in')}
              size="large"
            >
              Tạo phiếu nhập
            </Button>
          </div>
          <DataTable
            columns={columns}
            dataSource={inventories}
            loading={loading}
          />
        </div>
      ),
    },
    {
      key: 'out',
      label: (
        <span>
          <ExportOutlined /> Xuất kho
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: SPACING.md, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreate('out')}
              size="large"
              danger
            >
              Tạo phiếu xuất
            </Button>
          </div>
          <DataTable
            columns={columns}
            dataSource={inventories}
            loading={loading}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Xuất nhập kho"
        subtitle="Quản lý phiếu nhập và xuất kho hàng"
        icon={<SwapOutlined />}
        breadcrumbs={[
          { title: 'Kho hàng' },
          { title: 'Xuất nhập kho' },
        ]}
      />

      <Card
        style={{
          borderRadius: BORDER_RADIUS.lg,
          border: 'none',
        }}
      >
        <Tabs
          items={tabItems}
          size="large"
          defaultActiveKey="in"
        />
      </Card>

      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            {transactionType === 'in' ? (
              <>
                <ImportOutlined style={{ color: COLORS.success, marginRight: 8 }} />
                Tạo phiếu nhập kho
              </>
            ) : (
              <>
                <ExportOutlined style={{ color: COLORS.error, marginRight: 8 }} />
                Tạo phiếu xuất kho
              </>
            )}
          </span>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={transactionType === 'in' ? 'Nhập kho' : 'Xuất kho'}
        cancelText="Hủy"
        width={900}
        okButtonProps={{
          danger: transactionType === 'out',
        }}
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
                name={transactionType === 'in' ? 'import_date' : 'export_date'}
                label={transactionType === 'in' ? 'Ngày nhập' : 'Ngày xuất'}
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
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

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
                  Danh sách sản phẩm {transactionType === 'in' ? 'nhập' : 'xuất'}:
                </div>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{
                      marginBottom: 16,
                      backgroundColor: COLORS.bgLayout,
                      borderRadius: BORDER_RADIUS.md,
                    }}
                    title={
                      <span style={{ fontSize: 14 }}>
                        Sản phẩm {index + 1}
                      </span>
                    }
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
                      <Col span={transactionType === 'in' ? 12 : 24}>
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
                                {item.product_name}
                                {transactionType === 'out' && ` (Tồn: ${item.quantity})`}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      {transactionType === 'in' && (
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'payment_method']}
                            label="Hình thức thanh toán"
                            rules={[{ required: true, message: 'Chọn hình thức' }]}
                          >
                            <Select placeholder="Chọn hình thức thanh toán">
                              <Select.Option value="cash">
                                <Tag color="blue">Tiền mặt</Tag>
                              </Select.Option>
                              <Select.Option value="bank">
                                <Tag color="green">Chuyển khoản</Tag>
                              </Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      )}
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="Số lượng"
                          rules={[
                            { required: true, message: 'Nhập số lượng' },
                            { type: 'number', min: 1, message: 'Số lượng > 0' },
                          ]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Nhập số lượng"
                            min={1}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item noStyle shouldUpdate>
                          {() => {
                            const productId = form.getFieldValue(['items', field.name, 'product_id']);
                            const product = inventories.find(p => p.id === productId);

                            return (
                              <Form.Item
                                {...field}
                                name={[field.name, 'unit_type']}
                                label="Đơn vị"
                                rules={[{ required: true, message: 'Chọn đơn vị' }]}
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
                      {transactionType === 'in' && (
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'price']}
                            label="Giá tiền"
                            rules={[
                              { required: true, message: 'Nhập giá tiền' },
                              { type: 'number', min: 0, message: 'Giá >= 0' },
                            ]}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              placeholder="Nhập giá"
                              min={0}
                              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={value => value.replace(/\$\s?|(,*)/g, '')}
                              suffix="đ"
                            />
                          </Form.Item>
                        </Col>
                      )}
                      {transactionType === 'out' && (
                        <Col span={8}>
                          <Form.Item noStyle shouldUpdate>
                            {() => {
                              const productId = form.getFieldValue(['items', field.name, 'product_id']);
                              const unitType = form.getFieldValue(['items', field.name, 'unit_type']);
                              const quantity = form.getFieldValue(['items', field.name, 'quantity']);
                              const product = inventories.find(p => p.id === productId);

                              if (!product || !quantity) {
                                return (
                                  <div style={{ paddingTop: 30, color: COLORS.textSecondary }}>
                                    -
                                  </div>
                                );
                              }

                              let actualQty = quantity;
                              if (unitType === 'large' && product.conversion_rate) {
                                actualQty = quantity * product.conversion_rate;
                              }

                              const remaining = product.quantity - actualQty;
                              const color = remaining < 0 ? COLORS.error : COLORS.success;

                              return (
                                <div style={{ paddingTop: 30 }}>
                                  <span style={{ color, fontWeight: 600 }}>
                                    Còn lại: {remaining} {product.base_unit?.name}
                                  </span>
                                </div>
                              );
                            }}
                          </Form.Item>
                        </Col>
                      )}
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({
                    product_id: null,
                    unit_type: 'base',
                    quantity: 0,
                    ...(transactionType === 'in' ? { price: null, payment_method: null } : {})
                  })}
                  block
                  icon={<PlusOutlined />}
                  style={{ height: 48 }}
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
