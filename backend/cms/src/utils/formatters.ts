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

export const formatLevel = (rank: string | null | undefined): string => {
  if (!rank) return "Chưa có level";
  const cleanRank = rank.trim().toUpperCase().replace(/^HẠNG\s+/, '');
  switch (cleanRank) {
    case 'I': return 'Lv .1';
    case 'K': return 'Lv .1';
    case 'H': return 'Lv .2';
    case 'G': return 'Lv .3';
    case 'F': return 'Lv .4';
    case 'E': return 'Lv .5';
    case 'D': return 'Lv .6';
    case 'C': return 'Lv .7';
    case 'B': return 'Lv .8';
    case 'A': return 'Lv .9';
    case 'S': return 'Lv .10 (MASTER)';
    default:
      if (cleanRank.startsWith('LV')) return rank;
      if (/^\d+$/.test(cleanRank)) return `Lv .${cleanRank}`;
      return `Level ${rank}`;
  }
};

export const formatFullLevel = (rank: string | null | undefined): string => {
  if (!rank) return "Chưa có level";
  const cleanRank = rank.trim().toUpperCase().replace(/^HẠNG\s+/, '');
  switch (cleanRank) {
    case 'I': return 'Level 1';
    case 'K': return 'Level 1';
    case 'H': return 'Level 2';
    case 'G': return 'Level 3';
    case 'F': return 'Level 4';
    case 'E': return 'Level 5';
    case 'D': return 'Level 6';
    case 'C': return 'Level 7';
    case 'B': return 'Level 8';
    case 'A': return 'Level 9';
    case 'S': return 'Level 10 (MASTER)';
    default:
      if (cleanRank.startsWith('LV')) {
        return cleanRank.replace(/^LV\s*\.?\s*/i, 'Level ');
      }
      if (/^\d+$/.test(cleanRank)) return `Level ${cleanRank}`;
      return `Level ${rank}`;
  }
};

