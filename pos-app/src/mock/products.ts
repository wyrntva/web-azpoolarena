export type MockProduct = {
  id: number
  code: string
  name: string
  price: number
  priceUnit?: string // e.g., "3 phút"
  barcode?: string
  category: string
  image?: string
}

export const CATEGORIES = [
  'BIDA',
  'COMBO NGÀY',
  'NƯỚC ĐÓNG CHAI',
  'TRÀ',
  'THUỐC LÁ',
  'CÀ PHÊ',
  'NƯỚC ÉP',
]

export const MOCK_PRODUCTS: MockProduct[] = [
  // BIDA
  { id: 1, code: 'BIDA001', name: 'GIỜ CHƠI BIDA', price: 3450, priceUnit: '3 phút', category: 'BIDA', image: '🎱' },
  { id: 2, code: 'BIDA002', name: 'Poolarena.vn', price: 4000, priceUnit: '3 phút', category: 'BIDA', image: '🎯' },
  { id: 3, code: 'BIDA003', name: 'Gậy thuê', price: 30000, category: 'BIDA', image: '🏓' },
  { id: 4, code: 'BIDA004', name: 'Khăn ướt', price: 5000, category: 'BIDA', image: '🧻' },
  
  // COMBO NGÀY
  { id: 5, code: 'COMBO001', name: 'Combo 1 giờ', price: 69000, category: 'COMBO NGÀY', image: '🍽️' },
  { id: 6, code: 'COMBO002', name: 'Combo 2 giờ', price: 120000, category: 'COMBO NGÀY', image: '🍽️' },
  
  // NƯỚC ĐÓNG CHAI
  { id: 7, code: 'NUOC001', name: 'Nước suối 500ml', price: 10000, category: 'NƯỚC ĐÓNG CHAI', image: '💧' },
  { id: 8, code: 'NUOC002', name: 'Coca Cola lon', price: 15000, category: 'NƯỚC ĐÓNG CHAI', image: '🥤' },
  
  // TRÀ
  { id: 9, code: 'TRA001', name: 'Trà đá', price: 10000, category: 'TRÀ', image: '🍵' },
  { id: 10, code: 'TRA002', name: 'Trà sữa size M', price: 35000, category: 'TRÀ', image: '🧋' },
  
  // THUỐC LÁ
  { id: 11, code: 'THUOC001', name: 'Thuốc lá', price: 25000, category: 'THUỐC LÁ', image: '🚬' },
  
  // CÀ PHÊ
  { id: 12, code: 'CF001', name: 'Cà phê đá', price: 25000, category: 'CÀ PHÊ', image: '☕' },
  { id: 13, code: 'CF002', name: 'Cà phê sữa', price: 30000, category: 'CÀ PHÊ', image: '☕' },
  
  // NƯỚC ÉP
  { id: 14, code: 'EP001', name: 'Nước ép cam', price: 40000, category: 'NƯỚC ÉP', image: '🍊' },
  { id: 15, code: 'EP002', name: 'Nước ép dưa hấu', price: 35000, category: 'NƯỚC ÉP', image: '🍉' },
]

