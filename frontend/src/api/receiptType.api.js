import axiosClient from './axiosClient';

export const receiptTypeAPI = {
  getReceiptTypes: (params) => {
    return axiosClient.get('/api/receipt-types', { params });
  },

  getReceiptType: (id) => {
    return axiosClient.get(`/api/receipt-types/${id}`);
  },

  createReceiptType: (data) => {
    return axiosClient.post('/api/receipt-types', data);
  },

  updateReceiptType: (id, data) => {
    return axiosClient.patch(`/api/receipt-types/${id}`, data);
  },

  deleteReceiptType: (id) => {
    return axiosClient.delete(`/api/receipt-types/${id}`);
  },
};
