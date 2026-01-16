import axiosClient from './axiosClient';

export const debtAPI = {
  getDebts: (params) => {
    return axiosClient.get('/api/debts', { params });
  },

  getDebt: (id) => {
    return axiosClient.get(`/api/debts/${id}`);
  },

  createDebt: (data) => {
    return axiosClient.post('/api/debts', data);
  },

  updateDebt: (id, data) => {
    return axiosClient.patch(`/api/debts/${id}`, data);
  },

  payDebt: (id, data) => {
    return axiosClient.post(`/api/debts/${id}/pay`, data);
  },

  deleteDebt: (id) => {
    return axiosClient.delete(`/api/debts/${id}`);
  },
};
