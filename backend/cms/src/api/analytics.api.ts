import axiosClient from './axiosClient';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Ga4Summary {
  sessions: number;
  users: number;
  pageviews: number;
  bounce_rate: number;          // percent (0–100)
  avg_session_duration: number; // seconds
}

export interface Ga4TopPage {
  path: string;
  title: string;
  pageviews: number;
  users: number;
}

export interface Ga4TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

export interface Ga4Device {
  device: string;
  sessions: number;
  users: number;
}

export interface Ga4Country {
  country: string;
  sessions: number;
  users: number;
}

export interface Ga4Data {
  summary: Ga4Summary;
  top_pages: Ga4TopPage[];
  traffic_sources: Ga4TrafficSource[];
  devices: Ga4Device[];
  countries: Ga4Country[];
}

export interface DayCount {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface NewUsersToday {
  count: number;
  growth_percent: number | null; // null nếu hôm qua = 0 user
}

export interface AnalyticsOverview {
  ga4: Ga4Data | null;         // null nếu GA4 chưa cấu hình
  new_users_today: NewUsersToday;
  new_users_chart: DayCount[];
  returning_users_chart: DayCount[];
}

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ dữ liệu dashboard analytics một lần.
 * @param startDate  GA4 date string, e.g. "30daysAgo" | "2024-01-01"
 * @param endDate    GA4 date string, e.g. "today"     | "2024-01-31"
 */
export const getAnalyticsOverview = (
  startDate = '30daysAgo',
  endDate = 'today',
): Promise<AnalyticsOverview> =>
  axiosClient
    .get<AnalyticsOverview>('/api/analytics/overview', {
      params: { startDate, endDate },
    })
    .then((r) => r.data);

export const getNewUsers = (): Promise<{
  today: NewUsersToday;
  chart: DayCount[];
}> =>
  axiosClient
    .get('/api/analytics/new-users')
    .then((r) => r.data);

export const getReturningUsers = (): Promise<{ chart: DayCount[] }> =>
  axiosClient
    .get('/api/analytics/returning-users')
    .then((r) => r.data);
