import axiosClient from './axiosClient';

export const safeAPI = {
  getSafes: (params) => {
    return axiosClient.get('/api/safes', { params });
  },

  getSafe: (id) => {
    return axiosClient.get(`/api/safes/${id}`);
  },

  getBalance: (params) => {
    return axiosClient.get('/api/safes/balance', { params });
  },

  createSafe: (data) => {
    return axiosClient.post('/api/safes', data);
  },

  updateSafe: (id, data) => {
    return axiosClient.patch(`/api/safes/${id}`, data);
  },

  deleteSafe: (id) => {
    return axiosClient.delete(`/api/safes/${id}`);
  },
};
