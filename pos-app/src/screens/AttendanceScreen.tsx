import { useCallback, useEffect, useRef, useState } from 'react'
import '../App.css'
import {
    createQrAttendanceToken,
    checkQrTokenStatus,
    fetchTodayAttendance,
    type AttendanceRecord
} from '../services/api'
import { QR_ATTENDANCE_DEVICE_ID, QR_ATTENDANCE_INTERNAL_API_KEY, QR_ATTENDANCE_TTL } from '../config'
import QRCode from 'qrcode'

// ============================================
// TYPES
// ============================================

type QrState = 'idle' | 'loading' | 'active' | 'expired'
type ScanStatus = 'pending' | 'scanned' | 'completed'

interface QrData {
    qrUrl: string
    token: string
    expiresAt: string
    ttlSeconds: number
    createdAtMs: number
}

// ============================================
// HELPERS
// ============================================

function formatTime(isoStr: string | null): string {
    if (!isoStr) return '--:--'
    const d = new Date(isoStr)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function getStatusLabel(status: string): { text: string; color: string } {
    switch (status) {
        case 'present': return { text: 'Đúng giờ', color: '#10b981' }
        case 'late': return { text: 'Trễ', color: '#f59e0b' }
        case 'absent': return { text: 'Vắng', color: '#ef4444' }
        case 'early_checkout': return { text: 'Về sớm', color: '#f59e0b' }
        default: return { text: status, color: 'rgba(255,255,255,0.5)' }
    }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AttendanceScreen() {
    const [qrState, setQrState] = useState<QrState>('idle')
    const [qrData, setQrData] = useState<QrData | null>(null)
    const [qrImageDataUrl, setQrImageDataUrl] = useState<string | null>(null)
    const [countdown, setCountdown] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)
    const [scanStatus, setScanStatus] = useState<ScanStatus>('pending')
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([])

    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const createdAtRef = useRef<number>(0)

    // --- Load attendance records on mount ---
    useEffect(() => {
        loadAttendances()
    }, [])

    const loadAttendances = async () => {
        try {
            const records = await fetchTodayAttendance()
            setAttendances(records)
        } catch (e) {
            console.error('[Attendance] Failed to load records:', e)
        }
    }

    // --- Cleanup timers ---
    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current)
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [])

    // --- Countdown logic ---
    const startCountdown = useCallback((ttl: number) => {
        if (countdownRef.current) clearInterval(countdownRef.current)

        createdAtRef.current = performance.now()
        setCountdown(ttl)

        countdownRef.current = setInterval(() => {
            const elapsed = (performance.now() - createdAtRef.current) / 1000
            const remaining = ttl - elapsed

            if (remaining <= 0) {
                setCountdown(0)
                setQrState('expired')
                if (countdownRef.current) clearInterval(countdownRef.current)
            } else {
                setCountdown(Math.ceil(remaining))
            }
        }, 100)
    }, [])

    // --- Poll token status ---
    const startPolling = useCallback((token: string) => {
        if (pollRef.current) clearInterval(pollRef.current)

        setScanStatus('pending')

        pollRef.current = setInterval(async () => {
            try {
                const result = await checkQrTokenStatus(token, QR_ATTENDANCE_INTERNAL_API_KEY)

                if (result.status === 'completed') {
                    setScanStatus('completed')
                    if (pollRef.current) clearInterval(pollRef.current)
                    // Reload attendance list
                    loadAttendances()
                } else if (result.status === 'scanned') {
                    setScanStatus('scanned')
                } else if (result.status === 'expired') {
                    if (pollRef.current) clearInterval(pollRef.current)
                }
            } catch {
                // Ignore
            }
        }, 2000)
    }, [])

    // --- Generate QR ---
    const handleGenerateQr = useCallback(async () => {
        setQrState('loading')
        setError(null)
        setScanStatus('pending')

        if (pollRef.current) clearInterval(pollRef.current)

        try {
            const response = await createQrAttendanceToken(
                QR_ATTENDANCE_DEVICE_ID,
                'attendance_access',
                QR_ATTENDANCE_TTL,
                QR_ATTENDANCE_INTERNAL_API_KEY
            )

            if (!response || !response.success) {
                throw new Error('Server trả về lỗi: ' + JSON.stringify(response))
            }

            const data: QrData = {
                qrUrl: response.qr_url,
                token: response.access_token,
                expiresAt: response.expires_at,
                ttlSeconds: response.ttl_seconds || QR_ATTENDANCE_TTL,
                createdAtMs: performance.now(),
            }

            setQrData(data)

            const dataUrl = await QRCode.toDataURL(response.qr_url, {
                width: 380,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'L',
            })

            setQrImageDataUrl(dataUrl)
            setQrState('active')
            startCountdown(data.ttlSeconds)
            startPolling(response.access_token)
        } catch (e: any) {
            setQrState('idle')
            let msg = e.message || 'Lỗi không xác định'
            if (msg.includes('401') || msg.includes('API key')) {
                msg += '\n\nLỗi xác thực: Vui lòng kiểm tra API Key.'
            }
            setError(msg)
        }
    }, [startCountdown, startPolling])

    // --- Countdown color ---
    const getCountdownColor = (): string => {
        if (qrState === 'expired') return '#ef4444'
        if (countdown <= 10) return '#ef4444'
        if (countdown <= 30) return '#f59e0b'
        return '#10b981'
    }

    const getCountdownBg = (): string => {
        if (qrState === 'expired') return 'rgba(239, 68, 68, 0.15)'
        if (countdown <= 10) return 'rgba(239, 68, 68, 0.15)'
        if (countdown <= 30) return 'rgba(245, 158, 11, 0.15)'
        return 'rgba(16, 185, 129, 0.15)'
    }

    // --- Scan status ---
    const getScanStatusInfo = () => {
        switch (scanStatus) {
            case 'pending':
                return { text: 'Đang chờ quét mã...', color: 'rgba(255,255,255,0.5)' }
            case 'scanned':
                return { text: 'Mã QR đang được chấm công', color: '#f59e0b' }
            case 'completed':
                return { text: 'Chấm công thành công', color: '#10b981' }
        }
    }

    // --- Render ---

    return (
        <>
            <div className='bookTableMain'>
                {/* Main Content - Attendance Table */}
                <div className='bookTableContent' style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', padding: 'var(--spacing-6)' }}>
                    {attendances.length === 0 && !error ? (
                        <div className='emptyState' style={{ margin: 'auto' }}>
                            <div className='emptyStateTitle'>Chấm công nhân viên</div>
                            <div className='emptyStateSubtitle'>
                                Tạo mã QR chấm công ở thanh bên phải để nhân viên quét mã chấm công
                            </div>
                        </div>
                    ) : error ? (
                        <div className='emptyState' style={{ margin: 'auto' }}>
                            <div className='emptyStateTitle' style={{ color: '#ef4444' }}>Không thể tạo mã QR</div>
                            <div className='emptyStateSubtitle' style={{ whiteSpace: 'pre-line', color: '#ef4444' }}>{error}</div>
                        </div>
                    ) : (
                        <>
                            <div className='attTableHeader'>
                                <span className='attTableTitle'>Chấm công mới nhất</span>
                                <span className='attTableCount'>{attendances.length} bản ghi mới nhất</span>
                            </div>
                            <div className='attTableWrap'>
                                <table className='attTable'>
                                    <thead>
                                        <tr>
                                            <th>STT</th>
                                            <th>Nhân viên</th>
                                            <th>Ngày</th>
                                            <th>Giờ vào</th>
                                            <th>Giờ ra</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendances.map((att, idx) => {
                                            const statusInfo = getStatusLabel(att.status)
                                            return (
                                                <tr key={att.id}>
                                                    <td>{idx + 1}</td>
                                                    <td className='attEmployeeName'>{att.user.full_name}</td>
                                                    <td>{formatDate(att.date)}</td>
                                                    <td>{formatTime(att.check_in_time)}</td>
                                                    <td>{formatTime(att.check_out_time)}</td>
                                                    <td>
                                                        <span className='attStatusBadge' style={{ background: statusInfo.color + '22', color: statusInfo.color }}>
                                                            {statusInfo.text}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <aside className='bookTableSidebar'>
                    <button
                        className='createBookTableBtn'
                        onClick={handleGenerateQr}
                        disabled={qrState === 'loading'}
                        style={{ opacity: qrState === 'loading' ? 0.6 : 1 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 14 14" fill="none">
                            <path d="M0.75 6.75H6.75M6.75 6.75H12.75M6.75 6.75V0.75M6.75 6.75V12.75" stroke="white" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {qrState === 'loading' ? 'Đang tạo...' : (qrState === 'active' || qrState === 'expired') ? 'Tạo lại mã chấm công' : 'Tạo mã chấm công'}
                    </button>

                    {qrState === 'loading' && (
                        <div className='attSidebarQrWrap'>
                            <div className='attSidebarLoading'>Đang tạo mã QR...</div>
                        </div>
                    )}

                    {(qrState === 'active' || qrState === 'expired') && qrImageDataUrl && (
                        <div className='attSidebarQrWrap'>
                            <div
                                className='attSidebarQrImage'
                                style={{
                                    opacity: qrState === 'expired' ? 0.25 : 1,
                                    borderColor: qrState === 'expired' ? '#ef4444' : 'rgba(255,255,255,0.2)',
                                }}
                            >
                                <img
                                    src={qrImageDataUrl}
                                    alt='QR Code chấm công'
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                                />
                            </div>

                            <div
                                className='attSidebarCountdown'
                                style={{
                                    color: getCountdownColor(),
                                    background: getCountdownBg(),
                                    borderColor: getCountdownColor(),
                                }}
                            >
                                {qrState === 'expired' ? 'Hết hạn' : `${countdown}s`}
                            </div>

                            {qrState === 'active' && (() => {
                                const statusInfo = getScanStatusInfo()
                                return (
                                    <div className='attScanStatus' style={{ color: statusInfo.color }}>
                                        {statusInfo.text}
                                    </div>
                                )
                            })()}

                            {qrState === 'expired' && (
                                <div className='attSidebarExpired'>Mã QR đã hết hạn</div>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </>
    )
}
