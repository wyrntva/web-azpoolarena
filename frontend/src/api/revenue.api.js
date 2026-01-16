import axiosClient from './axiosClient';

export const revenueAPI = {
  getRevenues: (params) => {
    return axiosClient.get('/api/revenues', { params });
  },

  getRevenue: (id) => {
    return axiosClient.get(`/api/revenues/${id}`);
  },

  getRevenueByDate: (date) => {
    return axiosClient.get(`/api/revenues/by-date/${date}`);
  },

  createRevenue: (data) => {
    return axiosClient.post('/api/revenues', data);
  },

  updateRevenue: (id, data) => {
    return axiosClient.patch(`/api/revenues/${id}`, data);
  },

  deleteRevenue: (id) => {
    return axiosClient.delete(`/api/revenues/${id}`);
  },
};
