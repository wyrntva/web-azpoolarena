export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000`;
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
