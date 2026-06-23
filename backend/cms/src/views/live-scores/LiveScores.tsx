import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from 'flowbite-react';
import { Icon } from '@iconify/react';
import mqtt from 'mqtt';
import { liveScoreAPI, type TableLiveScore, type LiveScorePlayer } from '../../api/liveScore.api';

const MODE_LABELS: Record<string, string> = {
  two: '2 người',
  multi: 'Nhiều người',
  cards: 'Thẻ bài',
  multiQuick: 'Nhanh',
};

function timeSince(isoString: string) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 5) return 'vừa xong';
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
  return `${Math.floor(diff / 3600)}h trước`;
}

function ScoreCard({
  data,
  isOnline,
  onPublishCommand,
}: {
  data: TableLiveScore & { device_code?: string | null };
  isOnline: boolean;
  onPublishCommand: (deviceCode: string, payload: any) => void;
}) {
  const [, forceUpdate] = useState(0);
  const [editingName, setEditingName] = useState<number | null>(null);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (editingName !== null) nameInputRef.current?.focus();
  }, [editingName]);

  const maxScore = Math.max(...data.players.map(p => p.score), 1);

  function startEditName(idx: number, current: string) {
    if (!isOnline || !data.device_code) return;
    setEditingName(idx);
    setNameValue(current);
  }

  function commitName(idx: number) {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === data.players[idx].name) {
      setEditingName(null);
      return;
    }
    const updatedPlayers = data.players.map((p, i) => (i === idx ? { ...p, name: trimmed } : p));
    if (data.device_code) {
      onPublishCommand(data.device_code, { action: 'update_players', players: updatedPlayers });
    }
    setEditingName(null);
  }

  function changeScore(idx: number, delta: number) {
    if (!isOnline || !data.device_code) return;
    const currentScore = data.players[idx].score ?? 0;
    const isTwoPlayer = data.mode === 'two';
    const newScore = isTwoPlayer ? Math.max(0, currentScore + delta) : currentScore + delta;
    const updatedPlayers = data.players.map((p, i) => (i === idx ? { ...p, score: newScore } : p));
    if (data.device_code) {
      onPublishCommand(data.device_code, { action: 'update_players', players: updatedPlayers });
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 ${isOnline ? 'border-gray-100 dark:border-gray-700' : 'border-gray-200/60 dark:border-gray-700/60 opacity-70'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Icon icon="solar:billiards-outline" className={isOnline ? 'text-indigo-500 shrink-0' : 'text-gray-400 shrink-0'} width={20} />
          <span className="font-semibold text-gray-800 dark:text-white text-sm truncate max-w-[120px]">
            {data.table_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {data.mode && isOnline && (
            <Badge color="indigo" className="text-xs font-medium px-2 py-0.5">
              {MODE_LABELS[data.mode] ?? data.mode}
            </Badge>
          )}
        </div>
      </div>

      {/* Screen Control */}
      {isOnline && data.device_code && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0">
            <Icon icon="solar:display-outline" width={14} /> Màn hình:
          </span>
          <select
            value={data.mode || 'home'}
            onChange={(e) => {
              const val = e.target.value;
              let page = 'home';
              let mode = '';
              if (val === 'two') { page = 'ScorePage'; mode = 'two'; }
              else if (val === 'multi') { page = 'MultiScorePage'; mode = 'multi'; }
              else if (val === 'cards') { page = 'MultiCardScorePage'; mode = 'cards'; }
              else if (val === 'multiQuick') { page = 'MultiQuickAddPage'; mode = 'multiQuick'; }
              
              // Optimistically update local state for immediate dropdown response
              setTables(prev => prev.map(t => {
                if (t.device_code === data.device_code) {
                  return { ...t, mode: mode || null };
                }
                return t;
              }));

              onPublishCommand(data.device_code!, { action: 'open_page', page, mode });
            }}
            className="text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 outline-none cursor-pointer max-w-[140px] truncate"
          >
            <option value="home">Trang chủ</option>
            <option value="two">2 Người</option>
            <option value="multi">Nhiều người</option>
            <option value="cards">Thẻ bài</option>
            <option value="multiQuick">Nhanh</option>
          </select>
        </div>
      )}

      {/* Reset Actions */}
      {isOnline && data.device_code && data.mode && data.mode !== 'home' && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-700/10 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              if (window.confirm(`Bạn muốn reset TỈ SỐ của ${data.table_name}?`)) {
                onPublishCommand(data.device_code!, { action: 'reset_scores' });
              }
            }}
            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/30 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
            title="Reset điểm số của tất cả người chơi về 0"
          >
            <Icon icon="solar:restart-outline" width={12} /> Reset tỉ số
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Bạn muốn reset TRẬN ĐẤU (bao gồm cả tên và lịch sử) của ${data.table_name}?`)) {
                onPublishCommand(data.device_code!, { action: 'reset_match' });
              }
            }}
            className="text-[11px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
            title="Reset toàn bộ trận đấu (điểm, tên người chơi, lịch sử)"
          >
            <Icon icon="solar:trash-bin-trash-outline" width={12} /> Reset trận đấu
          </button>
        </div>
      )}

      {/* Players or Empty State */}
      <div className="flex flex-col gap-2 px-4 py-3 flex-1 justify-center">
        {!isOnline ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">
            <Icon icon="solar:plug-connection-broken-outline" width={32} className="mx-auto mb-1.5 opacity-40" />
            Thiết bị ngoại tuyến
          </div>
        ) : !data.mode || !data.players || data.players.length === 0 ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">
            <Icon icon="solar:tea-cup-outline" width={32} className="mx-auto mb-1.5 opacity-40" />
            Bàn rảnh (Chờ khởi động)
          </div>
        ) : (
          data.players.map((player, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {/* Color dot */}
              <span
                className="shrink-0 rounded-full border border-white shadow-sm"
                style={{ width: 12, height: 12, background: player.color ?? '#ccc' }}
              />

              {/* Name — click to edit */}
              {editingName === idx ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onBlur={() => commitName(idx)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitName(idx);
                    if (e.key === 'Escape') setEditingName(null);
                  }}
                  className="flex-1 min-w-0 text-sm border border-indigo-400 rounded px-1.5 py-0.5 outline-none dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <button
                  onClick={() => startEditName(idx, player.name)}
                  disabled={!isOnline || !data.device_code}
                  title={isOnline ? "Bấm để đổi tên" : ""}
                  className={`flex-1 min-w-0 text-sm text-left truncate transition-colors ${isOnline ? 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline' : 'text-gray-400 cursor-default'}`}
                >
                  {player.name || `Người chơi ${idx + 1}`}
                </button>
              )}

              {/* Score bar */}
              <div className="w-20 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((player.score / maxScore) * 100)}%`,
                    background: player.color ?? '#6366f1',
                  }}
                />
              </div>

              {/* Score stepper */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => changeScore(idx, -1)}
                  disabled={!isOnline || !data.device_code || (data.mode === 'two' && player.score <= 0)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon icon="solar:minus-circle-linear" width={16} />
                </button>
                <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums w-6 text-center">
                  {player.score}
                </span>
                <button
                  onClick={() => changeScore(idx, +1)}
                  disabled={!isOnline || !data.device_code}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon icon="solar:add-circle-linear" width={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const LiveScores = () => {
  const [tables, setTables] = useState<(TableLiveScore & { device_code?: string | null })[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchingRef = useRef(false);
  const mqttClientRef = useRef<any>(null);

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
      // silent fail
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Initial Load
    fetchScores();

    // 2. Setup MQTT over WebSockets
    const getMqttUrl = () => {
      const hostname = window.location.hostname;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
      
      if (isLocal) {
        return `ws://${hostname}:9001`;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/mqtt`;
    };

    const mqttUrl = getMqttUrl();
    const client = mqtt.connect(mqttUrl);
    mqttClientRef.current = client;

    client.on('connect', () => {
      console.log('[MQTT] Connected to WebSockets broker at', mqttUrl);
      client.subscribe('azpool/scoreboard/+/state');
      client.subscribe('azpool/scoreboard/+/status');
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const topicParts = topic.split('/');
        const deviceCode = topicParts[2];
        const type = topicParts[3]; // 'state' or 'status'

        if (type === 'status') {
          const isOnline = payload.status === 'online';
          setOnlineStatus(prev => ({ ...prev, [deviceCode]: isOnline }));
        } else if (type === 'state') {
          setTables(prev => prev.map(t => {
            if (t.device_code === deviceCode || t.table_name === payload.table_name) {
              return {
                ...t,
                device_code: deviceCode,
                mode: payload.mode,
                players: payload.players,
                updated_at: payload.updated_at || new Date().toISOString()
              };
            }
            return t;
          }));
          // Set device to online automatically when we receive its state
          setOnlineStatus(prev => ({ ...prev, [deviceCode]: true }));
        }
      } catch (e) {
        console.error('[MQTT] Message error:', e);
      }
    });

    return () => {
      if (client) {
        client.end();
      }
    };
  }, [fetchScores]);

  const handlePublishCommand = useCallback((deviceCode: string, payload: any) => {
    if (!mqttClientRef.current) return;
    const topic = `azpool/scoreboard/${deviceCode}/control`;
    try {
      mqttClientRef.current.publish(topic, JSON.stringify(payload));
      console.log(`[MQTT] Published control command to ${topic}:`, payload);
    } catch (e) {
      console.error('[MQTT] Publish error:', e);
    }
  }, []);

  return (
    <div className="pt-0 px-6 pb-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
            BẢNG TỈ SỐ TRỰC TIẾP
            <Badge color="green" className="text-xs font-semibold px-2.5 py-0.5">Real-time</Badge>
          </h1>
        </div>
      </div>

      {/* Content */}
      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon icon="solar:monitor-smartphone-outline" width={48} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy bàn nào</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Vui lòng đăng ký thiết bị/bàn trong phần Cấu hình Hệ thống
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map(t => {
            const isOnline = t.device_code ? !!onlineStatus[t.device_code] : false;
            return (
              <ScoreCard
                key={t.table_name}
                data={t}
                isOnline={isOnline}
                onPublishCommand={handlePublishCommand}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveScores;
