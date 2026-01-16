import { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Tag,
  message,
  Collapse,
  Checkbox,
  Space,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SafetyOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { PageHeader, DataTable, ActionButtons } from '../../components/shared';
import { COLORS } from '../../constants/theme';
import { roleAPI } from '../../api/role.api';
import { translateRoleName } from '../../utils/roleTranslations';
import { PERMISSION_GROUPS } from '../../constants/permissions';

const { Panel } = Collapse;

// Role color mapping
const ROLE_COLORS = {
  'Quản lý': COLORS.roleAdmin || '#ff4d4f',
  'Thu ngân': COLORS.roleAccountant || '#1890ff',
  'Nhân viên': COLORS.roleStaff || '#52c41a',
  'Phục vụ': '#722ed1',
  'admin': COLORS.roleAdmin || '#ff4d4f',
  'accountant': COLORS.roleAccountant || '#1890ff',
  'staff': COLORS.roleStaff || '#52c41a',
  'default': 'default',
};

export default function StaffRole() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleAPI.getRoles();
      setRoles(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách vai trò');
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setSelectedPermissions([]);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active,
    });
    setSelectedPermissions(record.permissions || []);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    if (record.is_system) {
      message.warning('Không thể xóa vai trò hệ thống');
      return;
    }

    try {
      await roleAPI.deleteRole(record.id);
      message.success('Xóa vai trò thành công');
      fetchRoles();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Xóa vai trò thất bại');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        permissions: selectedPermissions,
      };

      if (editingRole) {
        await roleAPI.updateRole(editingRole.id, data);
        message.success('Cập nhật vai trò thành công');
      } else {
        await roleAPI.createRole(data);
        message.success('Thêm vai trò thành công');
      }
      setModalVisible(false);
      form.resetFields();
      setSelectedPermissions([]);
      fetchRoles();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const handlePermissionChange = (permissionKey, parentPermission) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionKey)) {
        // Nếu bỏ chọn, xóa permission này
        return prev.filter((p) => p !== permissionKey);
      } else {
        // Nếu chọn, thêm permission này
        // Nếu permission này có parent, tự động thêm parent
        const newPermissions = [...prev, permissionKey];
        if (parentPermission && !prev.includes(parentPermission)) {
          newPermissions.push(parentPermission);
        }
        return newPermissions;
      }
    });
  };

  const handleParentPermissionChange = (group, parentPermission) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(parentPermission)) {
        // Nếu bỏ chọn parent, xóa tất cả child permissions
        const childPermissions = group.permissions
          .filter(p => p.parent === parentPermission)
          .map(p => p.key);
        return prev.filter((p) => p !== parentPermission && !childPermissions.includes(p));
      } else {
        // Nếu chọn parent, chỉ thêm parent
        return [...prev, parentPermission];
      }
    });
  };

  const handleSelectAllGroup = (group, checked) => {
    const groupPermissions = group.permissions.map((p) => p.key);
    setSelectedPermissions((prev) => {
      if (checked) {
        return [...new Set([...prev, ...groupPermissions])];
      } else {
        return prev.filter((p) => !groupPermissions.includes(p));
      }
    });
  };

  const isGroupFullySelected = (group) => {
    const groupPermissions = group.permissions.map((p) => p.key);
    return groupPermissions.every((p) => selectedPermissions.includes(p));
  };

  const isGroupPartiallySelected = (group) => {
    const groupPermissions = group.permissions.map((p) => p.key);
    const selectedCount = groupPermissions.filter((p) => selectedPermissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < groupPermissions.length;
  };

  const getParentPermission = (group) => {
    return group.permissions.find(p => p.isParent);
  };

  const getChildPermissions = (group) => {
    return group.permissions.filter(p => !p.isParent);
  };

  const isParentSelected = (group) => {
    const parent = getParentPermission(group);
    return parent && selectedPermissions.includes(parent.key);
  };

  const columns = [
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={ROLE_COLORS[text] || ROLE_COLORS.default} style={{ margin: 0 }}>
            <SafetyOutlined style={{ marginRight: 4 }} />
            <strong>{translateRoleName(text)}</strong>
          </Tag>
          {record.is_system && (
            <Tag color="#172339" style={{ marginLeft: 8 }}>
              Hệ thống
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số quyền',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Tag color="green">{permissions?.length || 0} quyền</Tag>
      ),
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
          onEdit={handleEdit}
          onDelete={record.is_system ? null : handleDelete}
          deleteConfirmDescription="Bạn có chắc muốn xóa vai trò này?"
        />
      ),
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Vai trò nhân viên"
        subtitle="Quản lý vai trò và phân quyền truy cập hệ thống"
        icon={<SafetyOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
            Thêm vai trò
          </Button>
        }
        breadcrumbs={[
          { title: 'Nhân viên' },
          { title: 'Vai trò nhân viên' },
        ]}
      />

      <DataTable
        columns={columns}
        dataSource={roles}
        loading={loading}
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined />
            {editingRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedPermissions([]);
        }}
        onOk={() => form.submit()}
        okText={editingRole ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={900}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Tên vai trò"
            rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
          >
            <Input placeholder="VD: Nhân viên bán hàng" disabled={editingRole?.is_system} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea rows={2} placeholder="Mô tả vai trò và trách nhiệm" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            initialValue={true}
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu hóa" />
          </Form.Item>

          <Divider>Phân quyền</Divider>

          <Alert
            message="Lưu ý"
            description="Vai trò Quản trị (Admin) tự động có tất cả quyền trong hệ thống. Không cần chọn quyền cho Admin."
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">
              {selectedPermissions.length} quyền đã chọn
            </Tag>
          </div>

          <Collapse defaultActiveKey={PERMISSION_GROUPS.map(g => g.key)}>
            {PERMISSION_GROUPS.map((group) => {
              const parent = getParentPermission(group);
              const children = getChildPermissions(group);
              const parentSelected = isParentSelected(group);

              return (
                <Panel
                  header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>
                        <strong>{group.label}</strong>
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {group.permissions.filter(p => selectedPermissions.includes(p.key)).length}/{group.permissions.length}
                        </Tag>
                      </span>
                      <Checkbox
                        checked={isGroupFullySelected(group)}
                        indeterminate={isGroupPartiallySelected(group)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectAllGroup(group, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Chọn tất cả
                      </Checkbox>
                    </div>
                  }
                  key={group.key}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {parent && (
                      <div style={{
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        marginBottom: children.length > 0 ? '12px' : '0'
                      }}>
                        <Checkbox
                          checked={selectedPermissions.includes(parent.key)}
                          onChange={() => handleParentPermissionChange(group, parent.key)}
                          style={{ fontWeight: 'bold' }}
                        >
                          {parent.label}
                        </Checkbox>
                      </div>
                    )}

                    {children.length > 0 && (
                      <div style={{
                        paddingLeft: parent ? '24px' : '0',
                        opacity: parentSelected || !parent ? 1 : 0.5,
                      }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {children.map((permission) => (
                            <Checkbox
                              key={permission.key}
                              checked={selectedPermissions.includes(permission.key)}
                              onChange={() => handlePermissionChange(permission.key, permission.parent)}
                              disabled={parent && !parentSelected}
                            >
                              {permission.label}
                            </Checkbox>
                          ))}
                        </Space>
                      </div>
                    )}
                  </Space>
                </Panel>
              );
            })}
          </Collapse>
        </Form>
      </Modal>
    </div>
  );
}
