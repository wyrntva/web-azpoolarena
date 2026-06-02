import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

// Format currency to Vietnamese Dong
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

// Format number with thousand separators
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
};

// Format date to Vietnamese format
// Parse date safely, converting space-separated dates (like "2026-06-02 18:00:00") to T-separated to prevent parsing errors/quirks
export const parseDateSafe = (date: Date | string): Date => {
    if (typeof date === 'string') {
        let normalized = date.trim();
        if (normalized.includes(' ')) {
            normalized = normalized.replace(' ', 'T');
        }
        return new Date(normalized);
    }
    return date;
};

// Format date to Vietnamese format
export const formatDate = (date: Date | string): string => {
    const dateObj = parseDateSafe(date);
    return new Intl.DateTimeFormat('vi-VN').format(dateObj);
};

// Format datetime
export const formatDateTime = (date: Date | string): string => {
    const dateObj = parseDateSafe(date);
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
};

// Parse date string to dayjs object
export const parseDate = (dateString: string) => {
    return dayjs(dateString);
};
