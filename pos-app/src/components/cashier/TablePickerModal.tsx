import { useEffect, useState, useMemo } from 'react'
import { fetchAreas, fetchAreaById, type Area } from '../../services/api'
import { BackArrowIcon, LocationPinIcon, ChevronRightSmallIcon, ChevronLeftSmallIcon } from './CashierIcons'
import CashierFooter from './CashierFooter'
import { formatElapsedHHMMSS, parseTimestamp } from '../../utils/timePrice'
import logoPoolarena from '../../assets/logo-main.png'

// ============================================
// TYPES
// ============================================

interface TablePickerModalProps {
    /** Whether the modal is visible */
    isOpen: boolean
    /** Callback to close the modal */
    onClose: () => void
    /** Callback when a table is selected: (tableName, tableId, areaId) */
    onSelectTable: (tableName: string, tableId: number, areaId: number) => void
    /** All current orders (used to determine table occupancy) */
    orders?: any[]
    /** Pre-selected area ID to focus on opening */
    initialAreaId?: number
    /** Current timestamp (for calculating occupancy duration) */
    now: Date
    /** User display name for footer */
    userName: string
    /** Formatted time string for footer */
    timeText: string
    /** Formatted date string for footer */
    dateText: string
}

interface PickerTable {
    id: number
    label: string
    x: number
    y: number
    width: number
    height: number
    status: 'empty' | 'occupied'
    startTime?: string
    orderDebugInfo: string
}

// ============================================
// HELPER: Sort areas by creation date, then by ID
// ============================================

function sortAreasByCreationDate(areas: Area[]): Area[] {
    return [...areas].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : NaN
        const bTime = b.created_at ? new Date(b.created_at).getTime() : NaN
        if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
            return aTime - bTime
        }
        return a.id - b.id
    })
}

// ============================================
// HELPER: Match orders to table structure
// ============================================

function mergeOrdersIntoTables(
    tableStructure: PickerTable[],
    orders: any[],
    selectedArea: Area | null
): PickerTable[] {
    if (!selectedArea) return tableStructure

    const activeOrders = orders.filter(
        (o) => o.status !== 'completed' && o.status !== 'cancelled'
    )

    return tableStructure.map((table) => {
        const fullTableName = `${selectedArea.name} - ${table.label}`

        const matchingOrder = activeOrders.find((order) => {
            const orderTableId = Number(order.tableId)
            const tableId = Number(table.id)

            // Strict matching: area ID must match first
            if (order.areaId !== undefined) {
                if (Number(order.areaId) !== Number(selectedArea.id)) return false
                if (orderTableId && orderTableId === tableId) return true
                if (order.tableName === fullTableName) return true
                return false
            }

            // Legacy fallback (no areaId on the order)
            if (orderTableId && orderTableId === tableId) return true
            return order.tableName === fullTableName
        })

        return {
            ...table,
            status: matchingOrder ? 'occupied' as const : 'empty' as const,
            startTime: matchingOrder?.createdAt,
            orderDebugInfo: matchingOrder
                ? `${matchingOrder.tableName} (ID:${matchingOrder.id})`
                : '',
        }
    })
}

// ============================================
// COMPONENT
// ============================================

