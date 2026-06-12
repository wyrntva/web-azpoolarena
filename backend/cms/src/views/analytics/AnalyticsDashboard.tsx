import { useEffect, useState, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import {
  getAnalyticsOverview,
  type AnalyticsOverview,
  type DayCount,
} from '../../api/analytics.api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('vi-VN');

const SOURCE_MAP: Record<string, string> = {
  '(direct)':  'Trực tiếp',
  '(not set)': 'Không xác định',
  google:      'Google',
  facebook:    'Facebook',
  youtube:     'YouTube',
  instagram:   'Instagram',
  bing:        'Bing',
  yahoo:       'Yahoo',
  twitter:     'Twitter / X',
  tiktok:      'TikTok',
  zalo:        'Zalo',
};

const MEDIUM_MAP: Record<string, string> = {
  '(none)':    '—',
  '(not set)': '—',
  organic:     'Tìm kiếm tự nhiên',
  cpc:         'Quảng cáo CPC',
  referral:    'Liên kết ngoài',
  email:       'Email',
  social:      'Mạng xã hội',
  direct:      'Trực tiếp',
};

const SOURCE_ICON: Record<string, string> = {
  '(direct)':  'solar:link-minimalistic-2-bold-duotone',
  '(not set)': 'solar:question-circle-bold-duotone',
  google:      'logos:google-icon',
  facebook:    'logos:facebook',
  youtube:     'logos:youtube-icon',
  instagram:   'skill-icons:instagram',
  bing:        'logos:bing',
  twitter:     'logos:twitter',
  tiktok:      'logos:tiktok-icon',
  zalo:        'solar:chat-square-bold-duotone',
};

const fmtSource = (s: string) => SOURCE_MAP[s.toLowerCase()] ?? s;
const fmtMedium = (m: string) => MEDIUM_MAP[m.toLowerCase()] ?? m;
const sourceIcon = (s: string) => SOURCE_ICON[s.toLowerCase()] ?? 'solar:routing-bold-duotone';

const fmtDur = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}p ${sec}s` : `${sec}s`;
};

const fillDays = (data: DayCount[], days = 30): DayCount[] => {
  const map = new Map(data.map((d) => [d.date, d.count]));
  return Array.from({ length: days }, (_, i) => {
    const date = dayjs()
      .subtract(days - 1 - i, 'day')
      .format('YYYY-MM-DD');
    return { date, count: map.get(date) ?? 0 };
  });
};

const todayStr = dayjs().format('YYYY-MM-DD');

// ─── Sub-components ───────────────────────────────────────────────────────────

const GrowthBadge = ({ pct }: { pct: number | null }) => {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        up ? 'bg-lightsuccess text-success' : 'bg-lighterror text-error'
      }`}
    >
      <Icon icon={up ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} />
      {Math.abs(pct)}%
    </span>
  );
};

