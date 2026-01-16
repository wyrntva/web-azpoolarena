import axiosClient from './axiosClient';

export const exchangeAPI = {
  getExchanges: (params) => {
    return axiosClient.get('/api/exchanges', { params });
  },

  getExchange: (id) => {
    return axiosClient.get(`/api/exchanges/${id}`);
  },

  createExchange: (data) => {
    return axiosClient.post('/api/exchanges', data);
  },

  updateExchange: (id, data) => {
    return axiosClient.patch(`/api/exchanges/${id}`, data);
  },

  deleteExchange: (id) => {
    return axiosClient.delete(`/api/exchanges/${id}`);
  },
};
