import api from '@/config/axios';
import { UsersResponse } from '@/types/user.types';

export const usersAPI = {
  getUsers: (): Promise<UsersResponse> => api.get('/api/pool-arena/users').then(res => res.data),
};
