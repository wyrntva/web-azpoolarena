/**
 * Format currency to Vietnamese format
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) || 0 : value
  return num.toLocaleString('vi-VN') + '₫'
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Format time to 12-hour format with AM/PM
 */
export function formatTime12h(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
  const h12 = date.getHours() % 12 || 12
  return `${h12}:${mm} ${ampm}`
}

/**
 * Format time to 24-hour format
 */
export function formatTime24h(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
