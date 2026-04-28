import { useEffect, useState } from 'react'
import { type CartLine } from './types'
import {
    calculateTimeBasedPrice,
    buildTimePriceInput,
} from '../../utils/timePrice'
import TimeAdjustmentModal from './TimeAdjustmentModal'

// ============================================
// TYPES
// ============================================

interface TimeEditModalProps {
    isOpen: boolean
    editingLine: CartLine | null
    initialOrderCreatedAt?: string
    now: Date
    onSave: (lineId: string, updates: { startTime?: string; endTime?: string; note?: string }) => void
    onClose: () => void
}

// ============================================
// COMPONENT
// ============================================

export default function TimeEditModal({
    isOpen,
    editingLine,
    initialOrderCreatedAt,
    now,
    onSave,
    onClose,
}: TimeEditModalProps) {
    const [lineNote, setLineNote] = useState('')
    const [showTimeAdjustment, setShowTimeAdjustment] = useState(false)
    const [tempStartTime, setTempStartTime] = useState('')
    const [tempEndTime, setTempEndTime] = useState('')

    // Working copy of time values (can be modified by sub-modal)
    const [workingStartTime, setWorkingStartTime] = useState<string | undefined>()
    const [workingEndTime, setWorkingEndTime] = useState<string | undefined>()

    // Initialize working state when modal opens or editingLine changes
    useEffect(() => {
        if (editingLine) {
            setLineNote(editingLine.note || '')
            setWorkingStartTime(editingLine.startTime)
            setWorkingEndTime(editingLine.endTime)
        }
    }, [editingLine])

    // Keyboard shortcuts: Esc to cancel, Enter to save
    useEffect(() => {
        if (!isOpen || !editingLine) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showTimeAdjustment) {
                    setShowTimeAdjustment(false)
                } else {
                    onClose()
                }
            } else if (e.key === 'Enter' && !showTimeAdjustment) {
                handleSave()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, editingLine, lineNote, showTimeAdjustment, workingStartTime, workingEndTime])

    if (!isOpen || !editingLine) return null

    // Calculate current price for display
    const startTimeStr = workingStartTime || initialOrderCreatedAt || new Date().toISOString()
    const priceInput = buildTimePriceInput(
        editingLine.product,
        startTimeStr,
        workingEndTime,
        now.getTime(),
        editingLine.qty
    )
    const { totalPrice, elapsedSeconds } = calculateTimeBasedPrice(priceInput)

    const intervalMinutes = editingLine.product.timeIntervalValue || 1
    const pricePerBlock = editingLine.product.hourlyPrice || 0
    const displayMinutes = Math.floor(elapsedSeconds / 60)
    const displaySeconds = Math.floor(elapsedSeconds % 60)

    // Format start/end times for display
    const startDate = new Date(startTimeStr.endsWith('Z') ? startTimeStr : `${startTimeStr}Z`)
    const endDate = workingEndTime
        ? new Date(workingEndTime.endsWith('Z') ? workingEndTime : `${workingEndTime}Z`)
        : now

    const startHHMM = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
    const endHHMM = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
    const displayPrice = Math.floor(totalPrice)

    function handleSave() {
        onSave(editingLine!.id, {
            startTime: workingStartTime,
            endTime: workingEndTime,
            note: lineNote,
        })
    }

    function handleStopTimer() {
        const endNow = new Date().toISOString()
        onSave(editingLine!.id, {
            startTime: workingStartTime,
            endTime: endNow,
            note: lineNote,
        })
    }

    function handleResumeTimer() {
        onSave(editingLine!.id, {
            startTime: workingStartTime,
            endTime: undefined,
            note: lineNote,
        })
    }

    function openTimeAdjustment() {
        setTempStartTime(workingStartTime || initialOrderCreatedAt || new Date().toISOString())
        setTempEndTime(workingEndTime || '')
        setShowTimeAdjustment(true)
    }

    function confirmTimeAdjustment() {
        setWorkingStartTime(tempStartTime)
        setWorkingEndTime(tempEndTime || undefined)
        setShowTimeAdjustment(false)
    }

    return (
        <>
            {/* Main Time Edit Modal */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 10000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    width: '800px', height: '650px', background: '#fff', borderRadius: '8px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}>
                    {/* Modal Header */}
                    <div style={{
                        height: '50px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
                    }}>
                        <div style={{ flex: 1 }} />
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#334155' }}>
                            {editingLine.product.name.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={onClose}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: '24px' }}
                            >✕</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', height: '50px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '3px solid #0091ff', color: '#0091ff', fontWeight: 'bold', cursor: 'pointer' }}>
                            Phần chung
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                            Khuyến mại
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div style={{ padding: '24px', background: '#f8fafc', flex: 1, overflowY: 'auto' }}>
                        <div style={{
                            background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0',
                            padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '16px' }}>Thời gian sử dụng</span>
                                <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '16px' }}>Tạm tính</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '18px', color: '#1e293b' }}>
                                    {displayMinutes} phút {displaySeconds} giây Khác
                                </span>
                                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#334155' }}>
                                    {displayPrice.toLocaleString()}<u>đ</u>
                                </span>
                            </div>

                            <div style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', marginTop: '4px', marginBottom: '20px' }}>
                                Tính tiền mỗi {intervalMinutes} phút - {pricePerBlock.toLocaleString()}đ. Thời gian nhỏ hơn {intervalMinutes} phút sẽ được làm tròn thành {intervalMinutes} phút
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>
                                    Từ {startHHMM} - {endHHMM} ({displayMinutes} phút {displaySeconds} giây)
                                </span>
                                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>
                                    Thành tiền: {displayPrice.toLocaleString()}<u>đ</u>
                                </span>
                            </div>

                            <div style={{ textAlign: 'right', marginTop: '12px' }}>
                                <button
                                    onClick={openTimeAdjustment}
                                    style={{ border: 'none', background: 'transparent', color: '#0091ff', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}
                                >
                                    Chỉnh sửa thời gian sử dụng
                                </button>
                            </div>
                        </div>

                        {/* Note Section */}
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Ghi chú</div>
                            <div style={{ display: 'flex' }}>
                                <input
                                    type="text"
                                    placeholder="Ghi chú"
                                    value={lineNote}
                                    onChange={(e) => setLineNote(e.target.value)}
                                    style={{
                                        flex: 1, height: '50px', padding: '0 16px',
                                        border: '1px solid #cbd5e1', borderRadius: '4px 0 0 4px',
                                        outline: 'none', fontSize: '16px',
                                    }}
                                />
                                <button
                                    onClick={() => setLineNote('')}
                                    style={{
                                        width: '60px', background: '#f87171', color: '#fff', border: 'none',
                                        borderRadius: '0 4px 4px 0', cursor: 'pointer', fontWeight: 'bold',
                                    }}
                                >Xoá</button>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div style={{ height: '30px', padding: '0 24px', alignItems: 'center', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>* Bấm phím Esc để hủy thao tác và đóng popup</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>* Bấm phím Enter để lưu và tắt popup</span>
                    </div>

                    {/* Footer Actions */}
                    <div style={{
                        display: 'flex', height: '80px', background: '#fff', borderTop: '1px solid #e2e8f0',
                        padding: '0 20px', alignItems: 'center', justifyContent: 'flex-end', gap: '10px',
                    }}>
                        <div style={{ display: 'flex', background: '#fff', width: '120px', height: '50px', gap: '2px', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <button style={{ flex: 1, border: 'none', background: '#f8fafc', fontSize: '20px', cursor: 'pointer' }}>▲</button>
                            <button style={{ flex: 1, border: 'none', background: '#f8fafc', fontSize: '20px', cursor: 'pointer', borderLeft: '1px solid #e2e8f0' }}>▼</button>
                        </div>

                        {workingEndTime ? (
                            <button
                                onClick={handleResumeTimer}
                                style={{
                                    width: '300px', height: '50px', border: 'none', background: '#0ea5e9', color: '#fff',
                                    fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', borderRadius: '4px',
                                }}
                            >
                                TIẾP TỤC TÍNH GIỜ
                            </button>
                        ) : (
                            <button
                                onClick={handleStopTimer}
                                style={{
                                    width: '300px', height: '50px', border: 'none', background: '#10b981', color: '#fff',
                                    fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', borderRadius: '4px',
                                }}
                            >
                                TẠM NGỪNG TÍNH GIỜ
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            style={{
                                width: '300px', height: '50px', border: 'none', background: '#0ea5e9', color: '#fff',
                                fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', borderRadius: '4px',
                            }}
                        >
                            LƯU
                        </button>
                    </div>
                </div>
            </div>

            {/* Time Adjustment Sub-Modal */}
            {showTimeAdjustment && (
                <TimeAdjustmentModal
                    tempStartTime={tempStartTime}
                    tempEndTime={tempEndTime}
                    onTempStartTimeChange={setTempStartTime}
                    onTempEndTimeChange={setTempEndTime}
                    onConfirm={confirmTimeAdjustment}
                    onClose={() => setShowTimeAdjustment(false)}
                />
            )}
        </>
    )
}
