import { useState, useEffect } from 'react'
import '../App.css'
import { fetchSwitches, toggleSwitch, SwitchItem } from '../services/api'

// ============================================
// CONSTANTS
// ============================================

const SWITCH_CATEGORIES = [
    { value: 'light', label: 'Đèn bàn', icon: '💡' },
    { value: 'scoreboard', label: 'Scoreboard', icon: '🖥️' },
    { value: 'tv', label: 'Tivi', icon: '📺' },
    { value: 'ac', label: 'Điều hoà', icon: '❄️' },
    { value: 'ceiling_light', label: 'Đèn điện', icon: '💡' },
    { value: 'fan', label: 'Quạt', icon: '🌀' },
    { value: 'exhaust_fan', label: 'Quạt hút mùi', icon: '🌪️' },
    { value: 'sign_light', label: 'Đèn biển', icon: '🪧' },
    { value: 'other', label: 'Khác', icon: '⚙️' },
] as const;

export default function DashboardScreen() {
    const [switches, setSwitches] = useState<SwitchItem[]>([])
    const [loading, setLoading] = useState(true)

    const loadSwitches = async () => {
        try {
            const data = await fetchSwitches()
            setSwitches(data)
        } catch (error) {
            console.error("Failed to load switches", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSwitches()
        const interval = setInterval(() => {
            loadSwitches()
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleToggle = async (sw: SwitchItem) => {
        const oldState = sw.is_active;
        const newState = !oldState;

        // Optimistic UI update
        setSwitches(prev => prev.map(s => s.id === sw.id ? { ...s, is_active: newState } : s))

        try {
            await toggleSwitch(sw.id, newState)
        } catch (error) {
            console.error("Failed to toggle switch", error)
            // Revert on error
            setSwitches(prev => prev.map(s => s.id === sw.id ? { ...s, is_active: oldState } : s))
        }
    }

    const handleTurnOffAll = async () => {
        const activeSwitches = switches.filter(s => s.is_active)
        if (activeSwitches.length === 0) return

        if (!window.confirm("Bạn có chắc muốn tắt toàn bộ thiết bị đang bật?")) return

        // Set all to off optimistically
        setSwitches(prev => prev.map(s => ({ ...s, is_active: false })))

        try {
            await Promise.all(activeSwitches.map(s => toggleSwitch(s.id, false)))
        } catch (error) {
            console.error("Failed to turn off all switches", error)
            loadSwitches()
        }
    }

    const groupedSwitches = SWITCH_CATEGORIES.map(cat => ({
        ...cat,
        items: switches.filter(s => s.switch_type === cat.value)
    })).filter(group => group.items.length > 0)

    const activeCount = switches.filter(s => s.is_active).length

    return (
        <>
            <div className='bookTableMain'>
                <div className='bookTableContent'>
                    {loading && switches.length === 0 ? (
                        <div className='emptyState'>
                            <div className='emptyStateTitle'>Bảng điều khiển</div>
                            <div className='emptyStateSubtitle'>Đang tải dữ liệu...</div>
                        </div>
                    ) : switches.length === 0 ? (
                        <div className='emptyState'>
                            <div className='emptyStateTitle'>Bảng điều khiển</div>
                            <div className='emptyStateSubtitle'>Chưa có dữ liệu bảng điều khiển</div>
                        </div>
                    ) : (
                        <div className='switchesGrid'>
                            {groupedSwitches.map(group => (
                                <div key={group.value} className='switchesGroup'>
                                    <div className='switchesGroupTitle'>
                                        {group.icon} {group.label}
                                        <span className='switchesGroupBadge'>{group.items.length}</span>
                                    </div>
                                    <div className='switchesList'>
                                        {group.items.map(sw => (
                                            <div
                                                key={sw.id}
                                                className={`switchCard ${sw.is_active ? 'active' : ''}`}
                                                onClick={() => handleToggle(sw)}
                                            >
                                                <div className='switchInfo'>
                                                    <div className='switchName'>{sw.name}</div>
                                                    {sw.area_name && (
                                                        <div className='switchArea'>{sw.area_name}</div>
                                                    )}
                                                    <div className={`switchStatus ${sw.is_active ? 'on' : 'off'}`}>
                                                        {sw.is_active ? 'Đang bật' : 'Đã tắt'}
                                                    </div>
                                                </div>
                                                <div className='customToggle'>
                                                    <div className='customToggleKnob'></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className='bookTableSidebar'>
                    <button
                        className='createBookTableBtn'
                        onClick={handleTurnOffAll}
                        disabled={loading || activeCount === 0}
                        style={{ opacity: activeCount === 0 ? 0.5 : 1 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 14 14" fill="none">
                            <path d="M0.75 6.75H6.75M6.75 6.75H12.75M6.75 6.75V0.75M6.75 6.75V12.75" stroke="white" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Tắt toàn bộ thiết bị
                    </button>
                </aside>
            </div>
        </>
    )
}
