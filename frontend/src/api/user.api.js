import axiosClient from './axiosClient';

export const userAPI = {
  getUsers: (params) => {
    return axiosClient.get('/api/users', { params });
  },

  getAll: (params) => {
    return axiosClient.get('/api/users', { params });
  },

  getUser: (id) => {
    return axiosClient.get(`/api/users/${id}`);
  },

  createUser: (data) => {
    return axiosClient.post('/api/users', data);
  },

  updateUser: (id, data) => {
    return axiosClient.patch(`/api/users/${id}`, data);
  },

  deleteUser: (id) => {
    return axiosClient.delete(`/api/users/${id}`);
  },

  updateDisplayOrder: (userOrders) => {
    return axiosClient.post('/api/users/update-display-order', {
      user_orders: userOrders
    });
  },
};
