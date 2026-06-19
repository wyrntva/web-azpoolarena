import axiosClient from './axiosClient';

export interface LiveScorePlayer {
  name: string;
  score: number;
  color?: string;
}

export interface TableLiveScore {
  table_name: string;
  mode: string;
  players: LiveScorePlayer[];
  updated_at: string;
}

export const liveScoreAPI = {
  getAll: () =>
    axiosClient.get<Record<string, TableLiveScore>>('/api/tournaments/device/live-score'),

  getByTable: (tableName: string) =>
    axiosClient.get<TableLiveScore | null>(`/api/tournaments/device/live-score?table_name=${encodeURIComponent(tableName)}`),
};
