import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { liveScoreAPI, type TableLiveScore } from '../../api/liveScore.api';

const MODE_LABELS: Record<string, string> = {
  two: '2 người',
  multi: 'Nhiều người',
  cards: 'Thẻ bài',
  multiQuick: 'Nhanh',
};

const REFRESH_INTERVAL = 5000;

function timeSince(isoString: string) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 5) return 'vừa xong';
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
  return `${Math.floor(diff / 3600)}h trước`;
}

function ScoreCard({ data }: { data: TableLiveScore }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const maxScore = Math.max(...data.players.map(p => p.score), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Icon icon="solar:billiards-outline" className="text-indigo-500 shrink-0" width={20} />
          <span className="font-semibold text-gray-800 dark:text-white text-sm truncate max-w-[140px]">
            {data.table_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="indigo" className="text-xs font-medium px-2 py-0.5">
            {MODE_LABELS[data.mode] ?? data.mode}
          </Badge>
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
            {timeSince(data.updated_at)}
          </span>
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-col gap-2 px-4 py-3 flex-1">
        {data.players.map((player, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {/* Color dot */}
            <span
              className="shrink-0 rounded-full border border-white shadow-sm"
              style={{ width: 12, height: 12, background: player.color ?? '#ccc' }}
            />
            {/* Name */}
            <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate min-w-0">
              {player.name || `Người chơi ${idx + 1}`}
            </span>
            {/* Score bar */}
            <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((player.score / maxScore) * 100)}%`,
                  background: player.color ?? '#6366f1',
                }}
              />
            </div>
            {/* Score */}
            <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums w-8 text-right shrink-0">
              {player.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const LiveScores = () => {
  const [tables, setTables] = useState<TableLiveScore[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchingRef = useRef(false);

  const fetchScores = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await liveScoreAPI.getAll();
      const raw = res.data ?? {};
      const list = Object.values(raw).sort((a, b) =>
        a.table_name.localeCompare(b.table_name, 'vi'),
      );
      setTables(list);
      setLastUpdated(new Date());
    } catch {
      // silent fail on auto-refresh
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const id = setInterval(fetchScores, REFRESH_INTERVAL);
    return () => clearInterval(id);
    // fetchScores is stable (useCallback with []), safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bảng tỉ số trực tiếp</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Cập nhật mỗi {REFRESH_INTERVAL / 1000} giây
          {lastUpdated && (
            <> · Lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}</>
          )}
        </p>
      </div>

      {/* Content */}
      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon icon="solar:monitor-smartphone-outline" width={48} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có bàn nào đang tính điểm</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Khi thiết bị bảng tỉ số bắt đầu trận, điểm số sẽ hiển thị tại đây
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map(t => (
            <ScoreCard key={t.table_name} data={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveScores;
