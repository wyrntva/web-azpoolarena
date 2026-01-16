import axiosClient from './axiosClient';

export const receiptAPI = {
  getReceipts: (params) => {
    return axiosClient.get('/api/receipts', { params });
  },

  getReceipt: (id) => {
    return axiosClient.get(`/api/receipts/${id}`);
  },

  createReceipt: (data) => {
    return axiosClient.post('/api/receipts', data);
  },

  updateReceipt: (id, data) => {
    return axiosClient.patch(`/api/receipts/${id}`, data);
  },

  deleteReceipt: (id) => {
    return axiosClient.delete(`/api/receipts/${id}`);
  },
};
