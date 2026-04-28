import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT, TOKEN_STORAGE_KEY } from '../config'
import { OrderPayload, Product } from '../types'

export const USER_STORAGE_KEY = 'pos_user_info'

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem(USER_STORAGE_KEY)
  try {
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export interface Area {
  id: number
  name: string
  description?: string | null
  table_count: number
  actual_table_count?: number
  created_at?: string
  updated_at?: string
}

export interface AreaTable {
  id: number
  name: string
  x: number
  y: number
  width: number
  height: number
}

export interface AreaDetail extends Area {
  tables: AreaTable[]
}

/**
 * Custom API Error với thông tin chi tiết
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

/**
 * Network Error - khi không thể kết nối server
 */
export class NetworkError extends Error {
  constructor(message = 'Network error - Cannot connect to server') {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * Request Options
 */
interface RequestOptions extends RequestInit {
  timeout?: number
  skipAuth?: boolean
}

/**
 * Lấy token từ storage hoặc tham số
 */
function getAuthToken(tokenOverride?: string): string | null {
  if (tokenOverride) return tokenOverride

  // Lấy từ localStorage hoặc electron store
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }

  return null
}

/**
 * Generic request handler với timeout và error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = API_TIMEOUT, skipAuth = false, ...fetchOptions } = options

  // Setup headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Merge existing headers
  if (fetchOptions.headers) {
    const existingHeaders = fetchOptions.headers as Record<string, string>
    Object.assign(headers, existingHeaders)
  }

  // Add authorization header nếu có token
  if (!skipAuth) {
    const authHeader = headers['Authorization']
    const token = getAuthToken(authHeader?.replace('Bearer ', ''))
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  // Add device code header for POS validation
  if (typeof window !== 'undefined') {
    const deviceCode = localStorage.getItem('device_code')
    if (deviceCode) {
      headers['X-Device-Code'] = deviceCode
    }
  }

  // Setup abort controller cho timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Handle device deactivation/deletion
      if (response.status === 401 || response.status === 403) {
        if (errorData.detail?.includes('Device') || errorData.detail?.includes('thiết bị')) {
          // Clear device activation data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('device_activated')
            localStorage.removeItem('device_code')
            localStorage.removeItem('device_name')
          }
          // Reload to trigger activation screen
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        }
      }

      throw new ApiError(
        response.status,
        response.statusText,
        errorData,
        errorData.message || errorData.error || errorData.detail
      )
    }

    // Parse JSON response
    return response.json() as Promise<T>
  } catch (error: any) {
    clearTimeout(timeoutId)

    // Handle timeout
    if (error.name === 'AbortError') {
      throw new NetworkError('Request timeout - Server không phản hồi')
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Không thể kết nối đến server - Kiểm tra kết nối mạng')
    }

    // Re-throw API errors
    if (error instanceof ApiError) {
      throw error
    }

    // Unknown errors
    throw new Error(error.message || 'Unknown error occurred')
  }
}

// ============================================
// API FUNCTIONS - Products
// ============================================

export interface FetchProductsParams {
  search?: string
  category?: string
  token?: string
}

export async function fetchProducts(params: FetchProductsParams): Promise<Product[]> {
  const { search, category, token } = params

  const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`)
  if (search) url.searchParams.set('search', search)
  if (category) url.searchParams.set('category', category)

  const data = await apiRequest<any[]>(url.pathname + url.search, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  // Normalize snake_case to camelCase
  return data.map(p => ({
    ...p,
    hourlyPrice: p.hourlyPrice || p.hourly_price,
    timeIntervalValue: p.timeIntervalValue || p.time_interval_value,
    timeIntervalUnit: p.timeIntervalUnit || p.time_interval_unit
  }))
}

export async function fetchProductById(id: number, token?: string): Promise<Product> {
  return apiRequest<Product>(API_ENDPOINTS.PRODUCT_BY_ID(id), {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// ============================================
// API FUNCTIONS - Menus (Categories)
// ============================================

export interface Menu {
  id: number
  name: string
  icon: string
  image?: string | null
  productIds?: number[]
  createdAt?: string
}

export async function fetchMenus(token?: string): Promise<Menu[]> {
  return apiRequest<Menu[]>(API_ENDPOINTS.MENUS, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function fetchMenuById(id: number, token?: string): Promise<Menu> {
  return apiRequest<Menu>(API_ENDPOINTS.MENU_BY_ID(id), {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// ============================================
// API FUNCTIONS - Orders
// ============================================

export interface PosOrderItem {
  id?: number | string
  product_id: number
  qty: number
  price: number
  is_time_based?: boolean
  start_time?: string | null
  end_time?: string | null
  note?: string | null
  product?: any
}

export interface PosOrder {
  id: number | string
  table_id?: number | null
  area_id?: number | null
  table_name?: string | null
  table_number?: number | null
  order_type?: string
  customer_count?: number
  payment_info?: string | null
  status: string
  items: PosOrderItem[]
  total_amount?: number
  created_at?: string
  completed_at?: string | null
}

export interface PosOrderCreatePayload {
  id?: string // Optional frontend ID
  table_id?: number
  area_id?: number
  table_name?: string
  table_number?: number
  order_type?: string
  payment_info?: string
  customer_count?: number
  items: Array<{
    product_id: number
    qty: number
    price: number
    is_time_based?: boolean
    start_time?: string
    end_time?: string
    note?: string
  }>
  status?: string
  created_at?: string
}

export async function createOrder(
  payload: PosOrderCreatePayload,
  token?: string
): Promise<PosOrder> {
  return apiRequest<PosOrder>(API_ENDPOINTS.ORDERS, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function fetchOrders(token?: string): Promise<PosOrder[]> {
  return apiRequest<PosOrder[]>(`${API_ENDPOINTS.ORDERS}?_t=${Date.now()}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function updateOrder(
  orderId: number | string,
  payload: PosOrderCreatePayload,
  token?: string
): Promise<PosOrder> {
  return apiRequest<PosOrder>(`${API_ENDPOINTS.ORDERS}/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function deleteOrder(
  orderId: number | string,
  token?: string
): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`${API_ENDPOINTS.ORDERS}/${orderId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function confirmScoreboardOrder(
  orderId: number | string,
  token?: string
): Promise<PosOrder> {
  return apiRequest<PosOrder>(`${API_ENDPOINTS.ORDERS}/${orderId}/confirm`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// ============================================
// API FUNCTIONS - Authentication
// ============================================


export interface LoginPayload {
  pin: string
  deviceId?: string // Optional now?
}

export interface LoginResponse {
  success: boolean
  access_token: string
  refresh_token: string
  token_type: string
  user?: {
    id: number
    username: string
    full_name: string
    role_name?: string
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  // Use POS Login endpoint
  const response = await apiRequest<LoginResponse>(API_ENDPOINTS.POS_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ pin: payload.pin }), // Send only PIN
    skipAuth: true, // Don't need token yet
  })

  // Backend returns: { access_token, refresh_token, token_type }
  // Response might not have success: true field if using standard OAuth2 format
  // But let's adapt:

  if (response.access_token && typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token)

    // Save user info
    if (response.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user))
    }
  }

  return {
    ...response,
    success: true // Force success if no error thrown
  }
}

export async function logout(token?: string): Promise<void> {
  await apiRequest<void>(API_ENDPOINTS.LOGOUT, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  // Xóa token khỏi storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}

// ============================================
// API FUNCTIONS - Areas & Tables
// ============================================

export async function fetchAreas(): Promise<Area[]> {
  return apiRequest<Area[]>('/api/areas', {
    method: 'GET',
  })
}

export async function fetchAreaById(id: number): Promise<AreaDetail> {
  return apiRequest<AreaDetail>(`/api/areas/${id}`, {
    method: 'GET',
  })
}

// ============================================
// API FUNCTIONS - Device Activation (POS)
// ============================================

export interface DeviceActivationPayload {
  device_code: string
  device_id?: string
  device_type?: string
  device_os?: string
  device_app_version?: string
}

export interface DeviceActivationResponse {
  success: boolean
  device_id?: number
  device_name?: string
  message?: string
}

export async function activateDevice(
  payload: DeviceActivationPayload
): Promise<DeviceActivationResponse> {
  return apiRequest<DeviceActivationResponse>('/api/devices/activate', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true, // Không cần token cho activation
  })
}

export async function checkDeviceHealth(): Promise<void> {
  // Call health endpoint. If 403, apiRequest will auto-logout.
  // Device code is auto-added by apiRequest via X-Device-Code header
  await apiRequest(`/health?_t=${Date.now()}`, {
    method: 'GET',
    skipAuth: true  // Don't need user token, just device code (auto-added)
  })
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Kiểm tra xem đã login chưa
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(TOKEN_STORAGE_KEY)
}

/**
 * Lấy token hiện tại
 */
export function getCurrentToken(): string | null {
  return getAuthToken()
}

// ============================================
// API FUNCTIONS - Attendance Timesheet
// ============================================

export interface AttendanceRecord {
  id: number
  user_id: number
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: 'present' | 'late' | 'absent' | 'early_checkout'
  notes: string | null
  user: {
    id: number
    full_name: string
    username: string
  }
  work_schedule: {
    start_time: string
    end_time: string
  }
}

export interface TimesheetResponse {
  total: number
  page: number
  page_size: number
  items: AttendanceRecord[]
}

export async function fetchTodayAttendance(): Promise<AttendanceRecord[]> {
  const data = await apiRequest<TimesheetResponse>(
    `/api/attendance/timesheet?page_size=10`,
    { method: 'GET' }
  )
  return data.items || []
}

// ============================================
// API FUNCTIONS - QR Attendance (Chấm công)
// ============================================

export interface QrTokenResponse {
  success: boolean
  access_token: string
  expires_at: string
  qr_url: string
  ttl_seconds: number
  server_time?: string
}

/**
 * Tạo mã QR chấm công (gọi internal API, cần INTERNAL_API_KEY)
 */
export async function createQrAttendanceToken(
  deviceId: string,
  purpose: string = 'attendance_access',
  ttlSeconds: number = 60,
  internalApiKey: string = ''
): Promise<QrTokenResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Internal-API-Key': internalApiKey,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}/api/internal/qr-access/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        device_id: deviceId,
        purpose,
        ttl_seconds: ttlSeconds,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        response.statusText,
        errorData,
        errorData.detail || errorData.message || 'Không thể tạo mã QR'
      )
    }

    const result = await response.json()

    // Get server time from Date header for clock sync
    const serverDate = response.headers.get('Date')
    if (serverDate) {
      result.server_time = serverDate
    }

    return result as QrTokenResponse
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new NetworkError('Request timeout - Server không phản hồi')
    }
    if (error instanceof ApiError) throw error
    throw new Error(error.message || 'Không thể tạo mã QR chấm công')
  }
}