export default function TablePickerModal({
    isOpen,
    onClose,
    onSelectTable,
    orders = [],
    initialAreaId,
    now,
    userName,
    timeText,
    dateText,
}: TablePickerModalProps) {
    const [areas, setAreas] = useState<Area[]>([])
    const [selectedArea, setSelectedArea] = useState<Area | null>(null)
    const [tableStructure, setTableStructure] = useState<PickerTable[]>([])
    const [loadingAreas, setLoadingAreas] = useState(false)
    const [loadingTables, setLoadingTables] = useState(false)

    // Load areas when modal opens
    useEffect(() => {
        if (!isOpen) return

        const loadAreas = async () => {
            try {
                setLoadingAreas(true)
                const areasData = await fetchAreas()
                const sorted = sortAreasByCreationDate(areasData)
                setAreas(sorted)

                // Auto-select area: prefer initialAreaId, fallback to first
                const targetArea = initialAreaId
                    ? sorted.find((a) => a.id === initialAreaId)
                    : null
                setSelectedArea(targetArea || sorted[0] || null)
            } catch (error) {
                console.error('Failed to load areas:', error)
            } finally {
                setLoadingAreas(false)
            }
        }

        loadAreas()
    }, [isOpen, initialAreaId])

    // Load table structure when selected area changes
    useEffect(() => {
        if (!selectedArea) return

        const loadTableStructure = async () => {
            try {
                setLoadingTables(true)
                const areaDetail = await fetchAreaById(selectedArea.id)

                const structure: PickerTable[] = areaDetail.tables.map((table) => ({
                    id: table.id,
                    label: table.name,
                    x: table.x,
                    y: table.y,
                    width: table.width,
                    height: table.height,
                    status: 'empty' as const,
                    startTime: undefined,
                    orderDebugInfo: '',
                }))
                setTableStructure(structure)
            } catch (error) {
                console.error('Failed to load table structure:', error)
            } finally {
                setLoadingTables(false)
            }
        }

        loadTableStructure()
    }, [selectedArea])

    // Merge orders into tables for occupancy display
    const displayTables = useMemo(
        () => mergeOrdersIntoTables(tableStructure, orders, selectedArea),
        [tableStructure, orders, selectedArea]
    )

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#e8e8e8', zIndex: 9999,
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <header className='homeHeader'>
                <div className='homeHeaderLeft'>
                    <div className='sapoLogo'>
                        <img src={logoPoolarena} alt="POOLARENA" />
                    </div>
                    <div className='homeTabs'>
                        <button className='homeTab active'>Sơ đồ bàn</button>
                    </div>
                </div>
                <div className='homeHeaderRight'>
                    <button
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', background: '#e57373', border: 'none',
                            borderRadius: 6, color: 'white', fontSize: 14,
                            fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onClick={onClose}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#ef5350'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#e57373'}
                    >
                        <BackArrowIcon />
                        <span>Quay lại (Esc)</span>
                    </button>
                </div>
            </header>

            {/* Content: Table Canvas + Area Sidebar */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Main Table Canvas */}
                <div className='tableLayoutMain'>
                    {loadingTables ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                            Đang tải bàn...
                        </div>
                    ) : (
                        <div className='tableCanvas'>
                            {displayTables.map((table) => {
                                const durationStr = calculateTableDuration(table, now)

                                return (
                                    <div
                                        key={table.id}
                                        className={`tableCard ${table.status === 'occupied' ? 'occupied' : 'empty'}`}
                                        style={{
                                            position: 'absolute',
                                            left: table.x * 2,
                                            top: table.y * 2,
                                            cursor: table.status === 'occupied' ? 'not-allowed' : 'pointer',
                                            opacity: table.status === 'occupied' ? 0.8 : 1,
                                        }}
                                        onClick={() => {
                                            if (table.status === 'occupied') return
                                            onSelectTable(
                                                `${selectedArea?.name} - ${table.label}`,
                                                table.id,
                                                selectedArea?.id || 0
                                            )
                                        }}
                                    >
                                        <div className='tableCardHeader'>
                                            <div className='tableNumber'>{table.label}</div>
                                        </div>
                                        <div className='tableCardBody'>
                                            {table.status === 'occupied' ? (
                                                <div className='tableDuration'>{durationStr}</div>
                                            ) : (
                                                <div className='tableEmptyLabel'>Bàn trống</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {displayTables.length === 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                                    Chưa có bàn nào trong khu vực này
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Area Sidebar */}
                <aside className='tableLayoutSidebar'>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {loadingAreas ? (
                            <div style={{ color: 'white', fontSize: 12, textAlign: 'center', padding: 8 }}>
                                Đang tải...
                            </div>
                        ) : (
                            areas.map((area) => (
                                <button
                                    key={area.id}
                                    className={`locationBtn ${selectedArea?.id === area.id ? 'active' : ''}`}
                                    onClick={() => setSelectedArea(area)}
                                    title={area.name}
                                >
                                    <LocationPinIcon />
                                    <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {area.name}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <div className='sidebarScroll' style={{ marginTop: 'auto' }}>
                        <button className='scrollBtn'><ChevronRightSmallIcon /></button>
                        <button className='scrollBtn'><ChevronLeftSmallIcon /></button>
                    </div>
                </aside>
            </div>

            {/* Footer */}
            <CashierFooter userName={userName} timeText={timeText} dateText={dateText} />
        </div>
    )
}

// ============================================
// HELPER: Calculate table occupancy duration
// ============================================

function calculateTableDuration(table: PickerTable, now: Date): string {
    if (table.status !== 'occupied' || !table.startTime) return '00:00:00'

    const startMs = parseTimestamp(table.startTime)
    const diffMs = Math.max(0, now.getTime() - startMs)
    const totalSeconds = Math.floor(diffMs / 1000)

    return formatElapsedHHMMSS(totalSeconds)
}