const StatCard = ({
  icon,
  bg,
  label,
  value,
  sub,
}: {
  icon: string;
  bg: string;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
    >
      <Icon icon={icon} className="text-2xl text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500 truncate">{label}</p>
      <p className="text-2xl font-bold text-dark leading-tight">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-semibold text-dark mb-3">{children}</h2>
);

const AnalyticsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <rect width="60" height="60" fill="none" />
    <path d="M34,53.91H12.33a.32.32,0,0,1-.32-.33V31.68a8.48,8.48,0,0,0,2.62.72V51a1,1,0,0,0,1,1H27.89a1,1,0,0,0,0-2H16.59V32.4a8.83,8.83,0,0,0,5.74-14.52H43.45V31.31a1,1,0,0,0,2,0V16.9a1,1,0,0,0-1-1H20A8.73,8.73,0,0,0,12,15.55V11.66a.32.32,0,0,1,.32-.33H22.49V13a1,1,0,0,0,1,1h13.1a1,1,0,0,0,1-1V11.33H47.71a.32.32,0,0,1,.32.33V32.25a1,1,0,0,0,2,0V11.66a2.3,2.3,0,0,0-2.29-2.29H37.55V9a1,1,0,0,0-1-1H34.28v-1a3,3,0,0,0-3-2.95H28.71a3,3,0,0,0-2.95,3v1H23.47a1,1,0,0,0-1,1v.33H12.33A2.3,2.3,0,0,0,10,11.66v5.09a8.84,8.84,0,0,0,0,13.73v23.1a2.3,2.3,0,0,0,2.29,2.3H34a1,1,0,0,0,0-2ZM28.71,6.09h2.62a1,1,0,0,1,1,1v1H27.73v-1A1,1,0,0,1,28.71,6.09ZM24.45,10H35.59v2H24.45ZM8.73,23.62a6.88,6.88,0,1,1,6.9,6.87h0A6.89,6.89,0,0,1,8.73,23.62Z" />
    <path d="M45.3,35.79a10.23,10.23,0,0,0-4.19.92l-.2-.34A1,1,0,0,0,39.57,36a11.51,11.51,0,0,0-5.72,9.93,1,1,0,0,0,1,1h.37A10.15,10.15,0,1,0,45.3,35.79Zm-5.57,2.46L43.6,45H35.87A9.54,9.54,0,0,1,39.73,38.25ZM45.3,54.13a8.19,8.19,0,0,1-8.12-7.21H45.3a1,1,0,0,0,.85-1.47l-4.06-7A8.19,8.19,0,1,1,45.3,54.13Z" />
    <path d="M24.33,34.49a1,1,0,0,0-1.39,0L20,37.39a1,1,0,0,0,0,1.39.94.94,0,0,0,.69.29,1,1,0,0,0,.7-.29l2.2-2.2,2,2a1,1,0,0,0,1.39,0l3.77-3.78,1.72,1.72a1,1,0,0,0,1.39,0L40,30.47a1,1,0,0,0,0-1.39,1,1,0,0,0-1.39,0l-5.38,5.39-1.72-1.72a1,1,0,0,0-1.39,0l-3.78,3.78Z" />
    <path d="M12.93,24.56a2.59,2.59,0,0,0,2,.26l1.9-.51a.63.63,0,0,1,.5.07.59.59,0,0,1,.3.39.66.66,0,0,1-.46.81l-2.85.76a1,1,0,0,0,.26,1.93c.08,0,1.2-.29,1.2-.29l.09.32a1,1,0,0,0,.94.73.78.78,0,0,0,.26,0,1,1,0,0,0,.69-1.2l-.08-.32h0a2.62,2.62,0,1,0-1.36-5.06l-1.89.51a.67.67,0,0,1-.5-.06.69.69,0,0,1-.31-.4.66.66,0,0,1,.47-.8l2.84-.77a1,1,0,0,0,.7-1.2A1,1,0,0,0,16.4,19l-.94.26-.09-.32a1,1,0,0,0-1.9.51l.09.32h0a2.62,2.62,0,0,0-.63,4.8Z" />
    <path d="M39.33,21H27.54a1,1,0,1,0,0,2H39.33a1,1,0,1,0,0-2Z" />
    <path d="M39.33,24.27H32.12a1,1,0,0,0,0,2h7.21a1,1,0,0,0,0-2Z" />
  </svg>
);

// ─── Chart helpers ────────────────────────────────────────────────────────────

const barOptions = (labels: string[], color: string) => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  colors: [color],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  dataLabels: { enabled: false },
  xaxis: { categories: labels, tickAmount: 6, labels: { style: { fontSize: '11px' } } },
  yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
  grid: { borderColor: '#e2e8f0' },
});

const areaOptions = (labels: string[]) => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#5b73e8', '#f59e0b'],
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 },
  },
  dataLabels: { enabled: false },
  xaxis: { categories: labels, tickAmount: 6, labels: { style: { fontSize: '11px' } } },
  yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
  legend: { position: 'top' },
  grid: { borderColor: '#e2e8f0' },
});

