import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Tag,
  Space,
} from 'antd';
import { message } from '../../utils/antdGlobal';
import {
  PlusOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { userAPI } from '../../api/user.api';
import { roleAPI } from '../../api/role.api';
import { translateRoleName } from '../../utils/roleTranslations';
import { PageHeader, DataTable, ActionButtons } from '../../components/shared';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../auth/AuthContext';
import { canCreate, canEdit, canDelete } from '../../utils/permissions';
import { PERMISSIONS } from '../../constants/permissions';

// Role color mapping
const ROLE_COLORS = {
  'Quản lý': COLORS.roleAdmin || '#ff4d4f',
  'Thu ngân': COLORS.roleAccountant || '#1890ff',
  'Nhân viên': COLORS.roleStaff || '#52c41a',
  'Phục vụ': '#722ed1', // Purple
  'admin': COLORS.roleAdmin || '#ff4d4f',
  'accountant': COLORS.roleAccountant || '#1890ff',
  'staff': COLORS.roleStaff || '#52c41a',
  'default': 'default',
};

// Component để nhập PIN 4 số
const PinInput = ({ value = '', onChange }) => {
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const [digits, setDigits] = useState(['', '', '', '']);

  useEffect(() => {
    if (value && value.length === 4) {
      setDigits(value.split(''));
    } else if (!value) {
      setDigits(['', '', '', '']);
    }
  }, [value]);

  const handleChange = (index, val) => {
    const newVal = val.replace(/[^0-9]/g, '');
    if (newVal.length > 1) return;

    const newDigits = [...digits];
    newDigits[index] = newVal;
    setDigits(newDigits);

    const pin = newDigits.join('');
    onChange?.(pin);

    // Auto focus next input
    if (newVal && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    const newDigits = pasteData.split('').concat(['', '', '', '']).slice(0, 4);
    setDigits(newDigits);
    onChange?.(newDigits.join(''));
  };

  const generateRandomPin = () => {
    const newDigits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10).toString());
    setDigits(newDigits);
    onChange?.(newDigits.join(''));
  };

  return (
    <Space size={8}>
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={inputRefs[index]}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          maxLength={1}
          style={{
            width: 50,
            height: 50,
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 'bold',
            fontFamily: 'monospace',
          }}
        />
      ))}
      <Button
        icon={<ReloadOutlined />}
        onClick={generateRandomPin}
        title="Tạo mã PIN ngẫu nhiên"
      >
        Tạo ngẫu nhiên
      </Button>
    </Space>
  );
};

export default function Staff() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [salaryType, setSalaryType] = useState('hourly');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getUsers();
      // Sort users by created_at ascending (earliest created first)
      const sortedUsers = (response.data || []).sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA - dateB;
      });
      setUsers(sortedUsers);
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      setRoles(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách vai trò');
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setSalaryType('hourly');
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    setSalaryType(record.salary_type || 'hourly');
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      full_name: record.full_name,
      role_id: record.role_id,
      is_active: record.is_active,
      pin: record.pin,
      salary_type: record.salary_type || 'hourly',
      fixed_salary: record.fixed_salary,
    });
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      await userAPI.deleteUser(record.id);
      message.success('Xóa nhân viên thành công');
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa nhân viên thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        const updateData = { ...values };
        // Xóa username vì không được phép thay đổi
        delete updateData.username;
        // Xóa password nếu không có giá trị
        if (!updateData.password) {
          delete updateData.password;
        }
        await userAPI.updateUser(editingUser.id, updateData);
        message.success('Cập nhật nhân viên thành công');
      } else {
        await userAPI.createUser(values);
        message.success('Thêm nhân viên thành công');
      }
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: COLORS.primary }} />
          <strong>{text}</strong>
        </div>
      ),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Mã PIN',
      dataIndex: 'pin',
      key: 'pin',
      render: (pin) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {pin || '----'}
        </span>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const color = ROLE_COLORS[role?.name] || ROLE_COLORS.default;
        return (
          <Tag color={color}>
            {translateRoleName(role?.name) || 'N/A'}
          </Tag>
        );
      },
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
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <ActionButtons
          record={record}
          onEdit={canEdit(user, PERMISSIONS.STAFF.EDIT) ? handleEdit : null}
          onDelete={canDelete(user, PERMISSIONS.STAFF.DELETE) ? handleDelete : null}
          deleteConfirmDescription="Bạn có chắc muốn xóa nhân viên này?"
        />
      ),
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Quản lý nhân viên"
        subtitle="Quản lý thông tin nhân viên và phân quyền hệ thống"
        icon={<UserOutlined />}
        extra={
          canCreate(user, PERMISSIONS.STAFF.CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
              Thêm nhân viên
            </Button>
          )
        }
        breadcrumbs={[
          { title: 'Nhân viên' },
          { title: 'Danh sách nhân viên' },
        ]}
      />

      <DataTable
        columns={columns}
        dataSource={users}
        loading={loading}
      />

      <Modal
        title={editingUser ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingUser ? 'Cập nhật' : 'Thêm'}
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
            name="username"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              {
                pattern: /^0[0-9]{9,10}$/,
                message: 'Số điện thoại phải có 10-11 số và bắt đầu bằng số 0'
              },
            ]}
          >
            <Input
              placeholder="Nhập số điện thoại (VD: 0123456789)"
              disabled={!!editingUser}
              maxLength={11}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Nhập email (tùy chọn)" />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
            rules={
              editingUser
                ? [{ min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }]
                : [
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                ]
            }
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            name="pin"
            label="Mã PIN (để chấm công)"
            rules={[
              { required: true, message: 'Vui lòng nhập mã PIN' },
              { len: 4, message: 'Mã PIN phải có đúng 4 số' },
              { pattern: /^\d{4}$/, message: 'Mã PIN chỉ chứa số' },
            ]}
            extra="Mã PIN dùng để nhân viên chấm công"
          >
            <PinInput />
          </Form.Item>

          <Form.Item
            name="role_id"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              placeholder="Chọn vai trò"
              loading={roles.length === 0}
              optionLabelProp="label"
            >
              {roles.map((role) => (
                <Select.Option
                  key={role.id}
                  value={role.id}
                  label={translateRoleName(role.name)}
                >
                  <Tag color={ROLE_COLORS[role.name] || ROLE_COLORS.default}>
                    {translateRoleName(role.name)}
                  </Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="salary_type"
            label="Loại lương"
            initialValue="hourly"
            rules={[{ required: true, message: 'Vui lòng chọn loại lương' }]}
          >
            <Radio.Group onChange={(e) => setSalaryType(e.target.value)}>
              <Radio value="hourly">Lương theo giờ</Radio>
              <Radio value="fixed">Lương cứng</Radio>
            </Radio.Group>
          </Form.Item>

          {salaryType === 'fixed' && (
            <Form.Item
              name="fixed_salary"
              label="Lương tháng"
              rules={[
                { required: true, message: 'Vui lòng nhập lương tháng' },
                { type: 'number', min: 0, message: 'Lương phải lớn hơn 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/,/g, '')}
                placeholder="Nhập lương tháng"
                suffix="đ"
              />
            </Form.Item>
          )}

          <Form.Item
            name="is_active"
            label="Trạng thái"
            initialValue={true}
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Vô hiệu hóa</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
