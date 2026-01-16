import { Table, Card } from 'antd';
import { SHADOWS, SPACING } from '../../constants/theme';

export default function DataTable({
  title,
  extra,
  columns,
  dataSource,
  loading = false,
  rowKey = 'id',
  pagination = true,
  ...tableProps
}) {
  const defaultPagination = pagination
    ? {
      pageSize: 50,
      showSizeChanger: false,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
      ...((typeof pagination === 'object') ? pagination : {}),
    }
    : false;

  return (
    <Card
      title={title}
      extra={extra}
      style={{
        boxShadow: SHADOWS.card,
        borderRadius: 12,
        border: 'none',
      }}
      styles={{
        body: { padding: SPACING.lg },
      }}
    >
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        pagination={defaultPagination}
        scroll={{ x: 'max-content' }}
        {...tableProps}
      />
    </Card>
  );
}