// ─── Date presets ─────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '7 ngày',  start: '7daysAgo',  end: 'today' },
  { label: '30 ngày', start: '30daysAgo', end: 'today' },
  { label: '90 ngày', start: '90daysAgo', end: 'today' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

const AnalyticsDashboard = () => {
  const [data, setData]       = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [preset, setPreset]   = useState(PRESETS[1]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAnalyticsOverview(preset.start, preset.end));
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => { load(); }, [load]);

  const newFilled      = data ? fillDays(data.new_users_chart)      : [];
  const retFilled      = data ? fillDays(data.returning_users_chart) : [];
  const chartLabels    = newFilled.map((d) => dayjs(d.date).format('DD/MM'));
  const todayRetCount  = data
    ? (data.returning_users_chart.find((d) => d.date === todayStr)?.count ?? 0)
    : 0;

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Bảng điều khiển phân tích</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Theo dõi traffic, tài khoản mới và tương tác người dùng
          </p>
        </div>
        <div className="flex items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPreset(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                preset.label === p.label
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={load}
            title="Làm mới"
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-primary transition-colors"
          >
            <Icon icon="solar:refresh-outline" className="text-lg" />
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-lighterror border border-red-200 p-4 text-error text-sm flex items-center gap-2">
          <Icon icon="solar:danger-triangle-outline" className="text-xl shrink-0" />
          {error}
        </div>
      )}

      {/* ── Skeleton ───────────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* Section 1: GA4 */}
          <SectionTitle>
            <AnalyticsIcon className="inline-block w-5 h-5 mr-1 text-blue-500 align-text-bottom" />
            Lưu lượng truy cập (Google Analytics)
          </SectionTitle>

          {data.ga4 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard icon="solar:users-group-rounded-bold-duotone" bg="bg-blue-500"
                  label="Sessions" value={fmt(data.ga4.summary.sessions)} />
                <StatCard icon="solar:user-bold-duotone" bg="bg-indigo-500"
                  label="Users" value={fmt(data.ga4.summary.users)} />
                <StatCard icon="solar:eye-bold-duotone" bg="bg-violet-500"
                  label="Pageviews" value={fmt(data.ga4.summary.pageviews)} />
                <StatCard icon="solar:logout-2-bold-duotone" bg="bg-orange-500"
                  label="Bounce Rate" value={`${data.ga4.summary.bounce_rate}%`} />
                <StatCard icon="solar:clock-circle-bold-duotone" bg="bg-teal-500"
                  label="Thời gian TB / phiên"
                  value={fmtDur(data.ga4.summary.avg_session_duration)} />
              </div>

              {data.ga4.top_pages.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-dark">Top 10 trang phổ biến nhất</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-5 py-3 text-left">#</th>
                          <th className="px-5 py-3 text-left">Trang</th>
                          <th className="px-5 py-3 text-right">Lượt xem</th>
                          <th className="px-5 py-3 text-right">Người dùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.ga4.top_pages.map((page, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-5 py-3">
                              <p className="font-medium text-dark truncate max-w-xs">
                                {page.title || page.path}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-xs">{page.path}</p>
                            </td>
                            <td className="px-5 py-3 text-right font-semibold">{fmt(page.pageviews)}</td>
                            <td className="px-5 py-3 text-right text-gray-600">{fmt(page.users)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Nguồn truy cập + Thiết bị + Quốc gia */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Nguồn truy cập */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
                      <Icon icon="solar:routing-bold-duotone" className="text-blue-500" />
                      Nguồn truy cập
                    </h3>
                  </div>
                  {data.ga4.traffic_sources.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {data.ga4.traffic_sources.map((s, i) => {
                        const total = data.ga4!.traffic_sources.reduce((a, x) => a + x.sessions, 0);
                        const pct = total > 0 ? Math.round((s.sessions / total) * 100) : 0;
                        return (
                          <div key={i} className="px-5 py-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon icon={sourceIcon(s.source)} className="text-base shrink-0 text-blue-400" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-dark truncate">{fmtSource(s.source)}</p>
                                  <p className="text-xs text-gray-400">{fmtMedium(s.medium)}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-semibold">{fmt(s.sessions)}</p>
                                <p className="text-xs text-gray-400">{fmt(s.users)} users</p>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{pct}% tổng phiên</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-5 py-4 text-sm text-gray-400">Chưa có dữ liệu</p>
                  )}
                </div>

                {/* Thiết bị */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
                      <Icon icon="solar:devices-bold-duotone" className="text-violet-500" />
                      Loại thiết bị
                    </h3>
                  </div>
                  {data.ga4.devices.length > 0 ? (
                    <>
                      <div className="divide-y divide-gray-100">
                        {data.ga4.devices.map((d, i) => {
                          const total = data.ga4!.devices.reduce((a, x) => a + x.sessions, 0);
                          const pct = total > 0 ? Math.round((d.sessions / total) * 100) : 0;
                          const icon = d.device === 'mobile'
                            ? 'solar:smartphone-bold-duotone'
                            : d.device === 'tablet'
                            ? 'solar:tablet-bold-duotone'
                            : 'solar:monitor-bold-duotone';
                          const label = d.device === 'mobile' ? 'Di động' : d.device === 'tablet' ? 'Máy tính bảng' : 'Máy tính';
                          return (
                            <div key={i} className="px-5 py-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-dark flex items-center gap-1">
                                  <Icon icon={icon} className="text-violet-400" />
                                  {label}
                                </span>
                                <span className="text-sm font-semibold">{pct}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{fmt(d.sessions)} phiên</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="px-5 py-4 text-sm text-gray-400">Chưa có dữ liệu</p>
                  )}
                </div>

                {/* Quốc gia */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
                      <Icon icon="solar:global-bold-duotone" className="text-teal-500" />
                      Quốc gia
                    </h3>
                  </div>
                  {data.ga4.countries.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {data.ga4.countries.map((c, i) => (
                        <div key={i} className="px-5 py-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-dark truncate">{c.country}</p>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">{fmt(c.sessions)}</p>
                            <p className="text-xs text-gray-400">{fmt(c.users)} users</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-4 text-sm text-gray-400">Chưa có dữ liệu</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-5 text-center text-sm text-gray-400">
              <Icon icon="solar:chart-square-outline" className="text-3xl mb-2 mx-auto text-gray-300" />
              <p>Google Analytics chưa được kết nối.</p>
              <p className="text-xs mt-1">Cấu hình <code className="font-mono">GA4_PROPERTY_ID</code> để xem traffic website.</p>
            </div>
          )}

          {/* Section 2 & 3: Database */}
          <SectionTitle>
            <Icon icon="solar:user-plus-bold-duotone" className="inline mr-1 text-green-500" />
            Thống kê tài khoản
          </SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              icon="solar:user-plus-bold-duotone" bg="bg-green-500"
              label="Tài khoản mới hôm nay"
              value={fmt(data.new_users_today.count)}
              sub={
                <div className="flex items-center gap-2">
                  <GrowthBadge pct={data.new_users_today.growth_percent} />
                  <span className="text-xs text-gray-400">so với hôm qua</span>
                </div>
              }
            />
            <StatCard
              icon="solar:restart-bold-duotone" bg="bg-amber-500"
              label="Tài khoản cũ đăng nhập lại (hôm nay)"
              value={fmt(todayRetCount)}
              sub={
                <span className="text-xs text-gray-400">
                  Retention — tài khoản tạo trước hôm nay
                </span>
              }
            />
          </div>

          {/* Combined area chart */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="text-sm font-semibold text-dark mb-4">
              Biến động tài khoản 30 ngày gần nhất
            </h3>
            <Chart
              type="area"
              height={280}
              series={[
                { name: 'Tài khoản mới',          data: newFilled.map((d) => d.count) },
                { name: 'Tài khoản cũ quay lại',  data: retFilled.map((d) => d.count) },
              ]}
              options={areaOptions(chartLabels) as Record<string, unknown>}
            />
          </div>

          {/* Individual bar charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-sm font-semibold text-dark mb-1">
                Tài khoản đăng ký mới / ngày
              </h3>
              <p className="text-xs text-gray-400 mb-4">30 ngày gần nhất</p>
              <Chart
                type="bar"
                height={200}
                series={[{ name: 'Tài khoản mới', data: newFilled.map((d) => d.count) }]}
                options={barOptions(chartLabels, '#5b73e8') as Record<string, unknown>}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-sm font-semibold text-dark mb-1">
                Tài khoản cũ đăng nhập lại / ngày
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Unique users có created_at &lt; ngày đăng nhập
              </p>
              <Chart
                type="bar"
                height={200}
                series={[{ name: 'Tài khoản cũ quay lại', data: retFilled.map((d) => d.count) }]}
                options={barOptions(chartLabels, '#f59e0b') as Record<string, unknown>}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
