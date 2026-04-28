/**
 * Time Adjustment Sub-Modal — allows manual editing of start/end times.
 * Extracted from TimeEditModal.tsx for maintainability.
 */

// ============================================
// TYPES
// ============================================

interface TimeAdjustmentModalProps {
    tempStartTime: string
    tempEndTime: string
    onTempStartTimeChange: (value: string) => void
    onTempEndTimeChange: (value: string) => void
    onConfirm: () => void
    onClose: () => void
}

// ============================================
// ICONS
// ============================================

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
        <path
            d="M3 9H21M7 3V5M17 3V5M6 12H8M11 12H13M16 12H18M6 15H8M11 15H13M16 15H18M6 18H8M11 18H13M16 18H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"
            stroke="#adb5bd" strokeWidth="2" strokeLinecap="round"
        />
    </svg>
)

const ClockIcon = () => (
    <svg fill="#adb5bd" width="20" height="20" viewBox="0 0 385.834 385.834" stroke="#adb5bd" strokeWidth="3.858">
        <g><g>
            <path d="M376.333,85.792c-18.055-29.852-56.173-40.254-86.716-24.439c-27.039-20.086-60.506-31.986-96.7-31.986 c-36.195,0-69.661,11.9-96.7,31.986C65.675,45.538,27.556,55.94,9.501,85.792c-18.695,30.911-8.938,71.196,21.695,90.178 c-0.51,5.232-0.779,10.534-0.779,15.897c0,46.826,19.917,89.082,51.715,118.764l-24.497,24.497 c-4.882,4.882-4.881,12.796,0,17.678c2.441,2.441,5.64,3.661,8.839,3.661c3.199,0,6.398-1.221,8.839-3.661l26.467-26.468 c26.008,17.684,57.386,28.029,91.137,28.029s65.129-10.347,91.137-28.029l26.467,26.468c2.44,2.44,5.641,3.661,8.84,3.661 c3.198,0,6.397-1.22,8.839-3.661c4.881-4.881,4.882-12.796,0-17.678l-24.497-24.497c31.798-29.682,51.715-71.938,51.715-118.764 c0-5.364-0.27-10.666-0.779-15.897C385.271,156.988,395.028,116.703,376.333,85.792z M30.893,98.73 c9.378-15.505,27.475-22.559,44.244-18.704c-18.036,18.984-31.538,42.312-38.768,68.229 C23.876,135.212,21.11,114.905,30.893,98.73z M192.917,329.367c-75.818,0-137.5-61.682-137.5-137.5s61.682-137.5,137.5-137.5 c75.818,0,137.5,61.682,137.5,137.5S268.735,329.367,192.917,329.367z M349.465,148.255c-7.229-25.917-20.73-49.245-38.768-68.229 c16.769-3.854,34.866,3.199,44.244,18.704C364.724,114.905,361.958,135.212,349.465,148.255z" />
            <path d="M205.457,188.268V88.066c0-6.903-5.597-12.5-12.5-12.5c-6.903,0-12.5,5.597-12.5,12.5v112.702 c0,6.903,5.597,12.5,12.5,12.5h92.433c6.903,0,12.5-5.597,12.5-12.5s-5.597-12.5-12.5-12.5H205.457z" />
        </g></g>
    </svg>
)

// ============================================
// DATE/TIME INPUT ROW
// ============================================

