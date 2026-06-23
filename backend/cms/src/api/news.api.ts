import axiosClient from './axiosClient';

export interface NewsArticle {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
  content: string[];
  featured: boolean;
  fanpage_image?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsListResponse {
  items: NewsArticle[];
  total: number;
  page: number;
  limit: number;
}

export interface NewsPayload {
  title: string;
  category: string;
  date: string;
  author: string;
  image?: string;
  excerpt: string;
  content: string[];
  featured?: boolean;
  fanpage_image?: string;
  post_to_fanpage?: boolean;
}

export const newsAPI = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/api/news/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },

  getAll: (page = 1, limit = 10, search = ''): Promise<{ data: NewsListResponse }> =>
    axiosClient.get('/api/news', { params: { page, limit, search } }),

  getOne: (id: number): Promise<{ data: NewsArticle }> =>
    axiosClient.get(`/api/news/${id}`),

  create: (payload: NewsPayload): Promise<{ data: NewsArticle }> =>
    axiosClient.post('/api/news', payload),

  update: (id: number, payload: Partial<NewsPayload>): Promise<{ data: NewsArticle }> =>
    axiosClient.put(`/api/news/${id}`, payload),

  delete: (id: number): Promise<void> =>
    axiosClient.delete(`/api/news/${id}`),
};
