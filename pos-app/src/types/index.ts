/**
 * Centralized type definitions
 */

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: number
  name: string
  price: number
  priceUnit?: string
  barcode?: string
  code?: string
  category?: string
  image?: string
  description?: string
  unit?: string
  inStock?: boolean
  color?: string
  categoryId?: number
  type?: string
  hourlyPrice?: number
  timeIntervalValue?: number
  timeIntervalUnit?: string
}

export interface CartItem {
  product: Product
  qty: number
}

// ============================================
// PAYMENT & ORDER TYPES
// ============================================

export type PaymentMethod = 'cash' | 'bank' | 'card' | 'e-wallet'

export interface PaymentPayload {
  method: PaymentMethod
  paid: number
  change?: number
}

export interface OrderItem {
  productId: number
  qty: number
  price: number
  productName?: string
}

export interface OrderPayload {
  items: OrderItem[]
  payment: PaymentPayload
  deviceId: string
  discount?: number
  customerCount?: number
  tableId?: number
  note?: string
}

export type OrderStatus =
  | 'pending-payment'
  | 'pending-confirm'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export interface Order {
  id: number
  orderNumber: string
  items: OrderItem[]
  payment: PaymentPayload
  status: OrderStatus
  deviceId: string
  discount?: number
  customerCount?: number
  tableId?: number
  note?: string
  total: number
  createdAt: string
  updatedAt: string
}

// ============================================
// OFFLINE SYNC TYPES
// ============================================

export type PendingStatus = 'pending' | 'sent' | 'error'

export interface PendingOrder {
  orderIdLocal: string
  payload: OrderPayload
  status: PendingStatus
  created_at: string
  error?: string
}

// ============================================
// TABLE TYPES
// ============================================

export type TableStatus = 'empty' | 'occupied' | 'reserved' | 'cleaning'

export interface Table {
  id: number
  name: string
  status: TableStatus
  capacity: number
  currentOrderId?: number
  startTime?: string
  customerCount?: number
}

export interface WaitingCustomer {
  id: number
  name: string
  phoneNumber: string
  customerCount: number
  arrivedAt: string
  estimatedWaitTime?: number
}

// ============================================
// RESERVATION TYPES
// ============================================

export type ReservationStatus = 'pending' | 'confirmed' | 'arrived' | 'cancelled' | 'no-show'

export interface Reservation {
  id: number
  tableId: number
  customerName: string
  phoneNumber: string
  customerCount: number
  reservationDate: string
  reservationTime: string
  status: ReservationStatus
  note?: string
  createdAt: string
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface RevenueStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  cashRevenue: number
  bankRevenue: number
  period: {
    from: string
    to: string
  }
}

export interface ItemStats {
  productId: number
  productName: string
  quantitySold: number
  revenue: number
  category?: string
}

export interface TableStats {
  tableId: number
  tableName: string
  utilizationRate: number
  totalRevenue: number
  averageSessionDuration: number
}

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: number
  name: string
  role: 'admin' | 'manager' | 'cashier' | 'staff'
  pin?: string
  email?: string
}

export interface AuthResponse {
  success: boolean
  token: string
  refreshToken: string
  user: User
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Re-export electron-updater types
export * from './electron-updater'
