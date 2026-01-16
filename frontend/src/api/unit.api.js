import axiosClient from './axiosClient';

export const unitAPI = {
  getUnits: (params) => {
    return axiosClient.get('/api/units', { params });
  },

  getUnit: (id) => {
    return axiosClient.get(`/api/units/${id}`);
  },

  createUnit: (data) => {
    return axiosClient.post('/api/units', data);
  },

  updateUnit: (id, data) => {
    return axiosClient.patch(`/api/units/${id}`, data);
  },

  deleteUnit: (id) => {
    return axiosClient.delete(`/api/units/${id}`);
  },
};
