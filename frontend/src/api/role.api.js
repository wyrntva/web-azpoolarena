import axiosClient from './axiosClient';

export const roleAPI = {
  getRoles: (params) => {
    return axiosClient.get('/api/roles', { params });
  },

  getRole: (id) => {
    return axiosClient.get(`/api/roles/${id}`);
  },

  createRole: (data) => {
    return axiosClient.post('/api/roles', data);
  },

  updateRole: (id, data) => {
    return axiosClient.patch(`/api/roles/${id}`, data);
  },

  deleteRole: (id) => {
    return axiosClient.delete(`/api/roles/${id}`);
  },
};
