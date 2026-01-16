import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { userAPI } from "../../../api/user.api";
import { payrollAPI } from "../../../api/payroll.api";
import { attendanceSettingsAPI } from "../../../api/attendance.api";
import { useAuth } from "../../../auth/AuthContext";
import { isAdmin, ROLES } from "../../../auth/roles";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function Penalty() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [autoGenModalVisible, setAutoGenModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [autoGenForm] = Form.useForm();

  const isUserAdmin = isAdmin(user);

  useEffect(() => {
    fetchEmployees();
    fetchSettings();
    fetchPenalties();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await attendanceSettingsAPI.get();
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Set default values if settings cannot be fetched
      setSettings({
        absent_penalty: 100000,
        early_checkout_penalty: 50000,
        penalty_tiers: []
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await userAPI.getAll();
      const staffUsers = (response.data || [])
        .filter((u) => Number(u.role_id) !== 4 && u.is_active === true);
      setEmployees(staffUsers);
    } catch (error) {
      message.error("Không thể tải danh sách nhân viên");
    }
  };

  const fetchPenalties = async () => {
    setLoading(true);
    try {
      const response = await payrollAPI.getPenalties();
      const penaltiesData = response.data || [];

      const mappedPenalties = penaltiesData.map(penalty => ({
        id: penalty.id,
        employee_id: penalty.user_id,
        employee_name: penalty.employee_name,
        amount: penalty.amount,
        date: penalty.date,
        notes: penalty.notes,
        created_by: penalty.created_by_name,
        created_at: penalty.created_at,
      }));

      setPenalties(mappedPenalties);
    } catch (error) {
      message.error("Không thể tải danh sách phiếu phạt");
      console.error("Error fetching penalties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      employee_id: record.employee_id,
      date: dayjs(record.date),
      amount: record.amount,
      notes: record.notes,
    });
    setModalVisible(true);
  };

  const handleView = (record) => {
    setViewingRecord(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await payrollAPI.deletePenalty(id);
      message.success("Xóa phiếu phạt thành công");
      fetchPenalties();
    } catch (error) {
      message.error("Không thể xóa phiếu phạt");
      console.error("Error deleting penalty:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        user_id: values.employee_id,
        date: values.date.format("YYYY-MM-DD"),
        amount: values.amount,
        notes: values.notes || null,
      };

      if (editingRecord) {
        await payrollAPI.updatePenalty(editingRecord.id, payload);
        message.success("Cập nhật phiếu phạt thành công");
      } else {
        await payrollAPI.createPenalty(payload);
        message.success("Tạo phiếu phạt thành công");
      }

      setModalVisible(false);
      fetchPenalties();
    } catch (error) {
      console.error("Error submitting penalty:", error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error("Không thể lưu phiếu phạt");
      }
    }
  };

  const handleAutoGenerate = () => {
    autoGenForm.resetFields();
    // Set default date range to last 7 days
    autoGenForm.setFieldsValue({
      dateRange: [dayjs().subtract(7, 'day'), dayjs()],
    });
    setAutoGenModalVisible(true);
  };

  const handleAutoGenerateSubmit = async () => {
    try {
      const values = await autoGenForm.validateFields();
      const [startDate, endDate] = values.dateRange;

      setLoading(true);
      const response = await payrollAPI.autoGeneratePenalties(
        startDate.format("YYYY-MM-DD"),
        endDate.format("YYYY-MM-DD")
      );

      message.success(`Đã tạo ${response.data.data.length} phiếu phạt tự động`);
      setAutoGenModalVisible(false);
      fetchPenalties();
    } catch (error) {
      console.error("Error auto-generating penalties:", error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error("Không thể tạo phiếu phạt tự động");
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ngày phạt",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Nhân viên",
      dataIndex: "employee_name",
      key: "employee_name",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right",
      render: (amount) => (
        <span style={{ color: "#ff4d4f", fontWeight: 600 }}>
          -{amount.toLocaleString()} đ
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
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
          {isUserAdmin && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
              <Popconfirm
                title="Xác nhận xóa?"
                description="Bạn có chắc chắn muốn xóa phiếu phạt này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h3>Danh sách phiếu phạt</h3>
        {isUserAdmin && (
          <Space>
            <Button
              type="default"
              icon={<ThunderboltOutlined />}
              onClick={handleAutoGenerate}
            >
              Tạo phiếu phạt tự động
            </Button>
            <Button type="primary" danger icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo phiếu phạt thủ công
            </Button>
          </Space>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={penalties}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 50,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} phiếu`,
        }}
      />

      {/* Form Modal */}
      <Modal
        title={editingRecord ? "Chỉnh sửa phiếu phạt" : "Tạo phiếu phạt mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        okText={editingRecord ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nhân viên"
            name="employee_id"
            rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
          >
            <Select
              placeholder="Chọn nhân viên"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={employees.map((emp) => ({
                label: emp.full_name,
                value: emp.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Ngày phạt"
            name="date"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Số tiền phạt"
            name="amount"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền" },
              { type: "number", min: 0, message: "Số tiền phải lớn hơn 0" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              addonAfter="đ"
              placeholder="Nhập số tiền"
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="notes">
            <TextArea rows={2} placeholder="Ghi chú thêm (nếu có)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết phiếu phạt"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {viewingRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã phiếu">#{viewingRecord.id}</Descriptions.Item>
            <Descriptions.Item label="Nhân viên">{viewingRecord.employee_name}</Descriptions.Item>
            <Descriptions.Item label="Ngày phạt">
              {dayjs(viewingRecord.date).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <strong style={{ color: "#ff4d4f", fontSize: 16 }}>
                -{viewingRecord.amount.toLocaleString()} đ
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Người tạo">{viewingRecord.created_by}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(viewingRecord.created_at).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            {viewingRecord.notes && (
              <Descriptions.Item label="Ghi chú">{viewingRecord.notes}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Auto Generate Modal */}
      <Modal
        title={
          <div>
            <ThunderboltOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Tạo phiếu phạt tự động
          </div>
        }
        open={autoGenModalVisible}
        onCancel={() => setAutoGenModalVisible(false)}
        onOk={handleAutoGenerateSubmit}
        width={600}
        okText="Tạo phiếu phạt"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Hệ thống sẽ tự động tạo phiếu phạt cho:</div>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>Nhân viên vắng mặt không phép: <strong>{settings?.absent_penalty?.toLocaleString() || '100,000'} đ</strong></li>
            <li>Nhân viên đi muộn: <strong>Theo mức thiết lập</strong> (từ {settings?.penalty_tiers?.[0]?.penalty_amount?.toLocaleString() || '0'} đ)</li>
            <li>Nhân viên về sớm: <strong>{settings?.early_checkout_penalty?.toLocaleString() || '50,000'} đ</strong></li>
          </ul>
        </div>

        <Form form={autoGenForm} layout="vertical">
          <Form.Item
            label="Chọn khoảng thời gian"
            name="dateRange"
            rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian" }]}
          >
            <RangePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#e6f4ff', borderRadius: 8, border: '1px solid #91caff' }}>
          <div style={{ fontSize: 12, color: '#0958d9' }}>
            <strong>Lưu ý:</strong> Hệ thống chỉ tạo phiếu phạt cho những ngày chưa có phiếu phạt tương ứng.
            Nếu đã có phiếu phạt thì sẽ không tạo trùng.
          </div>
        </div>
      </Modal>
    </div>
  );
}
