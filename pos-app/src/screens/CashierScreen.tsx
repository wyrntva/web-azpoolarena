import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import '../styles/screens/cashier.css'
import { getCurrentUser, fetchMenus, fetchProducts, confirmScoreboardOrder, type Menu } from '../services/api'

import { type Product } from '../types'
import {
    calculateTimeBasedPrice,
    buildTimePriceInput,
    formatElapsedDuration,
    formatDateTimeLocal,
} from '../utils/timePrice'
import {
    type CartLine,
    type CashierScreenProps,
    CashierFooter,
    TablePickerModal,
    TimeEditModal,
    UnsavedChangesModal,
    ProductCard,
    CartHeader,
    CartLineItem,
    MinimizeIcon,
    CloseIcon,
    ChevronUpIcon,
    ChevronDownIcon,
} from '../components/cashier'
import logoPoolarena from '../assets/logo-main.png'

// ============================================
// MAIN COMPONENT
// ============================================

export default function CashierScreen(props: CashierScreenProps) {
    // --- Search & Menu State ---
    const [searchQuery, setSearchQuery] = useState('')
    const [menus, setMenus] = useState<Menu[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [selectedCategory, setSelectedCategory] = useState<Menu | null>(null)
    const [menuScrollOffset, setMenuScrollOffset] = useState(0)
    const [loadingMenus, setLoadingMenus] = useState(false)
    const [loadingProducts, setLoadingProducts] = useState(false)

    // --- Cart State ---
    const [cart, setCart] = useState<CartLine[]>(() => {
        const items = props.initialOrder?.items || []
        const mergedMap: Record<string, CartLine> = {}
        const result: CartLine[] = []
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.isTimeBased) {
                result.push({ ...item })
            } else {
                const key = `${item.product?.id}_${item.price}`
                if (mergedMap[key]) {
                    mergedMap[key].qty += item.qty
                } else {
                    const newItem = { ...item }
                    mergedMap[key] = newItem
                    result.push(newItem)
                }
            }
        }
        return result
    })
    const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

    // --- User & Time State ---
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [now, setNow] = useState(() => new Date())

    // --- Order Meta State ---
    const [customerCount, setCustomerCount] = useState(1)
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in')
    const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false)
    const [selectedTable, setSelectedTable] = useState<string | null>(props.initialTable || null)
    const [selectedTableId, setSelectedTableId] = useState<number | undefined>(props.initialOrder?.tableId)
    const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>(props.initialOrder?.areaId)

    // --- Modal Visibility ---
    const [showTablePicker, setShowTablePicker] = useState(false)
    const [showTimeEditModal, setShowTimeEditModal] = useState(false)
    const [editingLine, setEditingLine] = useState<CartLine | null>(null)
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false)
    const [showMoreMenu, setShowMoreMenu] = useState(false)

    // ============================================
    // DERIVED STATE
    // ============================================

    const timeText = useMemo(() => {
        const h12 = now.getHours() % 12 || 12
        const mm = String(now.getMinutes()).padStart(2, '0')
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM'
        return `${h12}:${mm} ${ampm}`
    }, [now])

    const dateText = useMemo(() => {
        const dd = String(now.getDate()).padStart(2, '0')
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const yyyy = now.getFullYear()
        return `${dd}/${mm}/${yyyy}`
    }, [now])

    /** Snapshot of initial cart for dirty-checking */
    const initialCartJSON = useMemo(() => {
        return JSON.stringify((props.initialOrder?.items || []).map((item: any) => ({
            id: item.id,
            productId: item.product.id,
            qty: item.qty,
            startTime: item.startTime,
            endTime: item.endTime,
            note: item.note,
        })))
    }, [props.initialOrder])

    const initialTableVal = props.initialTable || null

    /** Whether the cart or table has been modified since opening */
    const isDirty = useMemo(() => {
        const currentCartJSON = JSON.stringify(cart.map(item => ({
            id: item.id,
            productId: item.product.id,
            qty: item.qty,
            startTime: item.startTime,
            endTime: item.endTime,
            note: item.note,
        })))
        return currentCartJSON !== initialCartJSON || selectedTable !== initialTableVal
    }, [cart, selectedTable, initialCartJSON, initialTableVal])

    /** Products filtered by selected category and search query */
    const filteredProducts = useMemo(() => {
        let result = selectedCategory
            ? products.filter((product) => {
                if (selectedCategory.productIds) {
                    return selectedCategory.productIds.includes(product.id)
                }
                return false
            })
            : products

        const normalizedQuery = searchQuery.trim().toLowerCase()
        if (normalizedQuery) {
            result = result.filter((product) => {
                const searchableText = `${product.name} ${product.barcode || ''}`.toLowerCase()
                return searchableText.includes(normalizedQuery)
            })
        }

        return result
    }, [searchQuery, selectedCategory, products])

    /** Total price for all items in the cart */
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, line) => {
            if (line.isTimeBased) {
                const startTimeStr = line.startTime || props.initialOrder?.createdAt || new Date().toISOString()
                const priceInput = buildTimePriceInput(line.product, startTimeStr, line.endTime, now.getTime(), line.qty)
                const { totalPrice } = calculateTimeBasedPrice(priceInput)
                return sum + totalPrice
            }
            return sum + line.product.price * line.qty
        }, 0)
    }, [cart, now, props.initialOrder?.createdAt])

    // ============================================
    // EFFECTS
    // ============================================

    /** Sync initial props to state */
    useEffect(() => {
        if (props.initialTable) setSelectedTable(props.initialTable)
        if (props.initialAreaId) setSelectedAreaId(props.initialAreaId)
        if (props.initialOrder?.type) {
            setOrderType(props.initialOrder.type === 'table' ? 'dine-in' : 'takeaway')
        }
    }, [props.initialTable, props.initialOrder, props.initialAreaId])

    /** Load user, menus, and start clock on mount */
    useEffect(() => {
        const user = getCurrentUser()
        if (user) setCurrentUser(user)

        loadMenusAndProducts()

        const menuRefreshInterval = setInterval(() => loadMenusAndProducts(true), 30000)
        const clockInterval = setInterval(() => setNow(new Date()), 1000)

        return () => {
            clearInterval(clockInterval)
            clearInterval(menuRefreshInterval)
        }
    }, [])

    /** Keep cart products in sync with latest product data */
    useEffect(() => {
        if (products.length === 0) return

        setCart(prev => {
            let hasChanges = false
            const updated = prev.map(line => {
                const freshProduct = products.find(p => p.id === line.product.id)
                if (freshProduct && (
                    freshProduct.hourlyPrice !== line.product.hourlyPrice ||
                    freshProduct.timeIntervalValue !== line.product.timeIntervalValue
                )) {
                    hasChanges = true
                    return { ...line, product: freshProduct }
                }
                return line
            })
            return hasChanges ? updated : prev
        })
    }, [products])

    /** Global keyboard shortcuts (F3 for save, ESC for exit) */
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const anyModalOpen = showTimeEditModal || showTablePicker || showUnsavedChangesModal
            if (anyModalOpen) return

            if (e.key === 'Escape') {
                handleExit()
            } else if (e.key === 'F3') {
                e.preventDefault()
                handleSaveOrder()
            }
        }

        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [isDirty, showTimeEditModal, showTablePicker, showUnsavedChangesModal, cart, selectedTable])

    // ============================================
    // DATA LOADING
    // ============================================

    async function loadMenusAndProducts(isBackgroundUpdate = false) {
        try {
            if (!isBackgroundUpdate) setLoadingMenus(true)
            const menusData = await fetchMenus()
            setMenus(menusData)
            if (menusData.length > 0) {
                setSelectedCategory(prev => {
                    if (prev) {
                        const stillExists = menusData.find(m => m.id === prev.id)
                        return stillExists || menusData[0]
                    }
                    return menusData[0]
                })
            } else {
                setSelectedCategory(null)
            }
        } catch (error) {
            console.error('Failed to load menus:', error)
        } finally {
            if (!isBackgroundUpdate) setLoadingMenus(false)
        }

        try {
            if (!isBackgroundUpdate) setLoadingProducts(true)
            const productsData = await fetchProducts({})
            setProducts(productsData)
        } catch (error) {
            console.error('Failed to load products:', error)
        } finally {
            if (!isBackgroundUpdate) setLoadingProducts(false)
        }
    }

    // ============================================
    // CART ACTIONS
    // ============================================

    function addToCart(product: Product) {
        const isTimeBased = product.type === 'Tính tiền theo thời gian'
        const newLineId = `${Date.now()}-${Math.random()}`

        if (isTimeBased) {
            setCart(prev => [...prev, {
                id: newLineId,
                product,
                qty: 1,
                isTimeBased: true,
                startTime: new Date().toISOString(),
            }])
            setSelectedLineId(newLineId)
            return
        }

        setCart(prev => {
            const existingLine = prev.find(line => line.product.id === product.id && !line.isTimeBased)
            if (existingLine) {
                setSelectedLineId(existingLine.id)
                return prev.map(line => line.id === existingLine.id ? { ...line, qty: line.qty + 1 } : line)
            }
            setSelectedLineId(newLineId)
            return [...prev, { id: newLineId, product, qty: 1, isTimeBased: false }]
        })
    }

    function incrementQuantity(lineId: string) {
        setSelectedLineId(lineId)
        setCart(prev => prev.map(line => line.id === lineId ? { ...line, qty: line.qty + 1 } : line))
    }

    function decrementQuantity(lineId: string) {
        setSelectedLineId(lineId)
        setCart(prev => prev
            .map(line => line.id === lineId ? { ...line, qty: Math.max(1, line.qty - 1) } : line)
            .filter(line => line.qty > 0)
        )
    }

    function removeCartLine(lineId: string) {
        setCart(prev => prev.filter(line => line.id !== lineId))
    }

    function resetCart() {
        setCart([])
        setSelectedTable(null)
        setSelectedTableId(undefined)
        setSelectedAreaId(undefined)
        setShowMoreMenu(false)
    }

    // ============================================
    // ORDER ACTIONS
    // ============================================

    function handleExit() {
        if (isDirty) {
            setShowUnsavedChangesModal(true)
        } else {
            props.onLock()
        }
    }

    function handleSaveOrder() {
        // Empty cart + existing order = delete order
        if (cart.length === 0) {
            if (props.initialOrder && props.onDeleteOrder) {
                props.onDeleteOrder()
            }
            return
        }

        // No table selected = open table picker
        if (!selectedTable) {
            setShowTablePicker(true)
            return
        }

        const tableNameMatch = selectedTable.match(/Bàn (\d+)/)
        const tableNumber = tableNameMatch ? parseInt(tableNameMatch[1]) : 0
        const hasTimeBasedItems = cart.some(line => line.isTimeBased)

        const orderPayload = {
            id: props.initialOrder?.id || `order-${Date.now()}`,
            type: 'table',
            tableId: selectedTableId,
            areaId: selectedAreaId,
            tableNumber,
            tableName: selectedTable,
            createdAt: props.initialOrder?.createdAt || new Date().toISOString(),
            paymentInfo: hasTimeBasedItems ? 'T.tiền theo giờ' : `${Math.floor(cartTotal).toLocaleString()}₫`,
            status: 'dine-in',
            items: cart,
        }

        props.onSaveOrder?.(orderPayload)
    }

    function handleCheckout() {
        if (!cart.length) return
        alert(`(Demo) Tạo đơn thành công!\nTổng: ${cartTotal.toLocaleString()} VND`)
        setCart([])
    }

    // ============================================
    // TIME EDIT MODAL HANDLERS
    // ============================================

    function openTimeEditModal(line: CartLine) {
        setEditingLine({ ...line })
        setShowTimeEditModal(true)
    }

    function handleTimeEditSave(lineId: string, updates: { startTime?: string; endTime?: string; note?: string }) {
        setCart(prev => prev.map(line =>
            line.id === lineId
                ? { ...line, startTime: updates.startTime, endTime: updates.endTime, note: updates.note }
                : line
        ))
        setShowTimeEditModal(false)
        setEditingLine(null)
    }

    // ============================================
    // HELPER: Calculate line price for display
    // ============================================

    function getLinePriceDisplay(line: CartLine): string {
        if (line.isTimeBased) {
            const startTimeStr = line.startTime || props.initialOrder?.createdAt || new Date().toISOString()
            const priceInput = buildTimePriceInput(line.product, startTimeStr, line.endTime, now.getTime(), line.qty)
            const { totalPrice } = calculateTimeBasedPrice(priceInput)
            return Math.floor(totalPrice).toLocaleString()
        }
        return (line.product.price * line.qty).toLocaleString()
    }

    // ============================================
    // MENU PAGINATION
    // ============================================

    const VISIBLE_MENU_COUNT = 7
    const visibleMenus = menus.slice(menuScrollOffset, menuScrollOffset + VISIBLE_MENU_COUNT)
    const emptyMenuSlots = VISIBLE_MENU_COUNT - visibleMenus.length
    const canScrollUp = menuScrollOffset > 0
    const canScrollDown = menuScrollOffset + VISIBLE_MENU_COUNT < menus.length

    // ============================================
    // RENDER
    // ============================================

    const userName = currentUser?.full_name || 'Nhân viên POS'
    const hasCartItems = cart.length > 0

    return (
        <div className='homeScreen' style={{ background: '#030033' }}>

            {/* --- SYSTEM HEADER --- */}
            <header className='homeHeader'>
                <div className='homeHeaderLeft'>
                    <div className='sapoLogo'>
                        <img src={logoPoolarena} alt="POOLARENA" />
                    </div>
                </div>
                <div className='homeHeaderRight'>
                    <div className='iconBtn'>
                        <MinimizeIcon />
                    </div>
                    <div className='iconBtn' onClick={handleExit}>
                        <CloseIcon />
                    </div>
                </div>
            </header>

            {/* --- CONTENT BODY --- */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#030033' }}>

                {/* LEFT & CENTER: Menu Sidebar + Product Grid */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* TOOLBAR */}
                    <div style={{ height: 50, background: '#030033', display: 'flex', alignItems: 'center', padding: '0 4px 0 4px', gap: 4 }}>
                        {/* Menu Scroll Buttons */}
                        <div style={{ display: 'flex', background: 'transparent', border: 'none', gap: 1, height: '100%' }}>
                            <button
                                className='headerBtn iconOnly'
                                onClick={() => setMenuScrollOffset(Math.max(0, menuScrollOffset - VISIBLE_MENU_COUNT))}
                                disabled={!canScrollUp}
                                style={{
                                    border: 'none', height: '100%', width: 70, background: '#fff',
                                    color: '#333', borderRadius: 0, borderTopLeftRadius: 8,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: canScrollUp ? 'pointer' : 'not-allowed',
                                }}
                            >
                                <ChevronUpIcon />
                            </button>
                            <button
                                className='headerBtn iconOnly'
                                onClick={() => setMenuScrollOffset(menuScrollOffset + VISIBLE_MENU_COUNT)}
                                disabled={!canScrollDown}
                                style={{
                                    border: 'none', height: '100%', width: 70, background: '#fff',
                                    color: '#333', borderRadius: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: canScrollDown ? 'pointer' : 'not-allowed',
                                }}
                            >
                                <ChevronDownIcon />
                            </button>
                        </div>

                        {/* Customer Bar */}
                        <div className='customerBar' style={{ background: '#fff', width: 700, flex: 'none', height: '100%', border: '1px solid #d9d9d9', color: '#333', borderRadius: 0 }}>
                            <div style={{ marginRight: 5 }}>👤</div>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>Khách lẻ</span>
                            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: 5 }}>✏️</button>
                            <div style={{ width: 1, height: 20, background: '#ccc', margin: '0 10px' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 13 }}>{customerCount} Khách</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <button style={{ fontSize: 8, height: 10, padding: 0, border: 'none', cursor: 'pointer', color: '#333', background: 'transparent' }} onClick={() => setCustomerCount(customerCount + 1)}>▲</button>
                                    <button style={{ fontSize: 8, height: 10, padding: 0, border: 'none', cursor: 'pointer', color: '#333', background: 'transparent' }} onClick={() => setCustomerCount(Math.max(1, customerCount - 1))}>▼</button>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className='searchWrapper' style={{ flex: 1.5, height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', height: '100%', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 0, width: '100%', paddingLeft: 10 }}>
                                <div className='searchIcon' style={{ color: '#666', position: 'static', transform: 'none' }}>🔍</div>
                                <input
                                    placeholder='Nhập tên mặt hàng (F4)'
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ background: 'transparent', height: '100%', color: '#333', border: 'none', outline: 'none', flex: 1, paddingLeft: 10 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Area: Menu Sidebar + Product Grid */}
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        {/* Menu Category Sidebar */}
                        <div style={{ width: 141, margin: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {loadingMenus ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                    Đang tải...
                                </div>
                            ) : (
                                <>
                                    {visibleMenus.map((menu, index) => {
                                        const isLastSlot = index === VISIBLE_MENU_COUNT - 1
                                        const isActive = selectedCategory?.id === menu.id

                                        return (
                                            <button
                                                key={menu.id}
                                                onClick={() => setSelectedCategory(menu)}
                                                style={{
                                                    background: isActive ? '#0091ff' : '#fff',
                                                    color: isActive ? '#fff' : '#333',
                                                    border: 'none', flex: 1, width: '100%', cursor: 'pointer',
                                                    fontWeight: 400, fontSize: 13,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderBottomLeftRadius: isLastSlot ? 8 : 0,
                                                }}
                                            >
                                                {menu.name}
                                            </button>
                                        )
                                    })}

                                    {/* Placeholder slots to fill remaining space */}
                                    {Array.from({ length: emptyMenuSlots }).map((_, index) => {
                                        const isLastSlot = (visibleMenus.length + index) === VISIBLE_MENU_COUNT - 1
                                        return (
                                            <div
                                                key={`placeholder-${index}`}
                                                style={{
                                                    background: '#8B8FA3', border: 'none', flex: 1, width: '100%',
                                                    borderBottomLeftRadius: isLastSlot ? 8 : 0,
                                                }}
                                            />
                                        )
                                    })}
                                </>
                            )}
                        </div>

                        {/* Product Grid */}
                        <div className='cashierCenter' style={{ background: '#030033' }}>
                            <div className='productGridScroll' style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 0 0 0', alignContent: 'flex-start' }}>
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={addToCart}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Cart Panel */}
                <div className='cashierRight' style={{ position: 'relative' }}>
                    {/* Cart Header: Order Type + Table + Actions */}
                    <CartHeader
                        orderType={orderType}
                        showOrderTypeDropdown={showOrderTypeDropdown}
                        selectedTable={selectedTable}
                        initialOrder={props.initialOrder}
                        showMoreMenu={showMoreMenu}
                        currentUser={currentUser}
                        onToggleOrderTypeDropdown={() => setShowOrderTypeDropdown(!showOrderTypeDropdown)}
                        onSetOrderType={(type) => { setOrderType(type); setShowOrderTypeDropdown(false) }}
                        onOpenTablePicker={() => setShowTablePicker(true)}
                        onToggleMoreMenu={() => setShowMoreMenu(!showMoreMenu)}
                        onResetCart={resetCart}
                    />

                    {/* Cart Items List */}
                    <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }} onClick={() => setShowMoreMenu(false)}>
                        {cart.map((line, index) => (
                            <CartLineItem
                                key={line.id}
                                line={line}
                                index={index}
                                isSelected={selectedLineId === line.id}
                                now={now}
                                initialOrderCreatedAt={props.initialOrder?.createdAt}
                                onSelect={() => setSelectedLineId(line.id)}
                                onIncrement={() => incrementQuantity(line.id)}
                                onDecrement={() => decrementQuantity(line.id)}
                                onRemove={() => removeCartLine(line.id)}
                                onEdit={() => openTimeEditModal(line)}
                                priceDisplay={getLinePriceDisplay(line)}
                            />
                        ))}
                    </div>

                    {/* Cart Footer: Tools, Total, Actions */}
                    <div style={{ background: '#fff' }}>
                        <div className='cartToolsBar'>
                            <button className='toolBtn'>🎁<span style={{ fontSize: 9, background: 'red', color: 'white', borderRadius: '50%', padding: '0 3px', position: 'absolute', top: 5, right: 5 }}>2</span></button>
                            <button className='toolBtn'>%</button>
                            <button className='toolBtn'>🏷️</button>
                            <button className='toolBtn'>✏️</button>
                            <div style={{ flex: 1 }} />
                            <button className='toolBtn'><ChevronUpIcon size={20} /></button>
                            <button className='toolBtn'><ChevronDownIcon size={20} /></button>
                        </div>
                        <div className='cartTotalRow'>
                            <span className='totalLabel'>Tổng tiền</span>
                            <span className='totalValue'>{cartTotal.toLocaleString()}đ</span>
                        </div>
                        <div className='cartActionRow'>
                            {(props.initialOrder?.orderType === 'scoreboard' || props.initialOrder?.order_type === 'scoreboard') && (props.initialOrder?.status === 'pending-confirm' || props.initialOrder?.status === 'pending') ? (
                                <>
                                    <button
                                        className='btnAction exit'
                                        onClick={handleExit}
                                        style={{ background: '#eee', color: '#333' }}
                                    >
                                        <div>Đóng</div>
                                        <small>(ESC)</small>
                                    </button>
                                    <button
                                        className='btnAction save'
                                        onClick={async () => {
                                            try {
                                                if (!props.initialOrder?.id) return;
                                                await confirmScoreboardOrder(props.initialOrder.id);
                                                alert("Đã thêm món vào hoá đơn của bàn thành công!");
                                                props.onLock();
                                            } catch (err: any) {
                                                alert("Lỗi khi xác nhận order: " + err.message);
                                            }
                                        }}
                                        style={{ background: '#0086ff', color: '#fff', flex: 3 }}
                                    >
                                        <div style={{ fontSize: 16, fontWeight: 'bold' }}>XÁC NHẬN MÓN MỚI</div>
                                        <small>(SCOREBOARD)</small>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className='btnAction exit'
                                        onClick={handleExit}
                                        style={{ background: hasCartItems ? '#ff7051' : '#eee', color: hasCartItems ? '#fff' : '#333' }}
                                    >
                                        <div>Thoát</div>
                                        <small>(ESC)</small>
                                    </button>
                                    <button
                                        className='btnAction save'
                                        onClick={handleSaveOrder}
                                        style={{ background: hasCartItems ? '#0bbe5c' : '#eee', color: hasCartItems ? '#fff' : '#333' }}
                                    >
                                        <div>Lưu đơn</div>
                                        <small>(F3)</small>
                                    </button>
                                    <button
                                        className='btnAction savecalc'
                                        style={{ background: hasCartItems ? '#00c0f9' : '#eee', color: hasCartItems ? '#fff' : '#333' }}
                                    >
                                        <div>Lưu & Tạm tính</div>
                                        <small>(F2)</small>
                                    </button>
                                    <button
                                        className={`btnAction pay ${hasCartItems ? 'active' : ''}`}
                                        onClick={handleCheckout}
                                        disabled={!hasCartItems}
                                        style={{ background: hasCartItems ? '#0086ff' : '#eee', color: hasCartItems ? '#fff' : '#333' }}
                                    >
                                        <div>Thanh toán</div>
                                        <small>(F1)</small>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SYSTEM FOOTER --- */}
            <CashierFooter userName={userName} timeText={timeText} dateText={dateText} />

            {/* --- MODALS --- */}
            <TablePickerModal
                isOpen={showTablePicker}
                onClose={() => setShowTablePicker(false)}
                onSelectTable={(tableName, tableId, areaId) => {
                    setSelectedTable(tableName)
                    setSelectedTableId(tableId)
                    setSelectedAreaId(areaId)
                    setShowTablePicker(false)
                }}
                orders={props.orders}
                initialAreaId={props.initialAreaId}
                now={now}
                userName={userName}
                timeText={timeText}
                dateText={dateText}
            />

            <TimeEditModal
                isOpen={showTimeEditModal}
                editingLine={editingLine}
                initialOrderCreatedAt={props.initialOrder?.createdAt}
                now={now}
                onSave={handleTimeEditSave}
                onClose={() => { setShowTimeEditModal(false); setEditingLine(null) }}
            />

            <UnsavedChangesModal
                isOpen={showUnsavedChangesModal}
                onClose={() => setShowUnsavedChangesModal(false)}
                onDiscardAndExit={() => { setShowUnsavedChangesModal(false); props.onLock() }}
                onSaveAndExit={() => { setShowUnsavedChangesModal(false); handleSaveOrder() }}
            />
        </div>
    )
}
