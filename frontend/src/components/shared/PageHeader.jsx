import { Space, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { COLORS, SPACING } from '../../constants/theme';

export default function PageHeader({
  title,
  subtitle,
  icon,
  extra,
  breadcrumbs = []
}) {
  return (
    <div style={{ marginBottom: SPACING.lg }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: SPACING.sm }}
          items={[
            {
              href: '/',
              title: <HomeOutlined />,
            },
            ...breadcrumbs
          ]}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: SPACING.md,
        }}
      >
        <div>
          <Space size="middle">
            {icon && (
              <div
                style={{
                  fontSize: 24,
                  color: COLORS.primary,
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                  color: COLORS.textPrimary,
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  style={{
                    fontSize: 14,
                    color: COLORS.textSecondary,
                    margin: '4px 0 0 0',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </Space>
        </div>
        {extra && <div>{extra}</div>}
      </div>
    </div>
  );
}
