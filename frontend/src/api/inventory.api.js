import axiosClient from './axiosClient';

export const inventoryAPI = {
  getInventories: (params) => {
    return axiosClient.get('/api/inventories', { params });
  },

  getInventory: (id) => {
    return axiosClient.get(`/api/inventories/${id}`);
  },

  createInventory: (data) => {
    return axiosClient.post('/api/inventories', data);
  },

  updateInventory: (id, data) => {
    return axiosClient.patch(`/api/inventories/${id}`, data);
  },

  deleteInventory: (id) => {
    return axiosClient.delete(`/api/inventories/${id}`);
  },

  // Nhập kho
  createInventoryIn: (data) => {
    return axiosClient.post('/api/inventory-in', data);
  },

  getInventoryIns: (params) => {
    return axiosClient.get('/api/inventory-in', { params });
  },

  // Xuất kho
  createInventoryOut: (data) => {
    return axiosClient.post('/api/inventory-out', data);
  },

  getInventoryOuts: (params) => {
    return axiosClient.get('/api/inventory-out', { params });
  },
};
