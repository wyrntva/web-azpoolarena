import { ReactNode } from 'react'

export type CardVariant = 'default' | 'bordered' | 'elevated' | 'interactive'

interface CardProps {
  variant?: CardVariant
  children: ReactNode
  className?: string
  onClick?: () => void
  header?: ReactNode
  footer?: ReactNode
}

export default function Card({
  variant = 'default',
  children,
  className = '',
  onClick,
  header,
  footer,
}: CardProps) {
  const baseStyles = 'rounded-xl bg-white transition-all duration-200'

  const variantStyles = {
    default: 'border border-gray-100 shadow-sm',
    bordered: 'border-2 border-gray-200',
    elevated: 'shadow-lg border border-gray-50',
    interactive: 'border-2 border-gray-100 hover:border-[#0088FF] hover:shadow-lg hover:-translate-y-1 cursor-pointer active:translate-y-0',
  }

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
    >
      {header && (
        <div className="px-5 py-4 border-b border-gray-100">
          {header}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
      {footer && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </Component>
  )
}

export function ProductCard({
  image,
  name,
  price,
  priceUnit,
  onClick,
  className = '',
}: {
  image?: string
  name: string
  price: number
  priceUnit?: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-[#0088FF] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 active:translate-y-0 min-h-[200px] flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="text-6xl filter drop-shadow-md">
        {image || '📦'}
      </div>
      <div className="font-bold text-base text-gray-900 text-center leading-tight">
        {name}
      </div>
      <div className="font-bold text-sm text-[#0088FF]">
        {price.toLocaleString()}₫{priceUnit ? ` / ${priceUnit}` : ''}
      </div>
    </button>
  )
}
