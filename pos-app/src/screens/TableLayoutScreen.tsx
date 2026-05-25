import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import { fetchAreaById, fetchAreas, type Area, type AreaTable } from '../services/api'
import { parseTimestamp, formatElapsedHHMMSS } from '../utils/timePrice'
import { LocationPinIcon, ChevronRightSmallIcon, ChevronLeftSmallIcon } from '../components/cashier'

// ============================================
// TYPES
// ============================================

type TableStatus = 'occupied' | 'empty'

interface UiTable {
  id: number
  label: string
  status: TableStatus
  duration?: string
  x: number
  y: number
  width: number
  height: number
}

interface TableLayoutScreenProps {
  onTableClick?: (tableLabel: string, areaId?: number) => void
  orders: any[]
}

// ============================================
// HELPER: Format table duration using shared utility
// ============================================

function formatTableDuration(createdAt: string, now: Date): string {
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

export default function TableLayoutScreen(props: TableLayoutScreenProps) {
  const [now, setNow] = useState(() => new Date())
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [tables, setTables] = useState<UiTable[]>([])
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [loadingTables, setLoadingTables] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Load areas on mount ---

  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoadingAreas(true)
        setError(null)
        const areaList = await fetchAreas()
        const sorted = [...areaList].sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : NaN
          const bTime = b.created_at ? new Date(b.created_at).getTime() : NaN
          if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) return aTime - bTime
          return a.id - b.id
        })
        setAreas(sorted)
        if (sorted.length > 0 && !selectedArea) setSelectedArea(sorted[0])
      } catch (e: any) {
        setError(e.message || 'Không thể tải khu vực')
      } finally {
        setLoadingAreas(false)
      }
    }
    loadAreas()
  }, [])

  // --- Fetch table structure when area changes ---

  const [tableStructure, setTableStructure] = useState<UiTable[]>([])

  useEffect(() => {
    if (!selectedArea) return
    const loadTableStructure = async () => {
      try {
        setLoadingTables(true)
        setError(null)
        const areaDetail = await fetchAreaById(selectedArea.id)
        const rawStructure = areaDetail.tables.map((t: AreaTable) => ({
          id: t.id,
          label: t.name,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          status: 'empty' as TableStatus,
          duration: undefined,
        }))
        setTableStructure(rawStructure)
      } catch (e: any) {
        setError(e.message || 'Không thể tải bàn')
      } finally {
        setLoadingTables(false)
      }
    }
    loadTableStructure()
  }, [selectedArea])

  // --- Merge table structure with orders ---

  useEffect(() => {
    if (tableStructure.length === 0) {
      setTables([])
      return
    }

    const merged = tableStructure.map(table => {
      const tableNumber = parseInt(table.label.replace(/\D/g, '') || '0')
      const tableId = Number(table.id)

      const matchedOrder = props.orders.find(order => {
        // Strict ID check first
        if (order.tableId && Number(order.tableId) === tableId) return true
        // Area-aware check
        if (order.areaId && selectedArea && Number(order.areaId) === selectedArea.id) {
          return order.tableNumber === tableNumber
        }
        // Fallback
        return order.type === 'table' && order.tableNumber === tableNumber
      })

      return {
        ...table,
        status: matchedOrder ? 'occupied' : 'empty',
        duration: matchedOrder ? matchedOrder.createdAt : undefined,
      } as UiTable
    })
    setTables(merged)
  }, [tableStructure, props.orders, selectedArea])

  // --- Clock tick ---

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clockInterval)
  }, [])

  // --- Error state ---

  if (error) {
    return (
      <div className='flex items-center justify-center h-screen text-red-500 text-center p-4'>
        <div>
          <p className='text-lg font-semibold mb-2'>Lỗi</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // --- Render ---

  return (
    <>
      <div className='tableLayoutMain'>
        {loadingTables ? (
          <div className='flex items-center justify-center h-full text-gray-400'>
            Đang tải bàn...
          </div>
        ) : (
          <div className='tableCanvas'>
            {tables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                now={now}
                areaName={selectedArea?.name}
                onClick={() => {
                  props.onTableClick?.(
                    selectedArea ? `${selectedArea.name} - ${table.label}` : table.label,
                    selectedArea?.id,
                  )
                }}
                clickable={!!props.onTableClick}
              />
            ))}
            {tables.length === 0 && (
              <div className='flex items-center justify-center h-full text-gray-400'>
                Chưa có bàn nào trong khu vực này
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar — Area selector */}
      <aside className='tableLayoutSidebar'>
        <div className='flex flex-col gap-2'>
          {loadingAreas ? (
            <div className='text-white text-xs text-center py-2'>Đang tải...</div>
          ) : (
            areas.map(area => (
              <button
                key={area.id}
                className={`locationBtn ${selectedArea?.id === area.id ? 'active' : ''}`}
                onClick={() => setSelectedArea(area)}
                title={area.name}
              >
                <LocationPinIcon />
                <span className='truncate font-bold'>{area.name}</span>
              </button>
            ))
          )}
        </div>

        <div className='sidebarScroll mt-auto'>
          <button className='scrollBtn'><ChevronRightSmallIcon /></button>
          <button className='scrollBtn'><ChevronLeftSmallIcon /></button>
        </div>
      </aside>
    </>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function TableCard({ table, now, areaName, onClick, clickable }: {
  table: UiTable
  now: Date
  areaName?: string
  onClick: () => void
  clickable: boolean
}) {
  return (
    <div
      className={`tableCard ${table.status === 'occupied' ? 'occupied' : 'empty'}`}
      style={{
        position: 'absolute',
        left: table.x * 2,
        top: table.y * 2,
        cursor: clickable ? 'pointer' : undefined,
      }}
      onClick={onClick}
    >
      <div className='tableCardHeader'>
        <div className='tableNumber'>{table.label}</div>
      </div>
      <div className='tableCardBody'>
        {table.status === 'occupied' ? (
          <div className='tableDuration'>{formatTableDuration(table.duration || '', now)}</div>
        ) : (
          <div className='tableEmptyLabel'>Bàn trống</div>
        )}
      </div>
    </div>
  )
}
