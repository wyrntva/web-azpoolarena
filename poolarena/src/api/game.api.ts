import api from '@/config/axios';

export const gameAPI = {
  getGames: () => api.get('/games'),
  createGame: (data: any) => api.post('/games', data),
  updateGame: (id: string, data: any) => api.put(`/games/${id}`, data),
  deleteGame: (id: string) => api.delete(`/games/${id}`),
};
