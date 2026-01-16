import axiosClient from './axiosClient';

export const categoryAPI = {
  getCategories: (params) => {
    const url = '/api/categories';
    return axiosClient.get(url, { params });
  },

  createCategory: (data) => {
    const url = '/api/categories';
    return axiosClient.post(url, data);
  },

  updateCategory: (id, data) => {
    const url = `/api/categories/${id}`;
    return axiosClient.patch(url, data);
  },

  deleteCategory: (id) => {
    const url = `/api/categories/${id}`;
    return axiosClient.delete(url);
  },
};
