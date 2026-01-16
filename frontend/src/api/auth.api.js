import axiosClient from './axiosClient';

export const authAPI = {
  login: (credentials) => {
    return axiosClient.post('/api/auth/login', credentials);
  },

  logout: () => {
    return axiosClient.post('/api/auth/logout');
  },

  getCurrentUser: () => {
    return axiosClient.get('/api/auth/me');
  },

  refreshToken: (refreshToken) => {
    return axiosClient.post('/api/auth/refresh', { refresh_token: refreshToken });
  },
};
