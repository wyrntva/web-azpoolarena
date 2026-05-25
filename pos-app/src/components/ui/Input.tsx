import { InputHTMLAttributes, ReactNode } from 'react'

export type InputVariant = 'default' | 'search' | 'number'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant
  label?: string
  error?: string
  icon?: ReactNode
  suffix?: ReactNode
  fullWidth?: boolean
}

export default function Input({
  variant = 'default',
  label,
  error,
  icon,
  suffix,
  fullWidth = false,
  className = '',
  ...props
}: InputProps) {
  const baseStyles = 'h-11 px-4 rounded-lg border-2 font-medium text-sm transition-all duration-200 outline-none'

  const variantStyles = {
    default: 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#0088FF] focus:ring-4 focus:ring-[#0088FF]/10',
    search: 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#0088FF] focus:bg-white focus:ring-4 focus:ring-[#0088FF]/10',
    number: 'border-gray-200 bg-white text-gray-900 text-right font-semibold focus:border-[#0088FF] focus:ring-4 focus:ring-[#0088FF]/10',
  }

  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
  const widthStyle = fullWidth ? 'w-full' : ''
  const hasIcon = icon ? 'pl-11' : ''
  const hasSuffix = suffix ? 'pr-11' : ''

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`${baseStyles} ${variantStyles[variant]} ${errorStyles} ${widthStyle} ${hasIcon} ${hasSuffix} ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  )
}
