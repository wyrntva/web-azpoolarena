import api from '@/config/axios';

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
  created_at: string;
  updated_at: string;
}

export interface NewsListResponse {
  items: NewsArticle[];
  total: number;
  page: number;
  limit: number;
}

export const newsPublicAPI = {
  getAll: (page = 1, limit = 100, search = '', category = '') =>
    api.get<NewsListResponse>('/api/news', {
      params: { page, limit, ...(search ? { search } : {}), ...(category ? { category } : {}) },
    }),

  getOne: (id: number) =>
    api.get<NewsArticle>(`/api/news/${id}`),
};
