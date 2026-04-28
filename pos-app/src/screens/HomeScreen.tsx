import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import TableLayoutScreen from './TableLayoutScreen'
import BookTableScreen from './BookTableScreen'
import DashboardScreen from './DashboardScreen'
import AttendanceScreen from './AttendanceScreen'
import { type HomeTab } from '../constants/screens'
import { getCurrentUser } from '../services/api'
import { formatElapsedHHMMSS, parseTimestamp } from '../utils/timePrice'
import {
  CashierFooter,
  MinimizeIcon,
  CloseIcon,
  DineInIcon,
  TakeawayIcon,
  ChevronRightSmallIcon,
  ChevronLeftSmallIcon,
  MenuHamburgerIcon,
  GlobeIcon,
  NotificationBellIcon,
  AlarmClockIcon,
  DollarCircleIcon,
  PlusIcon,
} from '../components/cashier'
import logoPoolarena from '../assets/logo-main.png'

// ============================================
// TYPES
// ============================================

type OrderType = 'waiting' | 'table'
type OrderStatus = 'all' | 'pending-payment' | 'pending-confirm' | 'dine-in' | 'takeaway' | 'delivery' | 'partner' | 'order' | 'booking'

interface HomeOrder {
  id: string
  type: OrderType
  tableNumber?: number
  tableName?: string
  guestCount?: number
  waitTime: string
  paymentInfo: string
  status: OrderStatus
  createdAt: string
  areaId?: number
  [key: string]: any
}

interface HomeScreenProps {
  orders: any[]
  onCreateOrder: (tableLabel?: string, areaId?: number) => void
  onSelectOrder: (order: any) => void
  onLock: () => void
  onMenu: () => void
  activeTab?: HomeTab
  onTabChange?: (tab: HomeTab) => void
}

// ============================================
// HELPER: Format order duration using shared utility
// ============================================

