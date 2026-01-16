import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { COLORS, SPACING } from '../../constants/theme';

export default function EmptyState({
  description = 'Chưa có dữ liệu',
  actionText,
  onAction,
  icon,
}) {
  return (
    <div
      style={{
        padding: `${SPACING.xxl}px 0`,
        textAlign: 'center',
      }}
    >
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: COLORS.textSecondary }}>{description}</span>
        }
      >
        {actionText && onAction && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAction}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
