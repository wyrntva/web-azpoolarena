import { type Product } from '../../types'

// ============================================
// CART TYPES
// ============================================

/** Represents a single line item in the cashier cart */
export interface CartLine {
    /** Unique identifier for this cart line */
    id: string
    /** The product being ordered */
    product: Product
    /** Quantity of the product */
    qty: number
    /** Whether this item is billed by time (e.g., pool table rental) */
    isTimeBased?: boolean
    /** ISO string: when time-based billing started */
    startTime?: string
    /** ISO string: when time-based billing ended (undefined = still running) */
    endTime?: string
    /** Optional note for this line item */
    note?: string
}

// ============================================
// CASHIER SCREEN PROPS
// ============================================

/** Props for the CashierScreen component */
export interface CashierScreenProps {
    /** Callback to lock/exit the cashier screen */
    onLock: () => void
    /** Pre-selected table name (e.g., "Khu A - Bàn 1") */
    initialTable?: string | null
    /** Pre-selected area ID */
    initialAreaId?: number
    /** Callback when an order is saved (new or updated) */
    onSaveOrder?: (newOrder: any) => void
    /** Callback when an order is deleted */
    onDeleteOrder?: () => void
    /** Existing order data when editing */
    initialOrder?: any
    /** All current orders (used for table status mapping) */
    orders?: any[]
}

// ============================================
// ORDER ACTION MENU ITEMS
// ============================================

export interface OrderMenuItem {
    icon: string
    text: string
    underlineIdx: number
    highlight?: boolean
    onClick?: () => void
}

/** Menu items shown when editing an existing order */
export const EXISTING_ORDER_MENU_ITEMS: OrderMenuItem[] = [
    { icon: '🖨️', text: 'Gửi thông tin tới bar / bếp', underlineIdx: 0 },
    { icon: '📇', text: 'In lại tem', underlineIdx: 0 },
    { icon: '📋', text: 'In phiếu kiểm đồ', underlineIdx: 0 },
    { icon: '➕', text: 'Tạo đơn mới cùng bàn', underlineIdx: 0 },
    { icon: '✂️', text: 'Tách đơn', underlineIdx: 0, highlight: true },
    { icon: '🖇️', text: 'Gộp đơn', underlineIdx: 0 },
    { icon: '🚫', text: 'Hủy đơn', underlineIdx: 0 },
    { icon: '🔄', text: 'Thay đổi bàn', underlineIdx: 0 },
]
