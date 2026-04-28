import { useState, useRef, useEffect } from 'react'
import logoPoolarena from '../assets/logo-main.png'
import '../styles/screens/activation.css'

export default function ActivationScreen(props: { onActivated: () => void }) {
    const [showModal, setShowModal] = useState(false)
    const [deviceCode, setDeviceCode] = useState(['', '', '', '', '', ''])
    const [isActivating, setIsActivating] = useState(false)
    const [error, setError] = useState('')
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleCharInput = (index: number, value: string) => {
        const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (char.length > 1) return

        const newCode = [...deviceCode]
        newCode[index] = char
        setDeviceCode(newCode)
        setError('')

        // Auto focus next
        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !deviceCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === 'Enter' && deviceCode.every(c => c !== '')) {
            handleActivate()
        }
    }

    const handleActivate = async () => {
        const code = deviceCode.join('')
        if (code.length < 6) {
            setError('Mã phải đủ 6 ký tự')
            return
        }

        setIsActivating(true)
        setError('')

        try {
            // Get system info
            const platform = window.navigator.platform || 'Unknown'
            const userAgent = window.navigator.userAgent || ''
            let deviceOS = 'Unknown OS'

            if (userAgent.indexOf('Win') !== -1) deviceOS = 'Windows'
            else if (userAgent.indexOf('Mac') !== -1) deviceOS = 'macOS'
            else if (userAgent.indexOf('Linux') !== -1) deviceOS = 'Linux'
            else if (userAgent.indexOf('Android') !== -1) deviceOS = 'Android'

            // Import activation function
            const { activateDevice } = await import('../services/api')

            // Call activation API
            const response = await activateDevice({
                device_code: code.toUpperCase(),
                device_type: 'POS Terminal',
                device_os: deviceOS,
                device_app_version: '1.0.0',
                device_id: `POS-${Date.now()}` // Generate unique device ID
            })

            if (response.success) {
                // Save activation status
                localStorage.setItem('device_activated', 'true')
                localStorage.setItem('device_code', code.toUpperCase())
                localStorage.setItem('device_name', response.device_name || 'POS Device')

                // Trigger onActivated callback
                props.onActivated()
            } else {
                setError(response.message || 'Kích hoạt thất bại')
            }
        } catch (error: any) {
            console.error('Activation error:', error)
            setError(error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.')
        } finally {
            setIsActivating(false)
        }
    }

    return (
        <div className='activationScreen'>
            <div className='activationContent'>
                <div className='activationLogoContainer'>
                    <img src={logoPoolarena} alt="POOLARENA" className='activationLogo' />
                </div>

                <h1 className='activationTitle'>PHẦN MỀM THU NGÂN</h1>
                <p className='activationSubtitle'>
                    Dễ sử dụng - Tính tiền nhanh - Vận hành ổn định
                </p>

                <button
                    className='activationBtn'
                    onClick={() => setShowModal(true)}
                >
                    Kích hoạt bằng mã thiết bị
                </button>
            </div>

            <div className='activationFooter'>
                <div>Website: www.poolarena.vn</div>
                <div>Hotline: 0364756638</div>
            </div>

            {showModal && (
                <div className='activationModalOverlay'>
                    <div className='activationModal'>
                        <h2 className='modalTitle'>Nhập mã thiết bị</h2>
                        <p className='modalDesc'>
                            Vui lòng nhập mã 6 ký tự hiển thị trong trang Quản lý thiết bị.
                        </p>

                        <div className='codeInputs'>
                            {deviceCode.map((char, idx) => (
                                <input
                                    key={idx}
                                    ref={el => inputRefs.current[idx] = el}
                                    type="text"
                                    maxLength={1}
                                    value={char}
                                    onChange={(e) => handleCharInput(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    autoFocus={idx === 0}
                                />
                            ))}
                        </div>

                        {error && <div className='modalError'>{error}</div>}

                        <div className='modalActions'>
                            <button
                                className='modalCancelBtn'
                                onClick={() => setShowModal(false)}
                                disabled={isActivating}
                            >
                                Hủy
                            </button>
                            <button
                                className='modalConfirmBtn'
                                onClick={handleActivate}
                                disabled={isActivating || deviceCode.some(c => c === '')}
                            >
                                {isActivating ? 'Đang xử lý...' : 'Kích hoạt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