function DateTimeInputRow({
    label,
    dateValue,
    timeValue,
    onDateChange,
    onTimeChange,
    onClear,
    onFocus,
}: {
    label: string
    dateValue: string
    timeValue: string
    onDateChange: (value: string) => void
    onTimeChange: (value: string) => void
    onClear?: () => void
    onFocus?: () => void
}) {
    return (
        <div>
            <div style={{ marginBottom: '8px', color: '#333' }}>{label}</div>
            <div
                onClick={onFocus}
                style={{ display: 'flex', border: '1px solid #ced4da', borderRadius: '4px', overflow: 'hidden' }}
            >
                <div style={{ padding: '8px', borderRight: '1px solid #ced4da', display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon />
                </div>
                <input
                    type="date"
                    value={dateValue}
                    onFocus={onFocus}
                    onChange={(e) => onDateChange(e.target.value)}
                    style={{ flex: 1, border: 'none', padding: '8px', outline: 'none' }}
                />
                <div style={{ padding: '8px', borderLeft: '1px solid #ced4da', borderRight: '1px solid #ced4da', display: 'flex', alignItems: 'center' }}>
                    <ClockIcon />
                </div>
                <input
                    type="time"
                    value={timeValue}
                    onFocus={onFocus}
                    onChange={(e) => onTimeChange(e.target.value)}
                    style={{ width: '80px', border: 'none', padding: '8px', outline: 'none' }}
                />
                {onClear && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        style={{ padding: '8px', background: '#adb5bd', color: '#fff', cursor: 'pointer' }}
                    >Xoá</div>
                )}
            </div>
        </div>
    )
}

// ============================================
// COMPONENT
// ============================================

export default function TimeAdjustmentModal({
    tempStartTime,
    tempEndTime,
    onTempStartTimeChange,
    onTempEndTimeChange,
    onConfirm,
    onClose,
}: TimeAdjustmentModalProps) {
    // Parse values for date/time inputs
    const startDateValue = tempStartTime.split('T')[0]
    const startTimeValue = tempStartTime
        ? new Date(tempStartTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : ''
    const endDateValue = tempEndTime ? tempEndTime.split('T')[0] : ''
    const endTimeValue = tempEndTime
        ? new Date(tempEndTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : ''

    const ensureEndTime = () => {
        if (!tempEndTime) onTempEndTimeChange(new Date().toISOString())
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 11000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                width: '730px', height: '400px', background: '#fff', borderRadius: '4px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            }}>
                {/* Header */}
                <div style={{ height: '50px', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>Điều chỉnh thời gian sử dụng</span>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', right: '15px', border: 'none', background: 'transparent', color: '#ef4444', fontSize: '20px', cursor: 'pointer' }}
                    >✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <DateTimeInputRow
                            label="Thời gian bắt đầu"
                            dateValue={startDateValue}
                            timeValue={startTimeValue}
                            onDateChange={(date) => {
                                const timePart = tempStartTime.split('T')[1] || '00:00:00.000Z'
                                onTempStartTimeChange(date + 'T' + timePart)
                            }}
                            onTimeChange={(time) => {
                                const datePart = tempStartTime.split('T')[0]
                                onTempStartTimeChange(datePart + 'T' + time + ':00.000Z')
                            }}
                        />
                        <DateTimeInputRow
                            label="Thời gian kết thúc"
                            dateValue={endDateValue}
                            timeValue={endTimeValue}
                            onDateChange={(date) => {
                                const timePart = tempEndTime ? (tempEndTime.split('T')[1] || '00:00:00.000Z') : '00:00:00.000Z'
                                onTempEndTimeChange(date + 'T' + timePart)
                            }}
                            onTimeChange={(time) => {
                                const datePart = tempEndTime ? tempEndTime.split('T')[0] : new Date().toISOString().split('T')[0]
                                onTempEndTimeChange(datePart + 'T' + time + ':00.000Z')
                            }}
                            onClear={() => onTempEndTimeChange('')}
                            onFocus={ensureEndTime}
                        />
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#6c757d', marginBottom: '8px' }}>Lưu ý:</div>
                        <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '4px' }}>- Thời gian bắt đầu không được vượt quá thời gian hiện tại.</div>
                        <div style={{ color: '#6c757d', fontSize: '14px' }}>- Thời gian kết thúc lớn hơn thời gian bắt đầu.</div>
                    </div>
                </div>

                {/* Footer */}
                <button
                    onClick={onConfirm}
                    style={{
                        height: '50px', background: '#00a3e0', color: '#fff', border: 'none',
                        fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
                    }}
                >
                    XÁC NHẬN
                </button>
            </div>
        </div>
    )
}
