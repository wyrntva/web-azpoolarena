import { Form, Space, Button, Card } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { SPACING } from '../../constants/theme';

export default function FilterBar({
  form,
  onFinish,
  onReset,
  children,
  layout = 'inline',
}) {
  const handleReset = () => {
    form.resetFields();
    if (onReset) onReset();
  };

  return (
    <Card
      style={{
        marginBottom: SPACING.lg,
        borderRadius: 8,
      }}
      styles={{
        body: { padding: SPACING.md },
      }}
    >
      <Form
        form={form}
        layout={layout}
        onFinish={onFinish}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
          alignItems: 'flex-end',
        }}
      >
        {children}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
              Lọc
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Đặt lại
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
