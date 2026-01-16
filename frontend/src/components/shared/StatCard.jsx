import { Card, Statistic } from 'antd';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';

export default function StatCard({
  title,
  value,
  prefix,
  suffix,
  icon,
  color = COLORS.primary,
  precision = 0,
  formatter,
  loading = false,
  trend, // { value: 12.5, isPositive: true }
}) {
  return (
    <Card
      className="hover-card"
      loading={loading}
      style={{
        boxShadow: SHADOWS.card,
        borderRadius: 12,
        border: 'none',
      }}
      styles={{
        body: { padding: SPACING.lg },
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Statistic
            title={
              <span style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                fontWeight: 500,
              }}>
                {title}
              </span>
            }
            value={value}
            precision={precision}
            valueStyle={{
              color: color,
              fontSize: 28,
              fontWeight: 600,
            }}
            prefix={prefix}
            suffix={suffix}
            formatter={formatter}
          />
          {trend && (
            <div
              style={{
                marginTop: SPACING.xs,
                fontSize: 12,
                color: trend.isPositive ? COLORS.success : COLORS.error,
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}% so với tháng trước
            </div>
          )}
        </div>
        {icon && (
          <div
            style={{
              fontSize: 40,
              color: `${color}20`,
              lineHeight: 1,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
