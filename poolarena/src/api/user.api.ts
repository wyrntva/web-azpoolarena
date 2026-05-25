import api from '@/config/axios';

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  getUserStats: () => api.get('/user/stats'),
};
