/**
 * Cart Header — order type selector, table picker trigger, and more-actions menu.
 * Extracted from CashierScreen.tsx for maintainability.
 */
import {
    EXISTING_ORDER_MENU_ITEMS,
    DineInIcon,
    TakeawayIcon,
    UndoIcon,
} from '../cashier'

export interface CartHeaderProps {
    orderType: 'dine-in' | 'takeaway'
    showOrderTypeDropdown: boolean
    selectedTable: string | null
    initialOrder: any
    showMoreMenu: boolean
    currentUser: any
    onToggleOrderTypeDropdown: () => void
    onSetOrderType: (type: 'dine-in' | 'takeaway') => void
    onOpenTablePicker: () => void
    onToggleMoreMenu: () => void
    onResetCart: () => void
}

export default function CartHeader({
    orderType, showOrderTypeDropdown, selectedTable, initialOrder,
    showMoreMenu, currentUser,
    onToggleOrderTypeDropdown, onSetOrderType, onOpenTablePicker,
    onToggleMoreMenu, onResetCart,
}: CartHeaderProps) {
    return (
        <div style={{ height: 50, background: '#f0f2f5', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'stretch' }}>
            {/* Order Type Selector */}
            <div
                style={{
                    width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    borderRight: '1px solid #ddd', cursor: 'pointer',
                    background: showOrderTypeDropdown ? '#0070d2' : '#f0f2f5',
                }}
                onClick={onToggleOrderTypeDropdown}
            >
                {orderType === 'dine-in'
                    ? <DineInIcon color={showOrderTypeDropdown ? '#fff' : '#0091ff'} />
                    : <TakeawayIcon color={showOrderTypeDropdown ? '#fff' : '#ff7043'} />
                }
                <span style={{ fontSize: 10, color: showOrderTypeDropdown ? '#fff' : '#6b7280' }}>▼</span>
            </div>

            {/* Order Type Dropdown */}
            {showOrderTypeDropdown && (
                <div style={{
                    position: 'absolute', top: 55, left: 5, background: '#fff',
                    border: '1px solid #ddd', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000, width: 220, padding: '8px 0',
                }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 15px', cursor: 'pointer', background: orderType === 'dine-in' ? '#f5f5f5' : 'transparent' }}
                        onClick={() => onSetOrderType('dine-in')}
                    >
                        <DineInIcon size={24} />
                        <span style={{ fontSize: 16, color: '#333' }}>Ăn tại bàn</span>
                    </div>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 15px', cursor: 'pointer', background: orderType === 'takeaway' ? '#f5f5f5' : 'transparent' }}
                        onClick={() => onSetOrderType('takeaway')}
                    >
                        <TakeawayIcon size={24} />
                        <span style={{ fontSize: 16, color: '#333' }}>Mang đi</span>
                    </div>
                </div>
            )}

            {/* Table Selection */}
            <div
                style={{
                    flex: 1, display: 'flex', alignItems: 'center', padding: '0 15px',
                    borderRight: '1px solid #ddd',
                    cursor: initialOrder ? 'default' : 'pointer', gap: 10,
                }}
                onClick={() => !initialOrder && orderType === 'dine-in' && onOpenTablePicker()}
            >
                <span style={{ fontSize: 16, color: selectedTable ? '#0091ff' : '#374151', flex: 1, fontWeight: 'normal' }}>
                    {orderType === 'dine-in' ? (selectedTable || 'Chọn bàn') : 'Số thứ tự...'}
                </span>
                {!initialOrder && <span style={{ fontSize: 18, color: '#9ca3af' }}>〉</span>}
            </div>

            {/* More Actions Button */}
            <div
                style={{
                    width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative', height: '100%',
                    background: (!initialOrder || showMoreMenu) ? '#007acc' : 'transparent',
                    borderLeft: '1px solid #ddd',
                }}
                onClick={(e) => { e.stopPropagation(); onToggleMoreMenu() }}
            >
                {/* Three Dots */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 5, height: 5, background: (!initialOrder || showMoreMenu) ? '#fff' : '#0091ff', borderRadius: '50%' }} />
                    ))}
                </div>

                {/* More Menu Dropdown */}
                {showMoreMenu && (
                    <div
                        style={{
                            position: 'absolute', top: '100%', right: 0, width: initialOrder ? 280 : 200,
                            background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            borderRadius: 4, zIndex: 1000, color: '#333', marginTop: 5, overflow: 'hidden',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {initialOrder ? (
                            <>
                                {EXISTING_ORDER_MENU_ITEMS.map((item, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex', alignItems: 'center', padding: '10px 15px', gap: 12,
                                            background: item.highlight ? '#f1f5f9' : 'transparent',
                                            borderBottom: i === 7 ? '1px solid #eee' : 'none',
                                            cursor: 'pointer', fontSize: 14,
                                        }}
                                        onMouseEnter={e => !item.highlight && (e.currentTarget.style.background = '#f8fafc')}
                                        onMouseLeave={e => !item.highlight && (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <span style={{ fontSize: 18, color: '#475569', width: 20, textAlign: 'center' }}>{item.icon}</span>
                                        <span style={{ flex: 1 }}>
                                            {item.text.split('').map((char, idx) => (
                                                <span key={idx} style={{ textDecoration: idx === item.underlineIdx ? 'underline' : 'none' }}>{char}</span>
                                            ))}
                                        </span>
                                    </div>
                                ))}

                                <div style={{ padding: '12px 15px', fontSize: 13, background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: 4 }}>
                                        <span>Tên đơn</span>
                                        <span style={{ color: '#1e293b', fontWeight: 500 }}>{initialOrder?.orderNumber || initialOrder?.id || '---'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                        <span>Tạo đơn</span>
                                        <span style={{ color: '#1e293b', fontWeight: 500 }}>{initialOrder?.createdBy?.full_name || currentUser?.full_name || 'Nhân viên POS'}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div
                                style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', gap: 12, cursor: 'pointer', fontSize: 14 }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                onClick={onResetCart}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', width: 20 }}>
                                    <UndoIcon />
                                </span>
                                <span style={{ flex: 1 }}><u>H</u>oàn tác</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
