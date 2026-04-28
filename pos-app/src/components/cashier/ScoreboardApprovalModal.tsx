import React from 'react'

interface ScoreboardApprovalModalProps {
    order: any | null
    remainingCount?: number
    onConfirm: () => void
    onReject: () => void
}

export default function ScoreboardApprovalModal({ order, remainingCount = 0, onConfirm, onReject }: ScoreboardApprovalModalProps) {
    if (!order) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 20000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                width: '640px', background: '#fff', borderRadius: '4px',
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
                        XÁC NHẬN ORDER TỪ BẢNG ĐIỂM
                    </span>
                    <button
                        onClick={onReject}
                        style={{
                            position: 'absolute', right: '15px', border: 'none', background: 'transparent',
                            fontSize: '22px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                    >✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0091ff' }}>{order.tableName || `Bàn ${order.tableNumber}`}</div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: 4 }}>
                            Danh sách các món muốn thêm:
                        </div>
                        {remainingCount > 0 && (
                            <div style={{ fontSize: '13px', color: '#ef4444', marginTop: 8, fontStyle: 'italic' }}>
                                (Lưu ý: Còn {remainingCount} đơn khác đang chờ duyệt)
                            </div>
                        )}
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflowY: 'auto', maxHeight: '250px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 600, fontSize: '14px' }}>Tên món</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#334155', fontWeight: 600, fontSize: '14px', width: '60px' }}>SL</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#334155', fontWeight: 600, fontSize: '14px', width: '120px' }}>Đơn giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items?.map((item: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px 12px', color: '#0f172a', fontSize: '14px' }}>
                                            {item.product?.name || `Sản phẩm ${item.productId || item.product_id}`}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#0091ff', fontWeight: 'bold', fontSize: '14px' }}>
                                            {item.qty}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#e53935', fontSize: '14px' }}>
                                            {Number(item.price || item.product?.price || 0).toLocaleString()}đ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', height: '60px' }}>
                    <button
                        onClick={onReject}
                        style={{
                            flex: 1, background: '#e57373', color: '#fff', border: 'none',
                            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#ef5350')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#e57373')}
                    >
                        TỪ CHỐI
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, background: '#0091ff', color: '#fff', border: 'none',
                            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#0070d2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#0091ff')}
                    >
                        XÁC NHẬN MÓN
                    </button>
                </div>
            </div>
        </div>
    )
}
