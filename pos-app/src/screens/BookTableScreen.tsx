import { useEffect, useMemo, useState } from 'react'
import '../App.css'

type DateFilter = 'today' | 'tomorrow' | string

const DATE_FILTERS = [
  { id: 'today', label: 'Hôm nay', date: '19/1/2026', count: 0 },
  { id: 'tomorrow', label: 'Ngày mai', date: '20/1/2026', count: 0 },
  { id: 'wed', label: 'Thứ tư', date: '21/1/2026', count: 0 },
  { id: 'thu', label: 'Thứ năm', date: '22/1/2026', count: 0 },
  { id: 'fri', label: 'Thứ sáu', date: '23/1/2026', count: 0 },
  { id: 'sat', label: 'Thứ bảy', date: '24/1/2026', count: 0 },
  { id: 'sun', label: 'Chủ nhật', date: '25/1/2026', count: 0 },
]

export default function BookTableScreen() {
  const [selectedDate, setSelectedDate] = useState<DateFilter>('today')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeText = useMemo(() => {
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM'
    const h12 = now.getHours() % 12 || 12
    return `${h12}:${mm} ${ampm}`
  }, [now])

  const dateText = useMemo(() => {
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = now.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }, [now])

  return (
    <>
      <div className='bookTableMain'>
        <div className='bookTableContent'>
          <div className='emptyState'>
            <div className='emptyStateIcon'>📄</div>
            <div className='emptyStateTitle'>Chưa có thông tin đặt bàn</div>
            <div className='emptyStateSubtitle'>
              Thêm thông tin đặt bàn để chuẩn bị sẵn sàng phục vụ khách hàng
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className='bookTableSidebar'>
          <button className='createBookTableBtn'>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 14 14" fill="none">
              <path d="M0.75 6.75H6.75M6.75 6.75H12.75M6.75 6.75V0.75M6.75 6.75V12.75" stroke="white" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tạo đơn đặt bàn
          </button>

          <div className='sidebarDivider' />

          <div className='bookTableFilters'>
            <button className={`bookTableFilterBtn ${selectedDate === 'all' ? 'active' : ''}`}>
              Tất cả đơn đặt bàn
              <span className='filterCount'>0</span>
            </button>

            <div className='bookTableFilterRow'>
              <button className={`bookTableFilterBtn small ${selectedDate === 'upcoming' ? 'active' : ''}`}>
                Sắp đến
                <span className='filterCount'>0</span>
              </button>
              <button className={`bookTableFilterBtn small ${selectedDate === 'overdue' ? 'active' : ''}`}>
                Quá giờ
                <span className='filterCount'>0</span>
              </button>
            </div>
            <div className='bookTableFilterRow'>
              <button className={`bookTableFilterBtn small ${selectedDate === 'order' ? 'active' : ''}`}>
                Order
                <span className='filterCount'>0</span>
              </button>
              <button className={`bookTableFilterBtn small ${selectedDate === 'booking' ? 'active' : ''}`}>
                Đặt bàn
                <span className='filterCount'>0</span>
              </button>
            </div>

            <div className='bookTableDateFilters'>
              {DATE_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  className={`bookTableDateBtn ${selectedDate === filter.id ? 'active' : ''}`}
                  onClick={() => setSelectedDate(filter.id)}
                >
                  <div className='dateBtnLabel'>{filter.label}</div>
                  <div className='dateBtnDate'>- {filter.date}</div>
                  <span className='filterCount'>{filter.count}</span>
                </button>
              ))}
            </div>

            <button className='manageBookTableBtn'>
              🪑 Quản lý đặt bàn
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
