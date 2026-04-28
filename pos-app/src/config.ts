/**
 * API Configuration
 * Hỗ trợ environment variables cho các môi trường khác nhau
 */

// API Base URL - Có thể override bằng environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Device ID - Unique identifier cho mỗi thiết bị POS
export const DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'POS01'

// API Timeout (milliseconds)
export const API_TIMEOUT = 30000

// Retry configuration cho failed requests
export const API_RETRY_ATTEMPTS = 3
export const API_RETRY_DELAY = 1000 // ms

// Token storage key
export const TOKEN_STORAGE_KEY = 'pos_auth_token'

// Development mode
export const IS_DEV = import.meta.env.DEV

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  POS_LOGIN: '/api/auth/pos-login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',

  // Products
  PRODUCTS: '/api/products',
  PRODUCT_BY_ID: (id: number) => `/api/products/${id}`,

  // Menus (Categories)
  MENUS: '/api/menus',
  MENU_BY_ID: (id: number) => `/api/menus/${id}`,

  // Orders
  ORDERS: '/api/pos/orders',
  ORDER_BY_ID: (id: number) => `/api/pos/orders/${id}`,
  UPDATE_ORDER_STATUS: (id: number) => `/api/pos/orders/${id}/status`,

  // Tables
  TABLES: '/tables',
  TABLE_BY_ID: (id: number) => `/tables/${id}`,

  // Reservations
  RESERVATIONS: '/reservations',
  RESERVATION_BY_ID: (id: number) => `/reservations/${id}`,

  // Statistics
  REVENUE_STATS: '/stats/revenue',
  ITEMS_STATS: '/stats/items',
  TABLES_STATS: '/stats/tables',

  // Device
  DEVICE_CONFIG: (id: string) => `/devices/${id}`,
  DEVICE_SYNC: (id: string) => `/devices/${id}/sync`,
} as const

// QR Attendance Configuration
export const QR_ATTENDANCE_DEVICE_ID = import.meta.env.VITE_QR_DEVICE_ID || 'PC-QR-01'
export const QR_ATTENDANCE_INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || 'azpoolarena-internal-qr-2026'
export const QR_ATTENDANCE_TTL = Number(import.meta.env.VITE_QR_TTL || '60')

