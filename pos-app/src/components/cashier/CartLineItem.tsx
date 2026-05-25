/**
 * Cart Line Item — renders a single line in the cart with price, quantity controls, and time-based details.
 * Extracted from CashierScreen.tsx for maintainability.
 */
import { type CartLine, ClockIcon, InfoCircleIcon } from '../cashier'
import {
    calculateTimeBasedPrice,
    buildTimePriceInput,
    formatElapsedDuration,
    formatDateTimeLocal,
} from '../../utils/timePrice'

// ============================================
// SHARED STYLES (for action buttons)
// ============================================

export const actionButtonStyle: React.CSSProperties = {
    border: '1px solid #d9d9d9', background: '#fff', color: '#333',
    borderRadius: 4, width: 60, height: 38, fontSize: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', lineHeight: 1,
}

export const actionButtonStyleFlex: React.CSSProperties = {
    border: '1px solid #d9d9d9', background: '#fff', color: '#333',
    borderRadius: 4, flex: 1, height: 38, fontSize: 13, cursor: 'pointer',
}

// ============================================
// TIME-BASED DETAILS SUB-COMPONENT
// ============================================

function TimeBasedDetails({ line, isSelected, now, initialOrderCreatedAt }: {
    line: CartLine; isSelected: boolean; now: Date; initialOrderCreatedAt?: string
}) {
    const startTimeStr = line.startTime || initialOrderCreatedAt || new Date().toISOString()
    const priceInput = buildTimePriceInput(line.product, startTimeStr, line.endTime, now.getTime(), line.qty)
    const { elapsedSeconds } = calculateTimeBasedPrice(priceInput)
    const durationText = formatElapsedDuration(elapsedSeconds)

    return (
        <div style={{ fontSize: 12, color: isSelected ? 'rgba(255,255,255,0.9)' : '#000', marginTop: 4, paddingLeft: 28, lineHeight: '1.6' }}>
            <div>Giờ vào: {formatDateTimeLocal(line.startTime || initialOrderCreatedAt)}</div>
            <div style={{ color: isSelected ? '#fff' : '#f59e0b' }}>
                Tạm tính đến: {formatDateTimeLocal(line.endTime || now.toISOString())}
            </div>
            <div>Đã sử dụng: {durationText}</div>
        </div>
    )
}

// ============================================
// CART LINE ITEM COMPONENT
// ============================================

export interface CartLineItemProps {
    line: CartLine
    index: number
    isSelected: boolean
    now: Date
    initialOrderCreatedAt?: string
    priceDisplay: string
    onSelect: () => void
    onIncrement: () => void
    onDecrement: () => void
    onRemove: () => void
    onEdit: () => void
}

export default function CartLineItem({
    line, index, isSelected, now, initialOrderCreatedAt, priceDisplay,
    onSelect, onIncrement, onDecrement, onRemove, onEdit,
}: CartLineItemProps) {
    return (
        <div
            onClick={onSelect}
            style={{
                background: isSelected ? '#0091ff' : '#fff',
                color: isSelected ? '#fff' : '#000',
                padding: '10px 12px', borderBottom: '1px solid #eee', cursor: 'pointer',
            }}
        >
            {/* Main Row: Number + Name + Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 14 }}>{String(index + 1).padStart(2, '0')}.</span>
                    {line.isTimeBased && (
                        <span style={{ color: isSelected ? '#fff' : '#0091ff', display: 'flex', alignItems: 'center' }}>
                            <ClockIcon />
                        </span>
                    )}
                    <span style={{ fontWeight: 'bold', fontSize: 14, textTransform: line.isTimeBased ? 'uppercase' : 'none' }}>
                        {line.product.name}
                    </span>
                    {line.isTimeBased && (
                        <span style={{
                            background: isSelected ? '#0091ff' : '#fff',
                            color: isSelected ? '#fff' : '#0091ff',
                            borderRadius: '50%', width: 16, height: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginLeft: -4, transform: 'translateY(-3px)',
                        }}>
                            <InfoCircleIcon />
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {!line.isTimeBased && (
                        <span style={{ fontWeight: 'bold', fontSize: 14, width: 40, textAlign: 'center', marginRight: 40 }}>{line.qty}</span>
                    )}
                    <span style={{ fontWeight: 'bold', fontSize: 14, textAlign: 'right', minWidth: 80 }}>
                        {priceDisplay}<span style={{ textDecoration: 'underline' }}>đ</span>
                    </span>
                </div>
            </div>

            {/* Time-based Details */}
            {line.isTimeBased && (
                <TimeBasedDetails
                    line={line}
                    isSelected={isSelected}
                    now={now}
                    initialOrderCreatedAt={initialOrderCreatedAt}
                />
            )}

            {/* Regular Item Subtitle */}
            {!line.isTimeBased && (
                <div style={{ fontSize: 12, color: isSelected ? 'rgba(255,255,255,0.9)' : '#000', marginTop: 4, paddingLeft: 28 }}>
                    Giá thường &nbsp;&nbsp;&nbsp; {line.product.price.toLocaleString()}<span style={{ textDecoration: 'underline' }}>đ</span>
                </div>
            )}

            {/* Action Buttons (when selected) */}
            {isSelected && (
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                    {!line.isTimeBased && (
                        <>
                            <button onClick={onDecrement} style={actionButtonStyle}>−</button>
                            <button onClick={onIncrement} style={actionButtonStyle}>+</button>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (line.isTimeBased) onEdit() }} style={actionButtonStyleFlex}>Sửa</button>
                    <button style={actionButtonStyleFlex}>Giảm giá</button>
                    <button onClick={(e) => { e.stopPropagation(); onRemove() }} style={{ ...actionButtonStyleFlex, color: 'red' }}>Xoá</button>
                </div>
            )}
        </div>
    )
}
