import { useState, useEffect } from "react";
import {
  Card,
  Form,
  InputNumber,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Spin,
  Row,
  Col,
  Alert,
  Descriptions,
  Switch,
  Input,
  Checkbox
} from "antd";
import {
  SaveOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import { attendanceSettingsAPI } from "../../api/attendance.api";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AttendanceSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const response = await attendanceSettingsAPI.get();
      setSettings(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      message.error("Không thể tải thiết lập chấm công");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Validate penalty tiers
      const tiers = values.penalty_tiers || [];
      if (tiers.length === 0) {
        message.error("Phải có ít nhất 1 mức phạt");
        return;
      }

      // Check sorting
      for (let i = 0; i < tiers.length - 1; i++) {
        const current = tiers[i];
        const next = tiers[i + 1];

        if (current.max_minutes === null || current.max_minutes === undefined) {
          message.error(`Mức ${i + 1} phải có số phút tối đa (trừ mức cuối cùng)`);
          return;
        }

        if (next.max_minutes !== null && next.max_minutes !== undefined) {
          if (current.max_minutes >= next.max_minutes) {
            message.error(`Mức ${i + 2} phải lớn hơn mức ${i + 1}`);
            return;
          }
        }
      }

      const response = await attendanceSettingsAPI.update(values);
      setSettings(response.data);
      message.success("Cập nhật thiết lập chấm công thành công!");
    } catch (error) {
      console.error("Error updating settings:", error);
      message.error(
        error.response?.data?.detail || "Không thể cập nhật thiết lập chấm công"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "0 đ";
    return `${value.toLocaleString("vi-VN")} đ`;
  };

  if (fetching) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>Thiết lập chấm công</span>
          </Space>
        }
        extra={
          <Text type="secondary">
            Cấu hình quy tắc chấm công và mức phạt cho toàn hệ thống
          </Text>
        }
      >
        <Alert
          message="Lưu ý"
          description="Các thiết lập này sẽ áp dụng cho tất cả nhân viên trong hệ thống. Mức phạt sẽ được tính tự động dựa trên số phút đi muộn hoặc về sớm."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={settings}
        >
          {/* Late Arrival Settings */}
          <Divider orientation="left">
            <Space>
              <ClockCircleOutlined />
              <Text strong>Cài đặt đi muộn</Text>
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Số phút được phép đi muộn"
                name="allowed_late_minutes"
                rules={[{ required: true, message: "Vui lòng nhập số phút!" }]}
                tooltip="Nhân viên đi muộn trong khoảng thời gian này sẽ không bị phạt"
              >
                <InputNumber
                  min={0}
                  max={120}
                  style={{ width: "100%" }}
                  addonAfter="phút"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Penalty Tiers */}
          <Divider orientation="left">
            <Space>
              <DollarOutlined />
              <Text strong>Mức phạt theo độ muộn</Text>
            </Space>
          </Divider>

          <Alert
            message="Cách cấu hình mức phạt"
            description={
              <div>
                <p>Bạn có thể thêm hoặc xóa các mức phạt tùy ý. Mỗi mức phạt gồm:</p>
                <ul>
                  <li><strong>Số phút muộn tối đa:</strong> Giới hạn trên của mức này (VD: 30 phút)</li>
                  <li><strong>Tiền phạt:</strong> Số tiền phạt cho mức này (VD: 50,000 đ)</li>
                  <li><strong>Không giới hạn:</strong> Tích vào mức cuối cùng để áp dụng cho mọi trường hợp muộn quá mức</li>
                </ul>
                <p><strong>Ví dụ:</strong></p>
                <ul>
                  <li>Mức 1: ≤ 15 phút → Phạt 0 đ</li>
                  <li>Mức 2: {'>'} 15 phút và ≤ 30 phút → Phạt 50,000 đ</li>
                  <li>Mức 3: {'>'} 30 phút (không giới hạn) → Phạt 100,000 đ</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.List name="penalty_tiers" initialValue={settings?.penalty_tiers || []}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 16, background: "#fafafa" }}
                    title={`Mức ${index + 1}`}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                          size="small"
                        >
                          Xóa
                        </Button>
                      )
                    }
                  >
                    <Row gutter={16} align="middle">
                      <Col xs={24} sm={10}>
                        <Form.Item
                          {...field}
                          label="Số phút muộn tối đa"
                          name={[field.name, "max_minutes"]}
                          rules={[
                            {
                              validator: (_, value) => {
                                // Allow null for last tier
                                if (index === fields.length - 1 && value === null) {
                                  return Promise.resolve();
                                }
                                if (value === null || value === undefined) {
                                  return Promise.reject("Vui lòng nhập số phút hoặc tích 'Không giới hạn'");
                                }
                                if (value < 0) {
                                  return Promise.reject("Số phút phải >= 0");
                                }
                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            addonAfter="phút"
                            placeholder={index === fields.length - 1 ? "Để trống nếu không giới hạn" : "VD: 30"}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={10}>
                        <Form.Item
                          {...field}
                          label="Tiền phạt"
                          name={[field.name, "penalty_amount"]}
                          rules={[
                            { required: true, message: "Vui lòng nhập tiền phạt!" },
                            {
                              validator: (_, value) => {
                                if (value < 0) {
                                  return Promise.reject("Tiền phạt phải >= 0");
                                }
                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                            addonAfter="đ"
                            placeholder="VD: 50000"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={4}>
                        {index === fields.length - 1 && (
                          <Form.Item
                            {...field}
                            label="Không giới hạn"
                            valuePropName="checked"
                          >
                            <Checkbox
                              checked={form.getFieldValue(['penalty_tiers', field.name, 'max_minutes']) === null}
                              onChange={(e) => {
                                const newValue = e.target.checked ? null : 0;
                                form.setFieldValue(['penalty_tiers', field.name, 'max_minutes'], newValue);
                              }}
                            >
                              Tích nếu mức cuối
                            </Checkbox>
                          </Form.Item>
                        )}
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ max_minutes: 60, penalty_amount: 100000 })}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Thêm mức phạt
                </Button>
              </>
            )}
          </Form.List>

          {/* Early Checkout Settings */}
          <Divider orientation="left">
            <Space>
              <ClockCircleOutlined />
              <Text strong>Cài đặt về sớm</Text>
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Được về sớm"
                name="early_checkout_grace_minutes"
                rules={[{ required: true }]}
                tooltip="Nhân viên được phép về sớm trong khoảng thời gian này"
              >
                <InputNumber
                  min={0}
                  max={120}
                  style={{ width: "100%" }}
                  addonAfter="phút"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Tiền phạt về sớm"
                name="early_checkout_penalty"
                rules={[{ required: true }]}
                tooltip="Số tiền phạt khi về sớm vượt quá thời gian cho phép"
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Absent Penalty Settings */}
          <Divider orientation="left">
            <Space>
              <DollarOutlined />
              <Text strong>Cài đặt vắng mặt</Text>
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Tiền phạt vắng mặt"
                name="absent_penalty"
                rules={[{ required: true }]}
                tooltip="Số tiền phạt khi nhân viên có lịch làm việc nhưng không chấm công"
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="đ"
                  placeholder="VD: 100000"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Other Settings */}
          <Divider orientation="left">
            <Space>
              <SettingOutlined />
              <Text strong>Cài đặt khác</Text>
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tự động đánh vắng"
                name="auto_absent_enabled"
                valuePropName="checked"
                tooltip="Tự động đánh vắng nếu nhân viên không check-in"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Ghi chú"
                name="notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Ghi chú về thiết lập chấm công..."
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Submit Button */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                Lưu thiết lập
              </Button>
              <Button onClick={() => form.resetFields()} size="large">
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Current Settings Summary */}
        {settings && (
          <>
            <Divider />
            <Title level={5}>Tóm tắt thiết lập hiện tại</Title>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Được phép đi muộn">
                {settings.allowed_late_minutes} phút
              </Descriptions.Item>
              <Descriptions.Item label="Số mức phạt">
                {settings.penalty_tiers?.length || 0} mức
              </Descriptions.Item>
              <Descriptions.Item label="Được về sớm">
                {settings.early_checkout_grace_minutes} phút
              </Descriptions.Item>

              {settings.penalty_tiers?.map((tier, index) => (
                <Descriptions.Item
                  key={index}
                  label={`Phạt mức ${index + 1} ${tier.max_minutes !== null ? `(≤${tier.max_minutes}p)` : '(>mức trước)'}`}
                >
                  {formatCurrency(tier.penalty_amount)}
                </Descriptions.Item>
              ))}

              <Descriptions.Item label="Phạt về sớm">
                {formatCurrency(settings.early_checkout_penalty)}
              </Descriptions.Item>
              <Descriptions.Item label="Phạt vắng mặt">
                {formatCurrency(settings.absent_penalty)}
              </Descriptions.Item>
              <Descriptions.Item label="Tự động vắng">
                {settings.auto_absent_enabled ? "Bật" : "Tắt"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    </div>
  );
}
