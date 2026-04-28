import { type Product } from '../types'

// ============================================
// TIME PARSING HELPERS
// ============================================

/**
 * Ensures an ISO date string has a 'Z' suffix for UTC parsing consistency.
 * The backend sometimes returns timestamps without the trailing 'Z'.
 */
export function ensureUTCSuffix(isoString: string): string {
    return isoString.endsWith('Z') ? isoString : `${isoString}Z`
}

/**
 * Safely parses an ISO date string to epoch milliseconds.
 * Handles missing 'Z' suffix automatically.
 */
export function parseTimestamp(isoString: string): number {
    return new Date(ensureUTCSuffix(isoString)).getTime()
}

// ============================================
// TIME-BASED PRICE CALCULATION
// ============================================

export interface TimePriceInput {
    /** ISO string of when the session started */
    startTime: string
    /** ISO string of when the session ended (undefined = still running) */
    endTime?: string
    /** Fallback "now" timestamp in milliseconds (for running sessions) */
    nowMs: number
    /** Price per time block (e.g., price per 3 minutes) */
    pricePerBlock: number
    /** Duration of each block in minutes (e.g., 3 = every 3 minutes) */
    blockIntervalMinutes: number
    /** Number of items (quantity multiplier) */
    quantity: number
}

export interface TimePriceResult {
    /** Total price for this line */
    totalPrice: number
    /** Elapsed time in seconds */
    elapsedSeconds: number
    /** Number of billed blocks */
    numberOfBlocks: number
}

/**
 * Calculates the price for a time-based product line.
 *
 * Billing rule: Any partial block is rounded UP (e.g., 1 second = 1 full block).
 * Minimum charge is always 1 block.
 */
export function calculateTimeBasedPrice(input: TimePriceInput): TimePriceResult {
    const startMs = parseTimestamp(input.startTime)
    const endMs = input.endTime ? parseTimestamp(input.endTime) : input.nowMs

    const elapsedSeconds = Math.max(0, (endMs - startMs) / 1000)
    const blockDurationSeconds = input.blockIntervalMinutes * 60
    const numberOfBlocks = Math.max(1, Math.ceil(elapsedSeconds / blockDurationSeconds))
    const totalPrice = numberOfBlocks * input.pricePerBlock * input.quantity

    return { totalPrice, elapsedSeconds, numberOfBlocks }
}

/**
 * Creates a TimePriceInput from a cart line's product and time data.
 * This is a convenience wrapper used throughout the cashier screen.
 */
export function buildTimePriceInput(
    product: Product,
    startTime: string,
    endTime: string | undefined,
    nowMs: number,
    quantity: number
): TimePriceInput {
    return {
        startTime,
        endTime,
        nowMs,
        pricePerBlock: product.hourlyPrice || 0,
        blockIntervalMinutes: product.timeIntervalValue || 1,
        quantity,
    }
}

// ============================================
// ELAPSED TIME FORMATTING
// ============================================

/**
 * Formats elapsed seconds into a human-readable Vietnamese duration string.
 * Example: "1 ngày 1 giờ 23 phút 45 giây"
 */
export function formatElapsedDuration(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400)
    if (days > 0) {
        return `${days} ngày`
    }

    const remainingSeconds = totalSeconds % 86400

    const hours = Math.floor(remainingSeconds / 3600)
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
    const seconds = Math.floor(remainingSeconds % 60)

    const parts: string[] = []
    if (hours > 0) parts.push(`${hours} giờ`)
    if (minutes > 0 || hours > 0) parts.push(`${minutes} phút`)
    parts.push(`${seconds} giây`)

    return parts.join(' ')
}

/**
 * Formats elapsed seconds into DD HH:MM:SS format if over 24h.
 * Used for table occupancy duration display.
 */
export function formatElapsedHHMMSS(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400)
    if (days > 0) {
        return `${days} ngày`
    }

    const remainingSeconds = totalSeconds % 86400

    const hh = Math.floor(remainingSeconds / 3600)
    const mm = Math.floor((remainingSeconds % 3600) / 60)
    const ss = remainingSeconds % 60

    return [
        String(hh).padStart(2, '0'),
        String(mm).padStart(2, '0'),
        String(ss).padStart(2, '0'),
    ].join(':')
}

/**
 * Formats a timestamp to "HH:MM DD/MM/YYYY" in local time.
 * Returns empty string if input is falsy.
 */
export function formatDateTimeLocal(isoString: string | undefined | null): string {
    if (!isoString) return ''
    const date = new Date(ensureUTCSuffix(isoString))
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    const dd = date.getDate().toString().padStart(2, '0')
    const mo = (date.getMonth() + 1).toString().padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${hh}:${mm} ${dd}/${mo}/${yyyy}`
}
