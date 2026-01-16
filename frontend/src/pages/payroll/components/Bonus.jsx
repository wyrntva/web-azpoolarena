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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { userAPI } from "../../../api/user.api";
import { payrollAPI } from "../../../api/payroll.api";
import { useAuth } from "../../../auth/AuthContext";
import { isAdmin, ROLES } from "../../../auth/roles";

const { TextArea } = Input;

export default function Bonus() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bonuses, setBonuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [form] = Form.useForm();

  const isUserAdmin = isAdmin(user);

  useEffect(() => {
    if (isUserAdmin) {
      fetchEmployees();
    }
    fetchBonuses();
  }, [isUserAdmin]);

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

  const fetchBonuses = async () => {
    setLoading(true);
    try {
      const response = await payrollAPI.getBonuses();
      const bonusesData = response.data || [];

      const mappedBonuses = bonusesData.map(bonus => ({
        id: bonus.id,
        employee_id: bonus.user_id,
        employee_name: bonus.employee_name,
        amount: bonus.amount,
        date: bonus.date,
        notes: bonus.notes,
        created_by: bonus.created_by_name,
        created_at: bonus.created_at,
      }));

      setBonuses(mappedBonuses);
    } catch (error) {
      message.error("Không thể tải danh sách phiếu thưởng");
      console.error("Error fetching bonuses:", error);
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
      ...record,
      date: dayjs(record.date),
    });
    setModalVisible(true);
  };

  const handleView = (record) => {
    setViewingRecord(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await payrollAPI.deleteBonus(id);
      message.success("Xóa phiếu thưởng thành công");
      fetchBonuses();
    } catch (error) {
      message.error("Không thể xóa phiếu thưởng");
      console.error("Error deleting bonus:", error);
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
        await payrollAPI.updateBonus(editingRecord.id, payload);
        message.success("Cập nhật phiếu thưởng thành công");
      } else {
        await payrollAPI.createBonus(payload);
        message.success("Tạo phiếu thưởng thành công");
      }

      setModalVisible(false);
      fetchBonuses();
    } catch (error) {
      console.error("Error submitting bonus:", error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error("Không thể lưu phiếu thưởng");
      }
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
      title: "Ngày thưởng",
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
        <span style={{ color: "#52c41a", fontWeight: 600 }}>
          +{amount.toLocaleString()} đ
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
                description="Bạn có chắc chắn muốn xóa phiếu thưởng này?"
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
        <h3>Danh sách phiếu thưởng</h3>
        {isUserAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo phiếu thưởng
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={bonuses}
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
        title={editingRecord ? "Chỉnh sửa phiếu thưởng" : "Tạo phiếu thưởng mới"}
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
            label="Ngày thưởng"
            name="date"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Số tiền thưởng"
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
        title="Chi tiết phiếu thưởng"
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
            <Descriptions.Item label="Ngày thưởng">
              {dayjs(viewingRecord.date).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <strong style={{ color: "#52c41a", fontSize: 16 }}>
                +{viewingRecord.amount.toLocaleString()} đ
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
    </div>
  );
}
