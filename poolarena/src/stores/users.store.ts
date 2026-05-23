import { create } from 'zustand';

type RankFilter = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'K' | undefined;
type OnlineFilter = 'online' | 'offline' | undefined;

interface UsersFilterState {
  search: string;
  rank: RankFilter;
  online: OnlineFilter;
  setSearch: (value: string) => void;
  setRank: (value: RankFilter) => void;
  setOnline: (value: OnlineFilter) => void;
  reset: () => void;
}

export const useUsersFilterStore = create<UsersFilterState>((set) => ({
  search: '',
  rank: undefined,
  online: undefined,
  setSearch: (value) => set({ search: value }),
  setRank: (value) => set({ rank: value }),
  setOnline: (value) => set({ online: value }),
  reset: () => set({ search: '', rank: undefined, online: undefined }),
}));


