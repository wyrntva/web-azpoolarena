import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { LoginCredentials, LoginResponse, User } from '../types/api';

export const authAPI = {
    login: (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> => {
        return axiosClient.post('/api/auth/login', credentials);
    },

    logout: (): Promise<AxiosResponse<void>> => {
        return axiosClient.post('/api/auth/logout');
    },

    getCurrentUser: (): Promise<AxiosResponse<User>> => {
        return axiosClient.get('/api/auth/me');
    },

    refreshToken: (refreshToken: string): Promise<AxiosResponse<LoginResponse>> => {
        return axiosClient.post('/api/auth/refresh', { refresh_token: refreshToken });
    },
};
