import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import { type HomeTab } from '../constants/screens'
import { formatCurrency, formatDate, formatTime12h } from '../utils/format'
import {
  CashierFooter,
  MinimizeIcon,
  CloseIcon,
} from '../components/cashier'
import logoPoolarena from '../assets/logo-main.png'

// ============================================
// TYPES & CONSTANTS
// ============================================

interface MenuItem {
  id: string
  label: string
  icon?: string
  category?: string
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'work-shift', label: 'Ca làm việc', category: 'QUẢN LÝ CA' },
  { id: 'handover-history', label: 'Lịch sử bàn giao', category: 'QUẢN LÝ CA' },
  { id: 'withdraw', label: 'Rút tiền', category: 'QUẢN LÝ CA' },
  { id: 'revenue-stats', label: 'Thống kê doanh thu', category: 'QUẢN LÝ CA' },
  { id: 'item-stats', label: 'Thống kê mặt hàng', category: 'QUẢN LÝ CA' },
  { id: 'receipt-voucher', label: 'Phiếu thu', category: 'QUẢN LÝ THU CHI' },
  { id: 'payment-voucher', label: 'Phiếu chi', category: 'QUẢN LÝ THU CHI' },
  { id: 'upcoming-customers', label: 'Khách sắp đến', category: 'ĐẶT BÀN' },
  { id: 'unassigned-tables', label: 'Chưa xếp bàn', category: 'ĐẶT BÀN' },
  { id: 'reservation-schedule', label: 'Lịch đặt bàn', category: 'ĐẶT BÀN' },
  { id: 'invoices', label: 'Hóa đơn', category: 'QUẢN LÝ CHUNG' },
  { id: 'customer-debt', label: 'Thu nợ khách hàng', category: 'QUẢN LÝ CHUNG' },
  { id: 'admin-access', label: 'Truy cập quản trị', category: 'QUẢN LÝ CHUNG' },
  { id: 'data-sync', label: 'Đồng bộ dữ liệu', category: 'QUẢN LÝ CHUNG' },
  { id: 'open-cash-drawer', label: 'Mở két tiền', category: 'QUẢN LÝ CHUNG' },
]

// ============================================
// INLINE ICONS (specific to MenuScreen)
// ============================================

function MenuHamburgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12H21M3 6H21M3 18H21" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M7.65006 20.91C7.62006 20.91 7.58006 20.93 7.55006 20.93C5.61006 19.97 4.03006 18.38 3.06006 16.44C3.06006 16.41 3.08006 16.37 3.08006 16.34C4.30006 16.7 5.56006 16.97 6.81006 17.18C7.03006 18.44 7.29006 19.69 7.65006 20.91Z" fill="white" />
      <path d="M20.94 16.45C19.95 18.44 18.3 20.05 16.29 21.02C16.67 19.75 16.99 18.47 17.2 17.18C18.46 16.97 19.7 16.7 20.92 16.34C20.91 16.38 20.94 16.42 20.94 16.45Z" fill="white" />
      <path d="M21.02 7.70998C19.76 7.32998 18.49 7.01998 17.2 6.79998C16.99 5.50998 16.68 4.22998 16.29 2.97998C18.36 3.96998 20.03 5.63998 21.02 7.70998Z" fill="white" />
      <path d="M7.64998 3.09C7.28998 4.31 7.02998 5.55 6.81998 6.81C5.52998 7.01 4.24998 7.33 2.97998 7.71C3.94998 5.7 5.55998 4.05 7.54998 3.06C7.57998 3.06 7.61998 3.09 7.64998 3.09Z" fill="white" />
      <path d="M15.49 6.59C13.17 6.33 10.83 6.33 8.51001 6.59C8.76001 5.22 9.08001 3.85 9.53001 2.53C9.55001 2.45 9.54001 2.39 9.55001 2.31C10.34 2.12 11.15 2 12 2C12.84 2 13.66 2.12 14.44 2.31C14.45 2.39 14.45 2.45 14.47 2.53C14.92 3.86 15.24 5.22 15.49 6.59Z" fill="white" />
      <path d="M6.59 15.49C5.21 15.24 3.85 14.92 2.53 14.47C2.45 14.45 2.39 14.46 2.31 14.45C2.12 13.66 2 12.85 2 12C2 11.16 2.12 10.34 2.31 9.56001C2.39 9.55001 2.45 9.55001 2.53 9.53001C3.86 9.09001 5.21 8.76001 6.59 8.51001C6.34 10.83 6.34 13.17 6.59 15.49Z" fill="white" />
      <path d="M22 12C22 12.85 21.88 13.66 21.69 14.45C21.61 14.46 21.55 14.45 21.47 14.47C20.14 14.91 18.78 15.24 17.41 15.49C17.67 13.17 17.67 10.83 17.41 8.51001C18.78 8.76001 20.15 9.08001 21.47 9.53001C21.55 9.55001 21.61 9.56001 21.69 9.56001C21.88 10.35 22 11.16 22 12Z" fill="white" />
      <path d="M15.49 17.41C15.24 18.79 14.92 20.15 14.47 21.47C14.45 21.55 14.45 21.61 14.44 21.69C13.66 21.88 12.84 22 12 22C11.15 22 10.34 21.88 9.55001 21.69C9.54001 21.61 9.55001 21.55 9.53001 21.47C9.09001 20.14 8.76001 18.79 8.51001 17.41C9.67001 17.54 10.83 17.63 12 17.63C13.17 17.63 14.34 17.54 15.49 17.41Z" fill="white" />
      <path d="M15.7633 15.7633C13.2622 16.0789 10.7378 16.0789 8.23667 15.7633C7.92111 13.2622 7.92111 10.7378 8.23667 8.23667C10.7378 7.92111 13.2622 7.92111 15.7633 8.23667C16.0789 10.7378 16.0789 13.2622 15.7633 15.7633Z" fill="white" />
    </svg>
  )
}

function NotificationBellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M10 20H14C14 20.5304 13.7893 21.0391 13.4142 21.4142C13.0392 21.7893 12.5305 22 12 22C11.4696 22 10.9609 21.7893 10.5858 21.4142C10.2107 21.0391 10 20.5304 10 20ZM18.88 14.88C18.3172 14.3179 18.0007 13.5554 18 12.76V10C18 8.70178 17.579 7.43858 16.8 6.4L15.9 5.2C15.6206 4.82741 15.2582 4.525 14.8417 4.31672C14.4251 4.10844 13.9658 4 13.5 4H13V2.5C13 2.36739 12.9473 2.24021 12.8536 2.14645C12.7598 2.05268 12.6326 2 12.5 2H11.5C11.3674 2 11.2402 2.05268 11.1465 2.14645C11.0527 2.24021 11 2.36739 11 2.5V4H10.5C10.0343 4 9.57494 4.10844 9.15838 4.31672C8.74181 4.525 8.37946 4.82741 8.10002 5.2L7.20002 6.4C6.42109 7.43858 6.00002 8.70178 6.00002 10V12.76C5.99932 13.5554 5.68279 14.3179 5.12002 14.88L4.29002 15.71C4.10528 15.8963 4.00112 16.1477 4.00002 16.41V17C4.00002 17.2652 4.10538 17.5196 4.29291 17.7071C4.48045 17.8946 4.7348 18 5.00002 18H19C19.2652 18 19.5196 17.8946 19.7071 17.7071C19.8947 17.5196 20 17.2652 20 17V16.41C19.9989 16.1477 19.8948 15.8963 19.71 15.71L18.88 14.88ZM5.59002 5.21C5.64737 5.13536 5.67321 5.04122 5.66199 4.94776C5.65078 4.8543 5.6034 4.76895 5.53002 4.71L4.53002 3.93C4.48864 3.89559 4.44074 3.86988 4.38919 3.85442C4.33765 3.83895 4.28351 3.83405 4.23002 3.84C4.13534 3.86112 4.05275 3.91858 4.00002 4C2.80806 5.58596 2.11216 7.48923 2.00002 9.47C1.99506 9.53814 2.00502 9.60655 2.02919 9.67045C2.05337 9.73435 2.09119 9.79221 2.14002 9.84C2.18529 9.89062 2.24079 9.93105 2.30285 9.95864C2.36491 9.98622 2.43211 10.0003 2.50002 10H3.50002C3.6285 9.9977 3.75139 9.94698 3.84409 9.85799C3.93679 9.769 3.99248 9.64829 4.00002 9.52C4.1041 7.96024 4.6562 6.46367 5.59002 5.21ZM20 4C19.969 3.95564 19.9289 3.91842 19.8823 3.89082C19.8357 3.86323 19.7838 3.8459 19.73 3.84C19.619 3.82964 19.5082 3.86181 19.42 3.93L18.42 4.71C18.3466 4.76895 18.2768 5.04122 18.288 4.94776C18.2768 5.04122 18.3027 5.13536 18.36 5.21C19.3117 6.45798 19.8814 7.95503 20 9.52C20.0051 9.6474 20.0587 9.76805 20.1497 9.85727C20.2408 9.9465 20.3625 9.99755 20.49 10H21.49C21.5577 9.9991 21.6246 9.98445 21.6864 9.95695C21.7483 9.92945 21.804 9.88966 21.85 9.84C21.9446 9.73981 21.9981 9.60777 22 9.47C21.8832 7.4902 21.1878 5.58824 20 4Z" fill="white" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8.90002 7.55999C9.21002 3.95999 11.06 2.48999 15.11 2.48999H15.24C19.71 2.48999 21.5 4.27999 21.5 8.74999V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24002 20.08 8.91002 16.54" stroke="#EB5757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12H14.88" stroke="#EB5757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.65 8.64999L16 12L12.65 15.35" stroke="#EB5757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="5" height="9" viewBox="0 0 5 9" fill="none">
      <path d="M0.75 0.75L4.1 4.1L0.75 7.45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function MenuScreen(props: {
  orders?: any[]
  onBack: () => void
  onLock: () => void
  activeTab?: HomeTab
  onNavigateToTab?: (tab: HomeTab) => void
}) {
  const [activeMenu, setActiveMenu] = useState('work-shift')
  const [activeTab, setActiveTab] = useState<HomeTab>(props.activeTab || 'all')
  const [startingCash, setStartingCash] = useState('0')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (props.activeTab !== undefined) setActiveTab(props.activeTab)
  }, [props.activeTab])

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clockInterval)
  }, [])

  const timeText = useMemo(() => formatTime12h(now), [now])
  const dateText = useMemo(() => formatDate(now), [now])

  const groupedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {}
    MENU_ITEMS.forEach(item => {
      const cat = item.category || ''
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    return groups
  }, [])

  function handleCashInput(e: React.ChangeEvent<HTMLInputElement>) {
    setStartingCash(e.target.value.replace(/\D/g, ''))
  }

  function handleStartShift() {
    alert(`Bắt đầu ca với tiền mặt: ${formatCurrency(startingCash)}`)
  }

  function handleTabNavigation(tab: HomeTab) {
    setActiveTab(tab)
    props.onNavigateToTab?.(tab)
  }

  // --- Render ---

  return (
    <div className='menuScreen'>
      {/* Header */}
      <header className='homeHeader'>
        <div className='homeHeaderLeft'>
          <button className='menuBtn active' onClick={() => { }}>
            <MenuHamburgerIcon />
          </button>
          <div className='sapoLogo'>
            <img src={logoPoolarena} alt="POOLARENA" />
          </div>
          <div className='homeTabs'>
            <button className='homeTab' onClick={() => handleTabNavigation('all')}>Tất cả đơn ({(props.orders || []).filter(o => !(o.orderType === 'scoreboard' || o.order_type === 'scoreboard')).length})</button>
            <button className='homeTab' onClick={() => handleTabNavigation('table-map')}>Sơ đồ bàn</button>
            <button className='homeTab' onClick={() => handleTabNavigation('book-table')}>Đặt bàn</button>
            <button className='homeTab' onClick={() => handleTabNavigation('dashboard')}>Bảng điều khiển</button>
            <button className='homeTab' onClick={() => handleTabNavigation('attendance')}>Chấm công</button>
          </div>
        </div>
        <div className='homeHeaderRight'>
          <div className='iconBtn'><GlobeIcon /></div>
          <div className='iconBtn'><NotificationBellIcon /></div>
          <div className='iconBtn'><MinimizeIcon /></div>
          <div className='iconBtn'><CloseIcon /></div>
        </div>
      </header>

      {/* Main Content */}
      <div className='menuScreenMain'>
        <MenuSidebar
          groupedMenu={groupedMenu}
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
          onLogout={props.onLock}
        />
        <MenuContent
          activeMenu={activeMenu}
          startingCash={startingCash}
          onCashInput={handleCashInput}
          onStartShift={handleStartShift}
        />
      </div>

      {/* Footer */}
      <CashierFooter userName="Nguyễn Tiến Thành" timeText={timeText} dateText={dateText} />
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MenuSidebar({ groupedMenu, activeMenu, onMenuChange, onLogout }: {
  groupedMenu: Record<string, MenuItem[]>
  activeMenu: string
  onMenuChange: (id: string) => void
  onLogout: () => void
}) {
  return (
    <aside className='menuScreenSidebar'>
      <div className='menuScreenSidebarContent'>
        {Object.entries(groupedMenu).map(([category, items]) => (
          <div key={category} className='menuCategory'>
            <div className='menuCategoryTitle'>{category}</div>
            {items.map(item => (
              <button
                key={item.id}
                className={`menuScreenItem ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => onMenuChange(item.id)}
              >
                {item.icon && <span className='menuItemIcon'>{item.icon}</span>}
                <span className='menuItemLabel'>{item.label}</span>
                <ChevronRightArrow />
              </button>
            ))}
          </div>
        ))}
      </div>
      <button className='menuLogoutBtn' onClick={onLogout}>
        <span className='menuLogoutIcon'><LogoutIcon /></span>
        <span>Đăng xuất</span>
      </button>
    </aside>
  )
}

function MenuContent({ activeMenu, startingCash, onCashInput, onStartShift }: {
  activeMenu: string
  startingCash: string
  onCashInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStartShift: () => void
}) {
  if (activeMenu === 'work-shift') {
    return (
      <div className='menuScreenContent'>
        <div className='workShiftContent'>
          <h1 className='workShiftTitle'>Ca làm việc</h1>
          <div className='workShiftForm'>
            <label className='workShiftLabel'>Tiền mặt đầu ca</label>
            <input
              type='text'
              className='workShiftInput'
              value={formatCurrency(startingCash)}
              onChange={onCashInput}
              placeholder='0₫'
            />
            <button className='workShiftStartBtn' onClick={onStartShift}>
              Bắt đầu thu tiền và mở ca
            </button>
            <div className='workShiftNote'>
              <div className='workShiftNoteTitle'>Lưu ý:</div>
              <div className='workShiftNoteText'>
                Hóa đơn thanh toán trên thiết bị nào được ghi nhận vào ca thu tiền của thiết bị đó. Không ghi nhận theo nhân viên thanh toán.
              </div>
              <div className='workShiftNoteText'>
                Ví dụ: Nếu bạn mở ca trên thiết bị A, nhưng thanh toán hóa đơn trên thiết bị B, hóa đơn sẽ thuộc về ca thu tiền của thiết bị B.
              </div>
              <div className='workShiftNoteText'>
                Hãy kiểm tra thiết bị trước khi thao tác!
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='menuScreenContent'>
      <div className='menuPlaceholder'>
        <div className='menuPlaceholderIcon'>📄</div>
        <div className='menuPlaceholderTitle'>{MENU_ITEMS.find(m => m.id === activeMenu)?.label}</div>
        <div className='menuPlaceholderText'>Tính năng đang được phát triển</div>
      </div>
    </div>
  )
}
