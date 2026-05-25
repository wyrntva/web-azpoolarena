import { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  fullWidth?: boolean
  placeholder?: string
}

export default function Select({
  label,
  error,
  options,
  fullWidth = false,
  placeholder,
  className = '',
  ...props
}: SelectProps) {
  const baseStyles = 'h-11 px-4 pr-10 rounded-lg border-2 font-medium text-sm transition-all duration-200 outline-none appearance-none bg-white cursor-pointer'
  const variantStyles = 'border-gray-200 text-gray-900 focus:border-[#0088FF] focus:ring-4 focus:ring-[#0088FF]/10'
  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`${baseStyles} ${variantStyles} ${errorStyles} ${widthStyle} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  )
}
