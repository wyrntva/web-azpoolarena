import { Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

export default function ActionButtons({
  onView,
  onEdit,
  onDelete,
  deleteConfirmTitle = 'Xác nhận xóa?',
  deleteConfirmDescription = 'Bạn có chắc muốn xóa mục này?',
  viewText = 'Xem',
  editText = 'Sửa',
  deleteText = 'Xóa',
  size = 'small',
  record,
}) {
  return (
    <Space size="small">
      {onView && (
        <Button
          type="link"
          size={size}
          icon={<EyeOutlined />}
          onClick={() => onView(record)}
        >
          {viewText}
        </Button>
      )}
      {onEdit && (
        <Button
          type="link"
          size={size}
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        >
          {editText}
        </Button>
      )}
      {onDelete && (
        <Popconfirm
          title={deleteConfirmTitle}
          description={deleteConfirmDescription}
          onConfirm={() => onDelete(record)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" size={size} danger icon={<DeleteOutlined />}>
            {deleteText}
          </Button>
        </Popconfirm>
      )}
    </Space>
  );
}