function formatOrderDuration(createdAt: string, now: Date): string {
  if (!createdAt) return '00:00:00'
  try {
    const startMs = parseTimestamp(createdAt)
    if (isNaN(startMs)) return '00:00:00'
    const diffMs = Math.max(0, now.getTime() - startMs)
    const totalSeconds = Math.floor(diffMs / 1000)
    return formatElapsedHHMMSS(totalSeconds)
  } catch {
    return '00:00:00'
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function HomeScreen(props: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<HomeTab>(props.activeTab || 'all')
  const [filterStatus, setFilterStatus] = useState<OrderStatus>('all')
  const [now, setNow] = useState(() => new Date())
  const [currentUser, setCurrentUser] = useState<any>(null)

  // --- Effects ---

  useEffect(() => {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
  }, [])

  useEffect(() => {
    if (props.activeTab !== undefined) setActiveTab(props.activeTab)
  }, [props.activeTab])

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clockInterval)
  }, [])

  // --- Derived State ---

  function handleTabChange(tab: HomeTab) {
    setActiveTab(tab)
    props.onTabChange?.(tab)
  }

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

  const filteredOrders = useMemo(() => {
    const visibleOrders = props.orders.filter(o =>
      !(o.orderType === 'scoreboard' || o.order_type === 'scoreboard')
    )
    if (filterStatus === 'all') return visibleOrders
    return visibleOrders.filter(o => o.status === filterStatus)
  }, [filterStatus, props.orders])

  const orderStats = useMemo(() => {
    const visibleOrders = props.orders.filter(o =>
      !(o.orderType === 'scoreboard' || o.order_type === 'scoreboard')
    )
    return {
      all: visibleOrders.length,
      pendingPayment: visibleOrders.filter(o => o.status === 'pending-payment').length,
      pendingConfirm: visibleOrders.filter(o => o.status === 'pending-confirm').length,
      dineIn: visibleOrders.filter(o => o.status === 'dine-in').length,
      takeaway: visibleOrders.filter(o => o.status === 'takeaway').length,
      delivery: visibleOrders.filter(o => o.status === 'delivery').length,
      partner: visibleOrders.filter(o => o.status === 'partner').length,
      order: 0,
      booking: 0,
    }
  }, [props.orders])

  const userName = currentUser?.full_name || 'Nhân viên POS'

  // --- Render ---

  return (
    <div className='homeScreen'>
      {/* Header */}
      <header className='homeHeader'>
        <div className='homeHeaderLeft'>
          <button className='menuBtn' onClick={props.onMenu}>
            <MenuHamburgerIcon />
          </button>
          <div className='sapoLogo'>
            <img src={logoPoolarena} alt="POOLARENA" />
          </div>
          <div className='homeTabs'>
            <button className={`homeTab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')}>
              Tất cả đơn ({orderStats.all})
            </button>
            <button className={`homeTab ${activeTab === 'table-map' ? 'active' : ''}`} onClick={() => handleTabChange('table-map')}>
              Sơ đồ bàn
            </button>
            <button className={`homeTab ${activeTab === 'book-table' ? 'active' : ''}`} onClick={() => handleTabChange('book-table')}>
              Đặt bàn
            </button>
            <button className={`homeTab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
              Bảng điều khiển
            </button>
            <button className={`homeTab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => handleTabChange('attendance')}>
              Chấm công
            </button>
          </div>
        </div>
        <div className='homeHeaderRight'>
          <div className='iconBtn' onClick={() => { }}><GlobeIcon /></div>
          <div className='iconBtn' onClick={() => { }}><NotificationBellIcon /></div>
          <div className='iconBtn' onClick={() => { }}><MinimizeIcon /></div>
          <div className='iconBtn' onClick={props.onLock}><CloseIcon /></div>
        </div>
      </header>

      {/* Main Content */}
      <div className='homeMain'>
        {activeTab === 'all' && (
          <>
            {/* Order Grid */}
            <div className='homeGrid'>
              {filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  onClick={() => props.onSelectOrder(order)}
                />
              ))}
            </div>

            {/* Sidebar Filters */}
            <OrderFilterSidebar
              filterStatus={filterStatus}
              orderStats={orderStats}
              onFilterChange={setFilterStatus}
              onCreateOrder={() => props.onCreateOrder()}
            />
          </>
        )}

        {activeTab === 'table-map' && (() => {
          const tableOrders = props.orders.filter(o =>
            !(o.orderType === 'scoreboard' || o.order_type === 'scoreboard')
          );
          return (
            <TableLayoutScreen
              orders={tableOrders}
              onTableClick={(label, areaId) => {
                const tableNumber = parseInt(label.replace(/\D/g, '') || '0')
                const existingOrder = tableOrders.find(o => {
                  if (areaId && o.areaId) {
                    return Number(o.areaId) === areaId && o.tableNumber === tableNumber
                  }
                  return o.type === 'table' && o.tableNumber === tableNumber
                })

                if (existingOrder) {
                  props.onSelectOrder(existingOrder)
                } else {
                  props.onCreateOrder(label, areaId)
                }
              }}
            />
          );
        })()}
        {activeTab === 'book-table' && <BookTableScreen />}
        {activeTab === 'dashboard' && <DashboardScreen />}
        <div style={{ display: activeTab === 'attendance' ? 'contents' : 'none' }}>
          <AttendanceScreen />
        </div>
      </div>

      {/* Footer */}
      <CashierFooter userName={userName} timeText={timeText} dateText={dateText} />
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

// --- Order Card ---

function OrderCard({ order, now, onClick }: { order: any; now: Date; onClick: () => void }) {
  const areaName = order.tableName?.includes(' - ')
    ? order.tableName.split(' - ')[0]
    : 'AZ POOLARENA'

  const tableDisplayName = order.type === 'table'
    ? (order.tableName?.includes(' - ') ? order.tableName.split(' - ').pop() : (order.tableName || `Bàn ${order.tableNumber}`))
    : null

  return (
    <div className='orderCard' onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className='orderCardHeader' style={{ position: 'relative', height: '45px', padding: '0 12px' }}>
        {/* Blue Ribbon Badge */}
        <div style={{
          position: 'absolute', top: '-4px', left: '8px', width: '32px', height: '45px',
          background: '#0091ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)', zIndex: 2,
        }}>
          <DineInIcon size={18} color="white" />
        </div>

        {/* Area Name */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontWeight: 'bold', fontSize: '17px', color: 'var(--text-primary)',
          whiteSpace: 'nowrap', textTransform: 'uppercase',
        }}>
          {areaName}
        </div>
      </div>

      <div className='orderCardBody'>
        {order.type === 'waiting' && <div className='orderTitle'>Khách chờ</div>}
        {order.type === 'table' && <div className='orderTitle'>{tableDisplayName}</div>}
        <div className='orderMeta'>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlarmClockIcon />
            {formatOrderDuration(order.createdAt, now)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarCircleIcon />
            {order.paymentInfo}
          </span>
        </div>
      </div>

      <div className='orderCardFooter'>
        <button className='orderMenuBtn'>⋯</button>
        <button className='orderPayBtn'>Thanh toán</button>
      </div>
    </div>
  )
}

// --- Order Filter Sidebar ---

interface OrderFilterSidebarProps {
  filterStatus: OrderStatus
  orderStats: Record<string, number>
  onFilterChange: (status: OrderStatus) => void
  onCreateOrder: () => void
}

function OrderFilterSidebar({ filterStatus, orderStats, onFilterChange, onCreateOrder }: OrderFilterSidebarProps) {
  return (
    <aside className='homeSidebar'>
      <button className='createOrderBtn' onClick={onCreateOrder}>
        <PlusIcon />
        Tạo đơn mới
      </button>

      <div className='sidebarDivider' />

      <div className='sidebarSection'>
        <FilterButton label="Tất cả đơn" count={orderStats.all} active={filterStatus === 'all'} onClick={() => onFilterChange('all')} />

        <div className='filterRow'>
          <FilterButton label="Chờ thanh toán" count={orderStats.pendingPayment} active={filterStatus === 'pending-payment'} onClick={() => onFilterChange('pending-payment')} small />
          <FilterButton label="Chờ xác nhận" count={orderStats.pendingConfirm} active={filterStatus === 'pending-confirm'} onClick={() => onFilterChange('pending-confirm')} small />
        </div>
        <div className='filterRow'>
          <FilterButton label="Order" count={orderStats.order} active={filterStatus === 'order'} onClick={() => onFilterChange('order')} small />
          <FilterButton label="Đặt bàn" count={orderStats.booking} active={filterStatus === 'booking'} onClick={() => onFilterChange('booking')} small />
        </div>
        <div className='filterRow'>
          <button
            className={`filterBtn small dine-in ${filterStatus === 'dine-in' ? 'active' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '10px', alignItems: 'center' }}
            onClick={() => onFilterChange('dine-in')}
          >
            <DineInIcon size={24} color="currentColor" />
            <span>Tại bàn</span>
            <span className='filterCount'>{orderStats.dineIn}</span>
          </button>
          <button
            className={`filterBtn small takeaway ${filterStatus === 'takeaway' ? 'active' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '10px', alignItems: 'center' }}
            onClick={() => onFilterChange('takeaway')}
          >
            <TakeawayIcon size={24} color="currentColor" />
            <span>Mang đi</span>
            <span className='filterCount'>{orderStats.takeaway}</span>
          </button>
        </div>
        <div className='sidebarDivider' />
        <button className='filterBtn white'>
          AZ
          <span className='filterCount'>0</span>
        </button>
      </div>

      <div className='sidebarScroll'>
        <button className='scrollBtn'><ChevronRightSmallIcon /></button>
        <button className='scrollBtn'><ChevronLeftSmallIcon /></button>
      </div>
    </aside>
  )
}

// --- Filter Button ---

function FilterButton({ label, count, active, onClick, small }: {
  label: string; count: number; active: boolean; onClick: () => void; small?: boolean
}) {
  return (
    <button
      className={`filterBtn ${small ? 'small' : ''} ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
      <span className='filterCount'>{count}</span>
    </button>
  )
}
