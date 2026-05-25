/**
 * Product Card — displays a product tile in the cashier product grid.
 * Extracted from CashierScreen.tsx for reusability and maintainability.
 */
import { type Product } from '../../types'
import { API_BASE_URL } from '../../config'

interface ProductCardProps {
    product: Product
    onAddToCart: (p: Product) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const isTimeBased = product.type === 'Tính tiền theo thời gian'
    const priceLabel = isTimeBased
        ? `${(product.hourlyPrice || 0).toLocaleString()}đ/${product.timeIntervalValue || 1}${product.timeIntervalUnit?.substring(0, 1) || 'p'}`
        : `${(product.price || 0).toLocaleString()}đ${product.unit ? `/${product.unit}` : ''}`

    const imageUrl = product.image
        ? (product.image.startsWith('http') || product.image.startsWith('data:')
            ? product.image
            : `${API_BASE_URL}${product.image.startsWith('/') ? '' : '/'}${product.image}`)
        : null

    return (
        <div className='prodCard' onClick={() => onAddToCart(product)} style={{ width: 200, height: 210, position: 'relative', borderRadius: 0, overflow: 'hidden', margin: 0, background: '#fff' }}>
            {/* Price Tag */}
            <div className='prodPriceTag' style={{
                zIndex: 10, position: 'absolute', top: 8, left: 8, right: 'auto',
                height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, fontSize: 14, width: 'auto', background: '#007acc', color: '#fff',
            }}>
                {priceLabel}
            </div>

            {/* Image or Fallback */}
            <div className='prodCardContent' style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                                const fallback = parent.querySelector('.fallback-container') as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                            }
                        }}
                    />
                )}
                <div
                    className='fallback-container'
                    style={{
                        display: imageUrl ? 'none' : 'flex',
                        width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
                        background: product.color || '#9ca3af', color: '#fff', fontWeight: 700,
                        fontSize: 72, textTransform: 'uppercase', userSelect: 'none',
                    }}
                >
                    {(product.name || '?').trim().slice(0, 1)}
                </div>
            </div>

            {/* Name Label */}
            <div className='prodCardLabel' style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%',
                background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
                color: '#fff', padding: 8, textAlign: 'center', fontSize: 14, fontWeight: 400,
            }}>
                {product.name}
            </div>
        </div>
    )
}
