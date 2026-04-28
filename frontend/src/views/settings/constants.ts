/**
 * Constants and configuration data for Settings page.
 * Extracted to reduce noise in the main Settings component.
 */

// ============================================
// TYPES
// ============================================

export interface SettingItem {
    icon: string;
    title: string;
    description: string;
    url?: string;
    action?: string;
    disabled?: boolean;
}

export interface SettingSection {
    title: string;
    items: SettingItem[];
}

export interface StoreInfo {
    name: string;
    phone: string;
    currency: string;
    address: string;
    useNewAddress: boolean;
    province: string;
    district: string;
    ward: string;
    businessType: string;
}

export interface SocialMediaInfo {
    tiktok: string;
    facebook: string;
    youtube: string;
    phone: string;
    gmail: string;
    address: string;
}

// ============================================
// LOCATION DATA
// ============================================

export const PROVINCES = [
    'Thành phố Hà Nội',
    'Thành phố Hồ Chí Minh',
    'Thành phố Đà Nẵng',
    'Thành phố Hải Phòng',
    'Thành phố Cần Thơ',
];

export const DISTRICTS: Record<string, string[]> = {
    'Thành phố Hà Nội': ['Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên', 'Quận Cầu Giấy', 'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai', 'Quận Thanh Xuân'],
    'Thành phố Hồ Chí Minh': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10'],
    'Thành phố Đà Nẵng': ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Liên Chiểu'],
    'Thành phố Hải Phòng': ['Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An', 'Quận Kiến An'],
    'Thành phố Cần Thơ': ['Quận Ninh Kiều', 'Quận Bình Thủy', 'Quận Cái Răng', 'Quận Ô Môn', 'Quận Thốt Nốt'],
};

export const WARDS: Record<string, string[]> = {
    'Quận Tây Hồ': ['Phường Bưởi', 'Phường Thụy Khuê', 'Phường Yên Phụ', 'Phường Tứ Liên', 'Phường Nhật Tân', 'Phường Quảng An', 'Phường Xuân La', 'Phường Phú Thượng'],
    'Quận Ba Đình': ['Phường Cống Vị', 'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai'],
    'Quận Hoàn Kiếm': ['Phường Hàng Bạc', 'Phường Hàng Bài', 'Phường Hàng Bông', 'Phường Hàng Buồm', 'Phường Hàng Đào'],
};

export const BUSINESS_TYPES = ['Nhà hàng', 'Quán cà phê', 'Quán bi-a', 'Khác'];

export const CURRENCIES = [
    { value: 'VND', label: 'Việt Nam đồng (VND)' },
    { value: 'USD', label: 'US Dollar (USD)' },
];

// ============================================
// SETTING SECTIONS CONFIG
// ============================================

export const SETTING_SECTIONS: SettingSection[] = [
    {
        title: 'Thiết lập thông tin',
        items: [
            {
                icon: 'solar:shop-2-outline',
                title: 'Thông tin cửa hàng',
                description: 'Xem và điều chỉnh thông tin cửa hàng của bạn',
                action: 'store-info',
            },
            {
                icon: 'solar:user-circle-outline',
                title: 'Thiết lập thông tin mạng xã hội',
                description: 'Xem và điều chỉnh thông tin mạng xã hội của bạn',
                action: 'social-media',
            },
            {
                icon: 'solar:gallery-outline',
                title: 'Thiết lập banner quảng cáo',
                description: 'Xem và điều chỉnh banner quảng cáo của bạn',
                action: 'banner',
            },
        ],
    },
    {
        title: 'Thiết lập chức năng',
        items: [
            { icon: 'solar:ruler-outline', title: 'Thiết lập đơn vị', description: 'Xem và thiết lập thông tin đơn vị tính của bạn', url: '/units' },
            { icon: 'solar:cart-large-2-outline', title: 'Thiết lập bán hàng', description: 'Xem và thiết lập các chế độ bán hàng trong cửa hàng', url: '/settings/sales', disabled: true },
            { icon: 'solar:monitor-outline', title: 'Thiết lập thiết bị', description: 'Xem và thiết lập các thiết bị bán hàng và phục vụ', url: '/settings/devices' },
            { icon: 'solar:power-outline', title: 'Thiết lập công tắc', description: 'Quản lý công tắc đèn bàn, scoreboard, tivi và thiết bị khác', url: '/settings/switches' },
            { icon: 'solar:map-point-outline', title: 'Thiết lập khu vực', description: 'Xem và thiết lập quản lý bàn/phòng trong cửa hàng', url: '/settings/areas' },
            { icon: 'solar:chef-hat-outline', title: 'Thiết lập bếp', description: 'Xem và thiết lập quản lý bếp trong cửa hàng', url: '/settings/kitchen', disabled: true },
            { icon: 'solar:chart-2-outline', title: 'Thiết lập báo cáo', description: 'Xem và điều chỉnh báo cáo', url: '/reports' },
            { icon: 'solar:printer-outline', title: 'Thiết lập in', description: 'Xem và thiết lập máy in, mẫu in của cửa hàng', url: '/settings/print', disabled: true },
            { icon: 'solar:card-outline', title: 'Phương thức thanh toán', description: 'Xem và thiết lập các phương thức thanh toán của cửa hàng', url: '/settings/payment', disabled: true },
            { icon: 'solar:document-outline', title: 'Hoá đơn điện tử', description: 'Thiết lập sử dụng hoá đơn điện tử cho cửa hàng', url: '/settings/invoice', disabled: true },
            { icon: 'solar:clock-circle-outline', title: 'Thiết lập chấm công', description: 'Xem và thiết lập quy tắc chấm công cho nhân viên', url: '/attendance/settings' },
            { icon: 'solar:trophy-outline', title: 'Thiết lập giải đấu', description: 'Xem và thiết lập hạng, vòng đấu và quy tắc tính điểm', url: '/tournament-settings' },
        ],
    },
];

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_STORE_INFO: StoreInfo = {
    name: 'AZ POOLARENA',
    phone: '0842486222',
    currency: 'VND',
    address: 'Tháp Đông- CC Học Viện Quốc Phòng',
    useNewAddress: false,
    province: 'Thành phố Hà Nội',
    district: 'Quận Tây Hồ',
    ward: 'Phường Xuân La',
    businessType: 'Khác',
};

export const DEFAULT_SOCIAL_MEDIA: SocialMediaInfo = {
    tiktok: '',
    facebook: '',
    youtube: '',
    phone: '',
    gmail: '',
    address: '',
};
