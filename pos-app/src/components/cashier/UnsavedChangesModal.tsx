interface UnsavedChangesModalProps {
    isOpen: boolean
    onClose: () => void
    onDiscardAndExit: () => void
    onSaveAndExit: () => void
}

/**
 * Warning modal shown when the user tries to exit with unsaved changes.
 * Offers two options: discard changes or save and exit.
 */
export default function UnsavedChangesModal({
    isOpen,
    onClose,
    onDiscardAndExit,
    onSaveAndExit,
}: UnsavedChangesModalProps) {
    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 20000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                width: '640px', height: '270px', background: '#fff', borderRadius: '4px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}>
                {/* Header */}
                <div style={{
                    height: '50px', background: '#f8fafc', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', position: 'relative',
                    borderBottom: '1px solid #e2e8f0',
                }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>
                        Thông tin chưa được lưu
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', right: '15px', border: 'none', background: 'transparent',
                            fontSize: '22px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                    >✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '0 20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '18px', color: '#334155', lineHeight: '1.6', fontWeight: '500' }}>
                        Có thay đổi &amp; thông tin đơn hàng chưa được lưu.<br />
                        Bạn có muốn tiếp tục thao tác ?
                    </p>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', height: '60px' }}>
                    <button
                        onClick={onDiscardAndExit}
                        style={{
                            flex: 1, background: '#e57373', color: '#fff', border: 'none',
                            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#ef5350')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#e57373')}
                    >
                        Không lưu, thoát ngay
                    </button>
                    <button
                        onClick={onSaveAndExit}
                        style={{
                            flex: 1, background: '#0091ff', color: '#fff', border: 'none',
                            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#0070d2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#0091ff')}
                    >
                        Lưu đơn và thoát
                    </button>
                </div>
            </div>
        </div>
    )
}