/**
 * Validate QR token (kiểm tra xem token đã được quét/sử dụng chưa)
 */
export interface QrValidateResponse {
  valid: boolean
  message: string
  error_code?: string
  redirect_url?: string
  expires_in_seconds?: number
}

export async function validateQrToken(accessToken: string): Promise<QrValidateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/qr-access/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return { valid: false, message: 'Lỗi server', error_code: 'SERVER_ERROR' }
    }

    return await response.json() as QrValidateResponse
  } catch {
    return { valid: false, message: 'Không thể kết nối', error_code: 'NETWORK_ERROR' }
  }
}

/**
 * Check QR token attendance status (internal API)
 * Returns: pending | scanned | completed | expired | not_found
 */
export interface QrTokenStatusResponse {
  status: 'pending' | 'scanned' | 'completed' | 'expired' | 'not_found'
  used_by_pin?: string
}

export async function checkQrTokenStatus(
  accessToken: string,
  internalApiKey: string
): Promise<QrTokenStatusResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/internal/qr-access/token-status/${accessToken}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-API-Key': internalApiKey,
        },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!response.ok) {
      return { status: 'not_found' }
    }

    return await response.json() as QrTokenStatusResponse
  } catch {
    return { status: 'not_found' }
  }
}

// ============================================
// API FUNCTIONS - Switches
// ============================================

export interface SwitchItem {
  id: number;
  name: string;
  switch_type: string;
  description: string | null;
  device_code: string | null;
  ip_address: string | null;
  port: number | null;
  area_name: string | null;
  is_active: boolean;
  sort_order: number;
  schedule_on: string | null;
  schedule_off: string | null;
  created_at: string;
}

export async function fetchSwitches(token?: string): Promise<SwitchItem[]> {
  return apiRequest<SwitchItem[]>('/api/switches', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function toggleSwitch(id: number, isActive: boolean, token?: string): Promise<SwitchItem> {
  return apiRequest<SwitchItem>(`/api/switches/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
