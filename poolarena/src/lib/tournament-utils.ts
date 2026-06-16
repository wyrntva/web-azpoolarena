export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\./.test(hostname)) {
      return `http://${hostname}:8000`;
    }
    return process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

// Resolve a possibly-relative image path to an absolute URL pointing at the backend.
export const resolveImageUrl = (path: string | null | undefined, fallback: string): string => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${getApiBase()}${path}`;
};

const RANK_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export const sortRanks = (ranks: string[]): string[] =>
  [...ranks].sort((a, b) => {
    const indexA = RANK_ORDER.indexOf(a.toUpperCase());
    const indexB = RANK_ORDER.indexOf(b.toUpperCase());
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

export const generateSlug = (name: string, startDate: Date | null): string => {
  const nameSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const dateSlug = startDate
    ? startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '')
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');

  return `${nameSlug}-${dateSlug}`;
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (!amount) return '0₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
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

export const formatLevelRange = (ranks: string[] | null | undefined): string => {
  if (!ranks || ranks.length === 0) return 'Tất cả level';
  const sorted = sortRanks(ranks).reverse();
  const mappedLevels = sorted.map(r => {
    const lvl = formatLevel(r);
    return lvl.replace('Lv .', '').replace('Level ', '');
  });
  const uniqueLevels = Array.from(new Set(mappedLevels));
  if (uniqueLevels.length === 1) {
    const lvl = uniqueLevels[0];
    return `Level ${lvl}`;
  }
  return `Level ${uniqueLevels.join('-')}`;
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

