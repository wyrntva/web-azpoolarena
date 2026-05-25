import { ReactNode } from 'react'

export type TagVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'
export type TagSize = 'sm' | 'md' | 'lg'

interface TagProps {
  variant?: TagVariant
  size?: TagSize
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export default function Tag({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className = '',
}: TagProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-bold rounded-full whitespace-nowrap'

  const variantStyles = {
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    default: 'bg-gray-50 text-gray-700 border border-gray-200',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export function OrderStatusTag({ status }: { status: 'paid' | 'pending' | 'cancelled' | 'dine-in' | 'takeaway' | 'delivery' }) {
  const statusConfig = {
    paid: { variant: 'success' as TagVariant, label: 'Đã thanh toán', icon: '✓' },
    pending: { variant: 'warning' as TagVariant, label: 'Chờ xử lý', icon: '○' },
    cancelled: { variant: 'danger' as TagVariant, label: 'Đã hủy', icon: '✕' },
    'dine-in': { variant: 'info' as TagVariant, label: 'Tại bàn', icon: '🍽️' },
    takeaway: { variant: 'info' as TagVariant, label: 'Mang đi', icon: '🥡' },
    delivery: { variant: 'info' as TagVariant, label: 'Giao hàng', icon: '🚚' },
  }

  const config = statusConfig[status]

  return (
    <Tag variant={config.variant} icon={<span>{config.icon}</span>}>
      {config.label}
    </Tag>
  )
}
