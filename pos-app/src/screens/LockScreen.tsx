import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import { login } from '../services/api'

export default function LockScreen(props: { onLogin: () => void }) {
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeText = useMemo(() => {
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }, [now])

  const dateText = useMemo(() => {
    return now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [now])

  function appendDigit(d: string) {
    if (loading) return
    setPinError(null)
    // Limit to 4 digits
    setPin(prev => (prev.length >= 4 ? prev : prev + d))
  }

  function backspace() {
    if (loading) return
    setPinError(null)
    setPin(prev => prev.slice(0, -1))
  }

  function clearPin() {
    if (loading) return
    setPinError(null)
    setPin('')
  }

  async function handleLogin() {
    if (loading) return
    if (pin.length < 4) {
      setPinError('Vui lòng nhập mã PIN (tối thiểu 4 số)')
      return
    }

    try {
      setLoading(true)
      setPinError(null)

      // Call API Login
      await login({ pin })

      // If successful, reset and notify parent
      setPin('')
      props.onLogin()
    } catch (err: any) {
      console.error(err)
      setPinError(err.message || 'Đăng nhập thất bại')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  // Auto-login when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      handleLogin()
    }
  }, [pin])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (loading) return
      if (e.key >= '0' && e.key <= '9') appendDigit(e.key)
      if (e.key === 'Backspace') backspace()
      if (e.key === 'Escape') clearPin()
      // Enter is no longer strictly needed but good to keep
      if (e.key === 'Enter') handleLogin()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pin, loading])

  return (
    <div className='lockScreen'>
      <div className='lockLeft'>
        <div className='brandRow'>
          <div className='brandDot' />
          <div>
            <div className='brandName'>AZ POOLARENA</div>
            <div className='brandAddr'>Tháp Đông - CC Học Viện Quốc Phòng, Phường Xuân La, Quận Tây Hồ, Thành phố Hà Nội</div>
          </div>
        </div>

        <div className='clockWrap'>
          <div className='clockTime'>{timeText}</div>
          <div className='clockDate'>{dateText}</div>
        </div>

        <div className='footerRow'>
          <div className='footerLeft'>
            <div className='footerMeta'>
              <div>Hotline: 1900 6750</div>
              <div>Mã cửa hàng: 72405</div>
              <div>Version: 1.0.0</div>
            </div>
          </div>
          <div className='footerHint'>Bản demo UI (POS Electron)</div>
        </div>
      </div>

      <div className='lockRight'>
        <div className='pinPanel'>
          <div className='pinDots'>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={`dot ${pin.length > idx ? 'filled' : ''}`} />
            ))}
          </div>

          <div className='pinPad'>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button key={n} className='keyBtn' onClick={() => appendDigit(n)} disabled={loading}>{n}</button>
            ))}
            <button className='keyBtn zero' onClick={() => appendDigit('0')} disabled={loading}>0</button>
            <button className='keyBtn back' onClick={backspace} disabled={loading}>←</button>
          </div>

          {pinError && <div className='pinError'>{pinError}</div>}

          {/* Hide login button or keep it disabled/loading style */}
          <button className='loginBtn' onClick={handleLogin} disabled={loading || pin.length < 4}>
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập chủ nhà hàng'}
          </button>

          <div className='actionsRow'>
            <button className='warnBtn' onClick={() => window.close()}>Tắt ứng dụng</button>
            <button className='dangerBtn' onClick={() => clearPin()}>Tắt máy</button>
          </div>

          <div className='pinTools'>
            <button className='linkBtn' onClick={clearPin}>Xoá PIN</button>
            <div className='pinHint'>PIN demo: 1105</div>
          </div>
        </div>
      </div>
    </div>
  )
}
